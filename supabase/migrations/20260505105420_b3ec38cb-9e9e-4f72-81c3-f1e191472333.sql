
-- Enums
CREATE TYPE public.prayer_name AS ENUM ('fajr','dhuhr','asr','maghrib','isha');
CREATE TYPE public.prayer_status AS ENUM ('on_time','late','qaza');

-- prayer_logs
CREATE TABLE public.prayer_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  prayer public.prayer_name NOT NULL,
  status public.prayer_status NOT NULL,
  made_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date, prayer)
);
ALTER TABLE public.prayer_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their prayer logs" ON public.prayer_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_prayer_logs_user_date ON public.prayer_logs(user_id, date);
CREATE TRIGGER prayer_logs_updated_at BEFORE UPDATE ON public.prayer_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- quran_logs
CREATE TABLE public.quran_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  surah_number int NOT NULL,
  surah_name text NOT NULL,
  ayat_from int NOT NULL,
  ayat_to int,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.quran_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their quran logs" ON public.quran_logs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_quran_logs_user_date ON public.quran_logs(user_id, date DESC);

-- hadith_daily (per user per date cache)
CREATE TABLE public.hadith_daily (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  text_bn text NOT NULL,
  text_en text NOT NULL,
  reference text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
ALTER TABLE public.hadith_daily ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view their hadith" ON public.hadith_daily
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert their hadith" ON public.hadith_daily
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- tasbih_counters
CREATE TABLE public.tasbih_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  count int NOT NULL DEFAULT 0,
  target int NOT NULL DEFAULT 33,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tasbih_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their tasbih" ON public.tasbih_counters
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER tasbih_counters_updated_at BEFORE UPDATE ON public.tasbih_counters
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
