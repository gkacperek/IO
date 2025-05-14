/*
  # Fix relationship between notes and user_profiles tables

  1. Changes
    - Remove existing foreign key if it exists
    - Create missing user profiles for existing notes
    - Add foreign key constraint between notes and user_profiles
  
  2. Security
    - Ensure data integrity by creating missing user profiles
    - Add CASCADE delete to automatically remove notes when user profile is deleted
*/

-- First, remove the existing foreign key if it exists
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'notes_user_id_user_profiles_fkey'
  ) THEN
    ALTER TABLE notes DROP CONSTRAINT notes_user_id_user_profiles_fkey;
  END IF;
END $$;

-- Create missing user profiles for any notes that don't have corresponding profiles
INSERT INTO user_profiles (id, username)
SELECT DISTINCT n.user_id, u.email as username
FROM notes n
LEFT JOIN auth.users u ON u.id = n.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = n.user_id
);

-- Now we can safely add the foreign key constraint
ALTER TABLE notes
ADD CONSTRAINT notes_user_id_user_profiles_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id)
ON DELETE CASCADE;