# SQL Templates for Supabase Migrations

To add new features, use these common patterns for Supabase.

## Adding Non-Sensitive Metadata Columns

Use this for data that is needed for sorting, filtering, or UI indicators.

```sql
-- Adding mood tracking (example)
ALTER TABLE journal_entries ADD COLUMN mood INTEGER CHECK (mood >= 1 AND mood <= 5);

-- Adding pinned status
ALTER TABLE journal_entries ADD COLUMN pinned BOOLEAN DEFAULT false;
```

## Adding New Tables (e.g., Media Attachments)

When adding tables for media, ensure they also have an `encrypted_metadata` column for sensitive file details.

```sql
CREATE TABLE entry_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('image', 'video', 'audio')),
  storage_path TEXT NOT NULL, -- Path to storage (non-sensitive)
  encrypted_metadata TEXT, -- Store original filenames, sizes, etc. encrypted
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ALWAYS ENABLE RLS
ALTER TABLE entry_attachments ENABLE ROW LEVEL SECURITY;

-- Enable Select Policy
CREATE POLICY "Users can view their own attachments"
ON entry_attachments FOR SELECT
USING (auth.uid() = user_id);

-- Enable Insert Policy
CREATE POLICY "Users can insert their own attachments"
ON entry_attachments FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

## Mandate: RLS (Row-Level Security)
Every new table must have RLS enabled and a policy that restricts access to the authenticated `user_id`. Never create a table without an RLS policy.
