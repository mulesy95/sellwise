ALTER TABLE optimisations
  ADD COLUMN IF NOT EXISTS feedback text
  CHECK (feedback IN ('up', 'down', NULL));
