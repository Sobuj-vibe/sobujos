import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTimezone } from '@/contexts/TimezoneContext';
import { isoDateInTz } from '@/lib/datetime';

export type HabitType = 'boolean' | 'counter' | 'duration';
export type HabitScheduleKind = 'daily' | 'weekdays' | 'weekly_count';
export type HabitTimeOfDay = 'morning' | 'afternoon' | 'evening' | 'anytime';
export type HabitStatus = 'active' | 'paused' | 'archived';
export type HabitLogStatus = 'done' | 'partial' | 'skipped' | 'frozen';

export type Habit = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: HabitType;
  target_unit: string | null;
  target_value: number | null;
  schedule_kind: HabitScheduleKind;
  schedule_days: number[] | null;
  weekly_count: number | null;
  time_of_day: HabitTimeOfDay;
  reminder_time: string | null;
  goal_id: string | null;
  why: string | null;
  status: HabitStatus;
  position: number;
  freezes_per_month: number;
  created_at: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  date: string;
  value: number;
  status: HabitLogStatus;
  note: string | null;
  logged_at: string;
};

function emit() {
  window.dispatchEvent(new Event('ai-data-changed'));
}

/**
 * @deprecated Prefer `isoDateInTz(date, tz)` from `@/lib/datetime` so the value
 * reflects the user's local calendar day. This helper still exists for legacy
 * callers and assumes UTC.
 */
export function isoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Should this habit be done on the given date? */
export function isScheduledOn(habit: Habit, date: Date): boolean {
  if (habit.status !== 'active') return false;
  if (habit.schedule_kind === 'daily') return true;
  if (habit.schedule_kind === 'weekdays') {
    // schedule_days: 0=Sun..6=Sat
    return (habit.schedule_days || []).includes(date.getDay());
  }
  // weekly_count: count toward weekly target on any day
  return true;
}

/** Whether a log meets the habit's daily target. */
export function meetsTarget(habit: Habit, log: HabitLog | null | undefined): boolean {
  if (!log) return false;
  if (log.status === 'frozen') return true;
  if (log.status === 'skipped') return false;
  if (habit.type === 'boolean') return log.status === 'done';
  const target = habit.target_value || 1;
  return log.value >= target;
}

/** Compute current streak (consecutive scheduled days completed up to today). */
export function computeStreak(habit: Habit, logs: HabitLog[], tz: string = 'UTC'): number {
  const byDate = new Map<string, HabitLog>();
  logs.filter((l) => l.habit_id === habit.id).forEach((l) => byDate.set(l.date, l));
  let streak = 0;
  const d = new Date();
  // walk back up to 365 days
  for (let i = 0; i < 365; i++) {
    const date = new Date(d);
    date.setDate(d.getDate() - i);
    if (!isScheduledOn(habit, date)) continue;
    const key = isoDateInTz(date, tz);
    const log = byDate.get(key);
    if (meetsTarget(habit, log)) {
      streak++;
    } else {
      // First scheduled day not done = stop. But if i===0 (today) and not yet logged, don't break.
      if (i === 0) continue;
      break;
    }
  }
  return streak;
}

export function computeBestStreak(habit: Habit, logs: HabitLog[]): number {
  const filtered = logs
    .filter((l) => l.habit_id === habit.id)
    .sort((a, b) => a.date.localeCompare(b.date));
  let best = 0, run = 0, prev: string | null = null;
  for (const l of filtered) {
    if (!meetsTarget(habit, l)) { run = 0; prev = l.date; continue; }
    if (prev) {
      const diff = (new Date(l.date).getTime() - new Date(prev).getTime()) / 86400000;
      // Allow gaps of non-scheduled days; cheap approximation: any gap > 1 resets
      if (diff > 1) {
        // walk through the gap; if all skipped scheduled days, allow
        let gapOk = true;
        for (let g = 1; g < diff; g++) {
          const dd = new Date(prev); dd.setDate(dd.getDate() + g);
          if (isScheduledOn(habit, dd)) { gapOk = false; break; }
        }
        if (!gapOk) run = 0;
      }
    }
    run++;
    if (run > best) best = run;
    prev = l.date;
  }
  return best;
}

export function useHabits() {
  const { user } = useAuth();
  const [items, setItems] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user.id)
      .order('position');
    setItems((data as Habit[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const add = async (h: Partial<Habit> & { name: string }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from('habits')
      .insert({ user_id: user.id, ...h })
      .select().single();
    if (error) throw error;
    await refresh();
    emit();
    return data as Habit;
  };

  const update = async (id: string, patch: Partial<Habit>) => {
    await supabase.from('habits').update(patch).eq('id', id);
    await refresh();
    emit();
  };

  const remove = async (id: string) => {
    await supabase.from('habits').delete().eq('id', id);
    await refresh();
    emit();
  };

  return { items, loading, add, update, remove, refresh };
}

export function useHabitLogs(daysBack = 365) {
  const { user } = useAuth();
  const { timezone } = useTimezone();
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const from = new Date();
    from.setDate(from.getDate() - daysBack);
    const { data } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', isoDateInTz(from, timezone))
      .order('date', { ascending: false });
    setLogs(((data as any[]) || []).map((d) => ({ ...d, value: Number(d.value) })));
    setLoading(false);
  }, [user, daysBack, timezone]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  /** Set/upsert today's (or specific date) log for a habit. */
  const setLog = async (
    habit: Habit,
    opts: { value?: number; status?: HabitLogStatus; date?: string; note?: string } = {},
  ) => {
    if (!user) return;
    const date = opts.date || isoDateInTz(new Date(), timezone);
    const value = opts.value ?? (habit.type === 'boolean' ? 1 : 0);
    const status: HabitLogStatus =
      opts.status ??
      (habit.type === 'boolean'
        ? 'done'
        : value >= (habit.target_value || 1)
        ? 'done'
        : value > 0
        ? 'partial'
        : 'done');
    await supabase.from('habit_logs').upsert(
      {
        user_id: user.id,
        habit_id: habit.id,
        date,
        value,
        status,
        note: opts.note ?? null,
        logged_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,habit_id,date' },
    );
    await refresh();
    emit();
  };

  const incrementToday = async (habit: Habit, delta = 1) => {
    if (!user) return;
    const today = isoDateInTz(new Date(), timezone);
    const current = logs.find((l) => l.habit_id === habit.id && l.date === today);
    const value = Math.max(0, (current?.value || 0) + delta);
    await setLog(habit, { value });
  };

  const skipToday = async (habit: Habit) => {
    await setLog(habit, { value: 0, status: 'skipped' });
  };

  const clearToday = async (habit: Habit) => {
    if (!user) return;
    const today = isoDateInTz(new Date(), timezone);
    await supabase.from('habit_logs')
      .delete()
      .eq('user_id', user.id).eq('habit_id', habit.id).eq('date', today);
    await refresh();
    emit();
  };

  const logsByHabitDate = useMemo(() => {
    const m = new Map<string, HabitLog>();
    for (const l of logs) m.set(`${l.habit_id}:${l.date}`, l);
    return m;
  }, [logs]);

  return { logs, loading, setLog, incrementToday, skipToday, clearToday, logsByHabitDate, refresh };
}