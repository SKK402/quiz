-- ==========================================
-- TRIVIA FACTS TABLE (Realtime Data)
-- Run this in Supabase Dashboard → SQL Editor
-- ==========================================

CREATE TABLE IF NOT EXISTS trivia_facts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  year TEXT,
  tags TEXT[] DEFAULT '{}',
  wow_score INTEGER DEFAULT 90,
  sources JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, title)
);

-- Index for fast category lookups
CREATE INDEX IF NOT EXISTS idx_trivia_facts_category ON trivia_facts(category_id);

-- Enable Row Level Security
ALTER TABLE trivia_facts ENABLE ROW LEVEL SECURITY;

-- Allow ALL authenticated users to READ trivia facts
CREATE POLICY "Authenticated users can read trivia facts"
  ON trivia_facts FOR SELECT
  TO authenticated
  USING (true);

-- Allow anon users to read too (optional, for public access)
CREATE POLICY "Anon users can read trivia facts"
  ON trivia_facts FOR SELECT
  TO anon
  USING (true);

-- Allow anon to insert (needed for seeding with anon key)
CREATE POLICY "Allow insert for seeding"
  ON trivia_facts FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow anon to update (needed for upsert during seeding)
CREATE POLICY "Allow update for seeding"
  ON trivia_facts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Enable Realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE trivia_facts;

-- ==========================================
-- LIVE FACTS CACHE TABLE (Daily API Fetches)
-- Stores the live-fetched facts from external APIs
-- so all users share the same cache (no localStorage)
-- ==========================================

CREATE TABLE IF NOT EXISTS live_facts_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date_key TEXT NOT NULL UNIQUE,        -- "2026-03-14" (one row per day)
  facts JSONB NOT NULL DEFAULT '[]',    -- array of fact objects
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  source_report JSONB DEFAULT '{}'      -- which APIs succeeded/failed
);

-- Enable RLS
ALTER TABLE live_facts_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read the cache
CREATE POLICY "Anyone can read live facts cache"
  ON live_facts_cache FOR SELECT
  TO authenticated, anon
  USING (true);

-- Anyone can insert (the first user to sign in that day seeds the cache)
CREATE POLICY "Anyone can insert live facts cache"
  ON live_facts_cache FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Anyone can update (refresh the cache)
CREATE POLICY "Anyone can update live facts cache"
  ON live_facts_cache FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Anyone can delete old cache entries
CREATE POLICY "Anyone can delete live facts cache"
  ON live_facts_cache FOR DELETE
  TO authenticated, anon
  USING (true);
