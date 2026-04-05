-- Initial Schema for JotFlow

-- JOURNAL ENTRIES
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  pinned BOOLEAN DEFAULT false,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  encrypted_payload TEXT NOT NULL, -- E2EE data (title, content, tags, location, voiceNotes)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own entries" 
ON journal_entries FOR ALL 
USING (auth.uid() = user_id);

-- TODOS
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  tags TEXT[] DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own todos" 
ON todos FOR ALL 
USING (auth.uid() = user_id);

-- WIDGETS
CREATE TABLE widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('streak', 'mood_chart', 'daily_prompt', 'goal_tracker', 'quick_stats', 'todos', 'recent_entries')),
  config JSONB DEFAULT '{}',
  layout JSONB DEFAULT '{"x": 0, "y": 0, "w": 2, "h": 2}',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own widgets" 
ON widgets FOR ALL 
USING (auth.uid() = user_id);

-- JOURNALING PROMPTS
CREATE TABLE journaling_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Prompts are readable by everyone
ALTER TABLE journaling_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Prompts are readable by all authenticated users" 
ON journaling_prompts FOR SELECT 
USING (auth.role() = 'authenticated');

-- USER PREFERENCES
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_time TIME DEFAULT '20:00',
  reminder_days INTEGER[] DEFAULT '{1,2,3,4,5,6,0}',
  push_subscription JSONB,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences" 
ON user_preferences FOR ALL 
USING (auth.uid() = user_id);

-- ENTRY ATTACHMENTS (Phase 5 placeholder)
CREATE TABLE entry_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('image', 'video', 'audio')),
  storage_path TEXT NOT NULL,
  filename TEXT,
  mime_type TEXT,
  size_bytes INTEGER,
  duration_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE entry_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own attachments" 
ON entry_attachments FOR ALL 
USING (auth.uid() = user_id);

-- REALTIME setup
ALTER PUBLICATION supabase_realtime ADD TABLE journal_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE todos;
ALTER PUBLICATION supabase_realtime ADD TABLE widgets;
