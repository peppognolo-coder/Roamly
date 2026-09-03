-- ============================================================
-- ROAMLY — Migrazione: Log notifiche inviate (N3)
-- Da lanciare nel SQL Editor di Supabase, PRIMA di deployare
-- la Edge Function.
--
-- Senza questa tabella, ogni volta che la funzione schedulata
-- gira ricontrollerebbe le stesse prenotazioni e manderebbe lo
-- stesso promemoria più volte finché la data non passa.
-- ============================================================

CREATE TABLE IF NOT EXISTS notifiche_inviate (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prenotazione_id uuid NOT NULL REFERENCES wallet(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inviata_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (prenotazione_id, user_id)
);

-- RLS abilitata per coerenza — in pratica questa tabella la legge
-- e scrive solo la Edge Function con la service_role key, che
-- scavalca RLS by design. Nessuna policy pubblica: dal client
-- (anon/authenticated) questa tabella resta invisibile.
ALTER TABLE notifiche_inviate ENABLE ROW LEVEL SECURITY;
