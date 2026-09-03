-- ============================================================
-- ROAMLY — Migrazione: Funzione RPC + scheduling (N3)
-- Da lanciare nel SQL Editor di Supabase DOPO aver deployato
-- la Edge Function invia-notifiche-prenotazioni.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Funzione che seleziona chi notificare oggi
-- ------------------------------------------------------------
-- Per ogni prenotazione (wallet) con data = oggi + anticipo
-- scelto da quel membro, per ogni membro del viaggio con
-- notifiche attive e almeno un dispositivo registrato — esclude
-- chi ha già ricevuto il promemoria per quella prenotazione.
CREATE OR REPLACE FUNCTION prenotazioni_da_notificare()
RETURNS TABLE (
  prenotazione_id uuid,
  nome            text,
  data            date,
  user_id         uuid,
  endpoint        text,
  p256dh          text,
  auth_key        text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.id   AS prenotazione_id,
    w.nome,
    w.data,
    vm.user_id,
    ps.endpoint,
    ps.p256dh,
    ps.auth_key
  FROM wallet w
  JOIN viaggio_membri vm ON vm.viaggio_id = w.viaggio_id
  JOIN profili pr        ON pr.id = vm.user_id
  JOIN push_subscriptions ps ON ps.user_id = vm.user_id
  WHERE pr.notifiche_prenotazioni = true
    AND w.data = (CURRENT_DATE + (pr.notifiche_anticipo_giorni || ' days')::interval)::date
    AND NOT EXISTS (
      SELECT 1 FROM notifiche_inviate ni
      WHERE ni.prenotazione_id = w.id AND ni.user_id = vm.user_id
    );
$$;

-- ------------------------------------------------------------
-- 2. Scheduling — gira ogni giorno alle 9:00 (ora del server,
--    UTC su Supabase). Richiede le estensioni pg_cron e pg_net,
--    attivabili da Database → Extensions nella dashboard.
-- ------------------------------------------------------------
-- Sostituisci i due placeholder tra <> prima di lanciare:
--   <tonvixjrrhpbjxgrzjgi>          → l'ID del tuo progetto Supabase
--                             (visibile nell'URL della dashboard)
--   <eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvbnZpeGpycmhwYmp4Z3J6amdpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTM1OTA2MSwiZXhwIjoyMDk2OTM1MDYxfQ.JwT5SbD-ABTnsozCKrFXICQQFhm-jWqohnk7yszcKwo>     → Project Settings → API → service_role
--                             (quella segreta, non la anon)

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'invia-notifiche-prenotazioni-giornaliero',
  '0 9 * * *',  -- ogni giorno alle 9:00 UTC
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/invia-notifiche-prenotazioni',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Per verificare che sia schedulato: SELECT * FROM cron.job;
-- Per rimuoverlo in futuro: SELECT cron.unschedule('invia-notifiche-prenotazioni-giornaliero');
