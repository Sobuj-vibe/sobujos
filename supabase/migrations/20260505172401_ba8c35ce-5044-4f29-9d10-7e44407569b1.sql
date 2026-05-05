-- Enums
CREATE TYPE habit_type AS ENUM ('boolean', 'counter', 'duration');
CREATE TYPE habit_schedule_kind AS ENUM ('daily', 'weekdays', 'weekly_count');
CREATE TYPE habit_time_of_day AS ENUM ('morning', 'afternoon', 'evening', 'anytime');
CREATE TYPE habit_status AS ENUM ('active', 'paused', 'archived');
CREATE TYPE habit_log_status AS ENUM ('done', 'partial', 'skipped', 'frozen');
CREATE TYPE goal_type AS ENUM ('outcome', 'process', 'project');
CREATE TYPE goal_status AS ENUM ('active', 'completed', 'archived');

-- habits
CREATE TABLE public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT 'Target',
  color text NOT NULL DEFAULT 'indigo',
  type habit_type NOT NULL DEFAULT 'boolean',
  target_unit text,
  target_value numeric,
  schedule_kind habit_schedule_kind NOT NULL DEFAULT 'daily',
  schedule_days int[],
  weekly_count int,
  time_of_day habit_time_of_day NOT NULL DEFAULT 'anytime',
  reminder_time time,
  goal_id uuid,
  why text,
  status habit_status NOT NULL DEFAULT 'active',
  position int NOT NULL DEFAULT 0,
  freezes_per_month int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY habits_all ON public.habits FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_habits_user_status ON public.habits(user_id, status);

-- habit_logs
CREATE TABLE public.habit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  habit_id uuid NOT NULL,
  date date NOT NULL,
  value numeric NOT NULL DEFAULT 1,
  status habit_log_status NOT NULL DEFAULT 'done',
  note text,
  logged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, habit_id, date)
);
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY habit_logs_all ON public.habit_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_habit_logs_user_date ON public.habit_logs(user_id, date);
CREATE INDEX idx_habit_logs_habit ON public.habit_logs(habit_id, date);

-- goals
CREATE TABLE public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'personal',
  type goal_type NOT NULL DEFAULT 'outcome',
  target_value numeric,
  target_unit text,
  current_value numeric NOT NULL DEFAULT 0,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  deadline date,
  status goal_status NOT NULL DEFAULT 'active',
  finance_category_id uuid,
  weekly_review boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goals_all ON public.goals FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_goals_user_status ON public.goals(user_id, status);

-- goal_milestones
CREATE TABLE public.goal_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL,
  title text NOT NULL,
  target_date date,
  position int NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goal_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY goal_milestones_all ON public.goal_milestones FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_goal_milestones_goal ON public.goal_milestones(goal_id, position);

-- goal_notes
CREATE TABLE public.goal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goal_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.goal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY goal_notes_all ON public.goal_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_goal_notes_goal ON public.goal_notes(goal_id, created_at DESC);