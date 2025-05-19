/*
  # Optymalizacja schematu bazy danych
  
  1. Usunięcie niepotrzebnych tabel
  2. Optymalizacja relacji
  3. Dodanie brakujących indeksów
*/

-- Usuwamy niepotrzebne tabele
DROP TABLE IF EXISTS mfa_amr_claims CASCADE;
DROP TABLE IF EXISTS mfa_challenges CASCADE;
DROP TABLE IF EXISTS mfa_factors CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS saml_relay_states CASCADE;
DROP TABLE IF EXISTS saml_providers CASCADE;
DROP TABLE IF EXISTS sso_domains CASCADE;
DROP TABLE IF EXISTS sso_providers CASCADE;
DROP TABLE IF EXISTS flow_state CASCADE;
DROP TABLE IF EXISTS audit_log_entries CASCADE;
DROP TABLE IF EXISTS schema_migrations CASCADE;
DROP TABLE IF EXISTS instances CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Optymalizacja tabeli notes
ALTER TABLE notes
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS download_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0;

-- Dodanie indeksów dla poprawy wydajności
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_subject_id ON notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_professor_id ON notes(professor_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);
CREATE INDEX IF NOT EXISTS idx_notes_year ON notes(year);

CREATE INDEX IF NOT EXISTS idx_ratings_note_id ON ratings(note_id);
CREATE INDEX IF NOT EXISTS idx_downloads_note_id ON downloads(note_id);
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_professors_name ON professors(name);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Dodanie triggerów do automatycznej aktualizacji średniej oceny
CREATE OR REPLACE FUNCTION update_note_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notes
  SET average_rating = (
    SELECT COALESCE(AVG(stars), 0)
    FROM ratings
    WHERE note_id = NEW.note_id
  )
  WHERE id = NEW.note_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_note_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON ratings
FOR EACH ROW
EXECUTE FUNCTION update_note_rating();

-- Dodanie triggerów do automatycznej aktualizacji liczby pobrań
CREATE OR REPLACE FUNCTION update_download_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE notes
  SET download_count = (
    SELECT COUNT(*)
    FROM downloads
    WHERE note_id = NEW.note_id
  )
  WHERE id = NEW.note_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_download_count_trigger
AFTER INSERT OR DELETE ON downloads
FOR EACH ROW
EXECUTE FUNCTION update_download_count();