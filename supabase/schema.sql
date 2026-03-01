-- ====================================================
-- HABITS TRACKER - Supabase Schema
-- Ejecutar en el SQL Editor de Supabase
-- ====================================================

-- Hábitos
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  icon text,
  type text NOT NULL CHECK (type IN ('check', 'minutes', 'counter', 'sleep')),
  weekly_goal int NOT NULL DEFAULT 7,
  recurrence jsonb NOT NULL DEFAULT '{"type": "daily"}',
  notification_enabled boolean NOT NULL DEFAULT false,
  notification_time time,
  notify_if_not_done boolean NOT NULL DEFAULT true,
  position int NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Registros diarios
CREATE TABLE IF NOT EXISTS habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  value numeric NOT NULL DEFAULT 1,
  quality int CHECK (quality >= 1 AND quality <= 5),
  created_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, date)
);

-- Suscripciones push
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- ====================================================
-- RLS (Row Level Security) - Cada usuario solo ve sus datos
-- ====================================================

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Habits policies
CREATE POLICY "Users can manage own habits"
  ON habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Habit logs policies
CREATE POLICY "Users can manage own logs"
  ON habit_logs FOR ALL
  USING (
    habit_id IN (
      SELECT id FROM habits WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    habit_id IN (
      SELECT id FROM habits WHERE user_id = auth.uid()
    )
  );

-- Push subscriptions policies
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ====================================================
-- Indexes para performance
-- ====================================================

CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_push_subs_user_id ON push_subscriptions(user_id);
