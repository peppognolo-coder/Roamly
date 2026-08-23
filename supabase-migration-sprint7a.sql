-- ============================================================
-- ROAMLY — Migrazione Sprint 7A
-- Da eseguire su progetti Supabase ESISTENTI (non nuovi).
-- Se stai eseguendo supabase-schema-v1.sql da zero, NON serve.
-- ============================================================

-- ── 1. Rimuove foto_url da ricordi ──────────────────────────
-- La fonte di verità per le foto diventa la tabella `foto`.
-- Eseguire SOLO se la colonna esiste ancora.

ALTER TABLE ricordi DROP COLUMN IF EXISTS foto_url;


-- ── 2. Crea la tabella foto ──────────────────────────────────

CREATE TABLE IF NOT EXISTS foto (
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

ALTER TABLE foto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "foto_proprie" ON foto
  FOR ALL USING (auth.uid() = user_id);


-- ── 3. Bucket Storage ────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
  VALUES ('ricordi-foto', 'ricordi-foto', false)
  ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
  VALUES ('profili-avatar', 'profili-avatar', true)
  ON CONFLICT (id) DO NOTHING;


-- ── 4. Policy Storage per ricordi-foto ───────────────────────
-- Convenzione path: {userId}/{ricordoId}/{uuid}.{ext}

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


-- ── 5. Sprint 7: abilita Transformation API nel bucket ricordi-foto ──────────
-- Necessario per le thumbnail generate lato Supabase (width/height params).
-- Da eseguire se il bucket esiste già.

UPDATE storage.buckets
  SET file_size_limit      = 10485760,   -- 10 MB limite file
      allowed_mime_types   = ARRAY['image/jpeg', 'image/png', 'image/webp'],
      avif_autodetection   = false
  WHERE id = 'ricordi-foto';

-- NOTA: le Transformation API di Supabase Storage sono abilitate
-- automaticamente per bucket privati in modalità signed URL.
-- Non richiedono configurazione aggiuntiva oltre al bucket esistente.


-- ── 6. Sprint 7.9 (DT-2): RLS su attivita e shared_content ──────────────────
-- Tabelle roadmap senza RLS — chiudiamo il gap prima del lancio beta.

ALTER TABLE attivita ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attivita_visibili" ON attivita
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "attivita_proprie_write" ON attivita
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE shared_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shared_content_propri" ON shared_content
  FOR ALL USING (user_id IS NULL OR auth.uid() = user_id);
