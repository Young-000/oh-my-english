-- Oh My English Database Schema
-- Version: 001
-- Schema: oh_my_english (Project 2: 비게임 앱)

-- Create the schema
CREATE SCHEMA IF NOT EXISTS oh_my_english;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS oh_my_english.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  settings JSONB DEFAULT '{
    "dailyGoal": 5,
    "preferredStyle": "casual",
    "notificationEnabled": true
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning records (core table)
CREATE TABLE IF NOT EXISTS oh_my_english.learning_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES oh_my_english.profiles(id) ON DELETE CASCADE,
  korean_input TEXT NOT NULL,
  english_expression TEXT NOT NULL,
  context_explanation TEXT,
  alternatives JSONB DEFAULT '[]'::jsonb,
  related_vocabulary JSONB DEFAULT '[]'::jsonb,
  category TEXT DEFAULT 'general',
  is_bookmarked BOOLEAN DEFAULT FALSE,
  mastery_level INTEGER DEFAULT 0 CHECK (mastery_level >= 0 AND mastery_level <= 5),
  review_count INTEGER DEFAULT 0,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts
CREATE TABLE IF NOT EXISTS oh_my_english.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES oh_my_english.profiles(id) ON DELETE CASCADE,
  record_id UUID NOT NULL REFERENCES oh_my_english.learning_records(id) ON DELETE CASCADE,
  quiz_type TEXT NOT NULL CHECK (quiz_type IN ('korean_to_english', 'fill_blank', 'multiple_choice')),
  question TEXT NOT NULL,
  user_answer TEXT,
  correct_answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_taken_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily statistics
CREATE TABLE IF NOT EXISTS oh_my_english.daily_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES oh_my_english.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  expressions_learned INTEGER DEFAULT 0,
  quiz_correct INTEGER DEFAULT 0,
  quiz_total INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_learning_records_user_id ON oh_my_english.learning_records(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_records_next_review ON oh_my_english.learning_records(user_id, next_review_at) WHERE next_review_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_learning_records_category ON oh_my_english.learning_records(user_id, category);
CREATE INDEX IF NOT EXISTS idx_learning_records_bookmarked ON oh_my_english.learning_records(user_id, is_bookmarked) WHERE is_bookmarked = TRUE;
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON oh_my_english.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_record_id ON oh_my_english.quiz_attempts(record_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON oh_my_english.daily_stats(user_id, date);

-- Enable Row Level Security
ALTER TABLE oh_my_english.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE oh_my_english.learning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE oh_my_english.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE oh_my_english.daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON oh_my_english.profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can manage own learning records" ON oh_my_english.learning_records
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own quiz attempts" ON oh_my_english.quiz_attempts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own daily stats" ON oh_my_english.daily_stats
  FOR ALL USING (auth.uid() = user_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION oh_my_english.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_learning_records_updated_at
  BEFORE UPDATE ON oh_my_english.learning_records
  FOR EACH ROW
  EXECUTE FUNCTION oh_my_english.update_updated_at();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION oh_my_english.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO oh_my_english.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION oh_my_english.handle_new_user();
