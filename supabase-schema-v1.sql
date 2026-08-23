-- ============================================================
-- ROAMLY — DATABASE SCHEMA V1
-- Premium Travel Memory Book
-- Eseguire integralmente nell'editor SQL di Supabase
--
-- AGGIORNAMENTI Sprint 7A (Media Infrastructure):
--   - Tabella `foto` aggiunta (senza ON DELETE CASCADE — vedi nota)
--   - Campo `foto_url` RIMOSSO da `ricordi` (fonte di verità: tabella foto)
--   - Bucket `ricordi-foto` creato via SQL
--   - Policy Storage per bucket `ricordi-foto`
--   - RLS su tabella `foto`
-- ============================================================


-- ============================================================
-- PROFILI
-- ============================================================

CREATE TABLE profili (
  id            UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profili (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ============================================================
-- VIAGGI
-- ============================================================

CREATE TABLE viaggi (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users NOT NULL,
  nome           TEXT NOT NULL,
  destinazione   TEXT,
  paese          TEXT,
  data_inizio    DATE,
  data_fine      DATE,
  stato          TEXT DEFAULT NULL,
  cover_emoji    TEXT,
  cover_url      TEXT,
  budget_totale  NUMERIC,
  created_at     TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT stato_check CHECK (
    stato IS NULL OR stato IN ('pianificato', 'in_corso', 'concluso')
  ),
  CONSTRAINT date_check CHECK (
    data_fine IS NULL OR data_inizio IS NULL OR data_fine >= data_inizio
  )
);


-- ============================================================
-- RICORDI (MOMENTI)
-- NOTA Sprint 7A: campo `foto_url` RIMOSSO.
-- La fonte di verità per le foto è esclusivamente la tabella `foto`.
-- Nessun campo duplicato nei ricordi.
-- ============================================================

CREATE TABLE ricordi (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  viaggio_id  UUID REFERENCES viaggi(id) ON DELETE CASCADE NOT NULL,
  titolo      TEXT NOT NULL,
  testo       TEXT,
  luogo       TEXT,
  tipo        TEXT DEFAULT 'testo',
  audio_url   TEXT,
  lat         NUMERIC,
  lng         NUMERIC,
  mood        TEXT NOT NULL,
  preferito   BOOLEAN DEFAULT FALSE,
  highlight   BOOLEAN DEFAULT FALSE,
  data        DATE DEFAULT CURRENT_DATE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT mood_check CHECK (
    mood IN ('felice', 'meravigliato', 'sereno', 'entusiasta', 'ispirato')
  ),
  CONSTRAINT tipo_check CHECK (
    tipo IN ('testo', 'foto', 'audio')
  )
);


-- ============================================================
-- FOTO
-- Registro normalizzato dei file nel bucket Storage.
-- Fonte di verità esclusiva per i file media dei ricordi.
--
-- DECISIONE ARCHITETTURALE (Sprint 7A):
--   NON usa ON DELETE CASCADE su ricordo_id.
--   La cancellazione è orchestrata dal service:
--     1. getFotoByRicordo → lista path
--     2. deleteFilesDaStorage → cleanup fisico
--     3. deleteFotoRecord → rimozione righe DB
--     4. deleteRicordo → eliminazione ricordo
--   Questo garantisce che i path esistano in DB quando si
--   interroga lo Storage — nessun file orfano possibile.
--
-- CAMPI:
--   ordine    → per ordinamento futuro delle foto multiple
--   is_cover  → per selezione manuale copertina (V1.1)
--               già presente per evitare futura migrazione
-- ============================================================

CREATE TABLE foto (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  ricordo_id  UUID REFERENCES ricordi(id) NOT NULL,   -- NO CASCADE intenzionale
  bucket      TEXT NOT NULL DEFAULT 'ricordi-foto',
  path        TEXT NOT NULL,
  mime_type   TEXT NOT NULL,
  size_bytes  INT,
  ordine      INT NOT NULL DEFAULT 0,
  is_cover    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT foto_path_unique UNIQUE(bucket, path)
);


-- ============================================================
-- CHECKLIST ITEMS
-- ============================================================

CREATE TABLE checklist_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viaggio_id  UUID REFERENCES viaggi(id) ON DELETE CASCADE NOT NULL,
  user_id     UUID REFERENCES auth.users NOT NULL,
  testo       TEXT NOT NULL,
  completato  BOOLEAN DEFAULT FALSE,
  ordine      INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- BADGES — schema ready, non usato nel MVP
-- ============================================================

CREATE TABLE badges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codice       TEXT UNIQUE NOT NULL,
  nome         TEXT NOT NULL,
  descrizione  TEXT,
  icona        TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_badges (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users NOT NULL,
  badge_id   UUID REFERENCES badges(id),
  earned_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);


-- ============================================================
-- WALLET — FUTURO (NON MVP)
-- ============================================================

CREATE TABLE wallet (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users NOT NULL,
  viaggio_id  UUID REFERENCES viaggi(id) ON DELETE CASCADE,
  tipo        TEXT NOT NULL,
  nome        TEXT NOT NULL,
  dettaglio   JSONB,
  data        DATE,
  prezzo      NUMERIC,
  stato       TEXT DEFAULT 'confermato',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- BUDGET VOCI
-- ============================================================

CREATE TABLE budget_voci (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viaggio_id  UUID REFERENCES viaggi(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES auth.users NOT NULL,
  categoria   TEXT NOT NULL,
  importo     NUMERIC NOT NULL,
  nota        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- ATTIVITA — FUTURO (ESPLORA)
-- ============================================================

CREATE TABLE attivita (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users,
  destinazione TEXT NOT NULL,
  nome         TEXT NOT NULL,
  descrizione  TEXT,
  citta        TEXT,
  categoria    TEXT,
  luogo        TEXT,
  spostamento  TEXT,
  durata_min   INT,
  icona        TEXT,
  custom       BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- SHARED CONTENT — ROADMAP FUTURA (R11 Share Card)
-- ============================================================

CREATE TABLE shared_content (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users,
  tipo       TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profili ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profilo_proprio" ON profili
  FOR ALL USING (auth.uid() = id);

ALTER TABLE viaggi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "viaggi_propri" ON viaggi
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE ricordi ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ricordi_propri" ON ricordi
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE foto ENABLE ROW LEVEL SECURITY;
CREATE POLICY "foto_proprie" ON foto
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "checklist_propria" ON checklist_items
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badge_pubblici" ON badges
  FOR SELECT USING (true);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badge_utente_proprio" ON user_badges
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE budget_voci ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_proprio" ON budget_voci
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_proprio" ON wallet
  FOR ALL USING (auth.uid() = user_id);

-- attivita: user_id è nullable (righe di sistema senza owner)
-- Policy: l'utente vede le attività globali (user_id IS NULL)
-- e le proprie attività custom (user_id = auth.uid())
ALTER TABLE attivita ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attivita_visibili" ON attivita
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "attivita_proprie_write" ON attivita
  FOR ALL USING (auth.uid() = user_id);

-- shared_content: user_id è nullable — policy identica ad attivita
ALTER TABLE shared_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared_content_propri" ON shared_content
  FOR ALL USING (user_id IS NULL OR auth.uid() = user_id);


-- ============================================================
-- STORAGE — Bucket e Policy
-- Convenzione path: {userId}/{ricordoId}/{uuid}.{ext}
-- Questo permette di trovare tutte le foto di un utente
-- o di un ricordo specifico senza scan del bucket.
-- ============================================================

-- Crea il bucket ricordi-foto (privato)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('ricordi-foto', 'ricordi-foto', false)
  ON CONFLICT (id) DO NOTHING;

-- Crea il bucket profili-avatar (pubblico in lettura)
INSERT INTO storage.buckets (id, name, public)
  VALUES ('profili-avatar', 'profili-avatar', true)
  ON CONFLICT (id) DO NOTHING;

-- Policy Storage per ricordi-foto
-- L'utente opera esclusivamente sulla propria cartella:
--   path = '{userId}/...' → il primo segmento del path deve essere il suo userId

CREATE POLICY "storage_foto_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'ricordi-foto'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_foto_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'ricordi-foto'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_foto_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'ricordi-foto'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "storage_foto_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'ricordi-foto'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
