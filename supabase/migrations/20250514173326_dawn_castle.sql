/*
  # Add relationship between notes and user_profiles tables

  1. Changes
    - Add foreign key relationship between notes.user_id and user_profiles.id
    
  2. Notes
    - This ensures that notes can properly reference user profiles
    - Uses ON DELETE CASCADE to maintain referential integrity
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'notes_user_id_user_profiles_fkey'
  ) THEN
    ALTER TABLE notes
    ADD CONSTRAINT notes_user_id_user_profiles_fkey
    FOREIGN KEY (user_id) REFERENCES user_profiles(id)
    ON DELETE CASCADE;
  END IF;
END $$;