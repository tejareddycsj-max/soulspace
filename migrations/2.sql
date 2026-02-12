
ALTER TABLE diary_entries ADD COLUMN user_id TEXT;
CREATE INDEX idx_diary_entries_user_id ON diary_entries(user_id);
