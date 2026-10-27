-- ============================================================
-- ROAMLY — Migrazione: notifica "Un anno fa" (blocco H)
-- Da lanciare nel SQL Editor di Supabase, PRIMA di deployare la
-- Edge Function invia-notifiche-anniversari.
--
-- Ogni giorno la funzione cerca, per ogni persona con
-- profili.notifiche_anniversari = true, un ricordo scritto lo
-- stesso giorno e mese di un anno passato. Ne sceglie UNO solo
-- (il più preferito / più vecchio) per non riempire di avvisi, e
-- lo registra in anniversari_inviati per non ripeterlo.
-- ============================================================

CREATE TABLE IF NOT EXISTS anniversari_inviati (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ricordo_id  uuid NOT NULL REFERENCES ricordi(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anno        int  NOT NULL,                       -- anno in cui è stato inviato
  inviata_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ricordo_id, user_id, anno)
);

-- Come notifiche_inviate: la legge e scrive solo la Edge Function
-- (service role). Nessuna policy per il client.
ALTER TABLE anniversari_inviati ENABLE ROW LEVEL SECURITY;

-- Un ricordo per persona: preferiti prima, poi il più vecchio.
-- NB: confronta giorno e mese di OGGI (UTC) con la data del ricordo.
-- Un ricordo del 29 febbraio compare solo negli anni bisestili.
CREATE OR REPLACE FUNCTION anniversari_da_notificare()
RETURNS TABLE (
  ricordo_id uuid,
  user_id    uuid,
  titolo     text,
  luogo      text,
  anni_fa    int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT ON (r.user_id)
    r.id          AS ricordo_id,
    r.user_id,
    r.titolo,
    r.luogo,
    (EXTRACT(YEAR FROM CURRENT_DATE)::int - EXTRACT(YEAR FROM r.data)::int) AS anni_fa
  FROM ricordi r
  JOIN profili pr ON pr.id = r.user_id
  WHERE pr.notifiche_anniversari = true
    AND EXTRACT(MONTH FROM r.data) = EXTRACT(MONTH FROM CURRENT_DATE)
    AND EXTRACT(DAY   FROM r.data) = EXTRACT(DAY   FROM CURRENT_DATE)
    AND EXTRACT(YEAR  FROM r.data) < EXTRACT(YEAR  FROM CURRENT_DATE)
    -- una sola notifica al giorno per persona: se oggi ne è già partita una
    -- (anche per un altro ricordo), non ne arrivano altre se la funzione riparte
    AND NOT EXISTS (
      SELECT 1 FROM anniversari_inviati ai
      WHERE ai.user_id = r.user_id
        AND ai.inviata_at::date = CURRENT_DATE
    )
  ORDER BY r.user_id, r.preferito DESC, r.data ASC;
$$;

-- ------------------------------------------------------------
-- Scheduling: ogni giorno alle 9:30 UTC (10:30/11:30 in Italia).
-- Stesso schema del promemoria prenotazioni: header `apikey` con la
-- secret key "cron_notifiche" (NON la service_role legacy).
-- Sostituisci i due segnaposto prima di lanciare:
--   <PROJECT_REF>        → ID del progetto Supabase
--   <CRON_SECRET_KEY>    → la secret key "cron_notifiche"
--                          (Settings → API Keys). Non incollarla mai
--                          in un file che finisce su GitHub.
-- ------------------------------------------------------------
SELECT cron.schedule(
  'invia-notifiche-anniversari-giornaliero',
  '30 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/invia-notifiche-anniversari',
    headers := jsonb_build_object(
      'apikey', '<CRON_SECRET_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Verifica: SELECT * FROM cron.job;
-- Prova a mano (senza aspettare le 9:30): SELECT * FROM anniversari_da_notificare();
-- Rimozione:  SELECT cron.unschedule('invia-notifiche-anniversari-giornaliero');
