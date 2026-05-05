import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { Plus, Sparkles } from 'lucide-react';
import {
  Habit, computeStreak, isScheduledOn, isoDate, useHabits, useHabitLogs, meetsTarget,
} from '@/hooks/useHabits';
import { useGoals, useAllMilestones } from '@/hooks/useGoals';
import { TIME_OF_DAY } from '@/data/habitTemplates';
import { HabitCheckButton } from './HabitCheckButton';
import { StreakBadge } from './StreakBadge';
import { HabitFormSheet } from './HabitFormSheet';
import { HabitTemplates } from './HabitTemplates';
import { cn } from '@/lib/utils';

export function TodayView() {
  const { t } = useTranslation();
  const { items: habits } = useHabits();
  const { logs, setLog, incrementToday, skipToday, clearToday, logsByHabitDate } = useHabitLogs(60);
  const { items: goals } = useGoals();
  const { items: allMs } = useAllMilestones();
  const [editing, setEditing] = useState<Habit | null>(null);
  const [creating, setCreating] = useState(false);

  const today = new Date();
  const todayKey = isoDate(today);

  const todayHabits = useMemo(
    () => habits.filter((h) => h.status === 'active' && isScheduledOn(h, today)),
    [habits],
  );

  const grouped = useMemo(() => {
    const map: Record<string, Habit[]> = { morning: [], afternoon: [], evening: [], anytime: [] };
    for (const h of todayHabits) map[h.time_of_day].push(h);
    return map;
  }, [todayHabits]);

  const doneCount = todayHabits.filter((h) =>
    meetsTarget(h, logsByHabitDate.get(`${h.id}:${todayKey}`)),
  ).length;
  const total = todayHabits.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  // Pick a top goal: nearest deadline among active goals
  const topGoal = useMemo(() => {
    const active = goals.filter((g) => g.status === 'active');
    if (active.length === 0) return null;
    const withDeadline = active.filter((g) => g.deadline);
    const sorted = withDeadline.length > 0
      ? withDeadline.sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))
      : active;
    return sorted[0];
  }, [goals]);

  const topGoalNextMs = useMemo(() => {
    if (!topGoal) return null;
    return allMs
      .filter((m) => m.goal_id === topGoal.id && !m.completed_at)
      .sort((a, b) => a.position - b.position)[0] || null;
  }, [topGoal, allMs]);

  const handleToggle = async (h: Habit) => {
    const log = logsByHabitDate.get(`${h.id}:${todayKey}`);
    if (h.type === 'boolean') {
      if (meetsTarget(h, log)) await clearToday(h);
      else await setLog(h, { value: 1, status: 'done' });
    }
  };

  if (habits.length === 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl gradient-primary p-5 text-primary-foreground shadow-elevated">
          <h2 className="text-lg font-semibold">{t('habits.welcome')}</h2>
          <p className="text-sm opacity-90 mt-1">{t('habits.welcomeSub')}</p>
        </div>
        <HabitTemplates />
        <button
          onClick={() => setCreating(true)}
          className="w-full rounded-2xl border-2 border-dashed border-border p-4 text-sm text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />{t('habits.newHabit')}
        </button>
        <HabitFormSheet open={creating} onOpenChange={setCreating} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Greeting + ring */}
      <div className="rounded-2xl gradient-primary p-4 text-primary-foreground shadow-elevated flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
            <circle
              cx="18" cy="18" r="15" fill="none" stroke="white" strokeWidth="3"
              strokeDasharray={`${(pct / 100) * 94.2} 94.2`}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{pct}%</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs opacity-90">{today.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</p>
          <p className="text-base font-semibold">
            {t('habits.doneCount', { done: doneCount, total })}
          </p>
          {total < 4 && (
            <p className="text-[11px] opacity-90 mt-0.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />{t('habits.lightDay')}
            </p>
          )}
        </div>
      </div>

      {/* Time of day groups */}
      {TIME_OF_DAY.map(({ id, icon }) => {
        const list = grouped[id];
        if (list.length === 0) return null;
        const Icon = (Icons as any)[icon] || Icons.Clock;
        return (
          <div key={id} className="rounded-2xl bg-card border border-border p-3 shadow-soft">
            <div className="flex items-center gap-1.5 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <Icon className="h-3.5 w-3.5" />
              {t(`habits.timeOfDays.${id}`)}
            </div>
            <div className="space-y-1.5">
              {list.map((h) => {
                const log = logsByHabitDate.get(`${h.id}:${todayKey}`);
                const HIcon = (Icons as any)[h.icon] || Icons.Target;
                const streak = computeStreak(h, logs);
                return (
                  <div key={h.id} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50">
                    <button
                      onClick={() => setEditing(h)}
                      className="h-9 w-9 rounded-xl gradient-soft flex items-center justify-center shrink-0"
                      title={h.why || ''}
                    >
                      <HIcon className="h-4 w-4 text-primary" />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={cn(
                          'text-sm font-medium truncate',
                          meetsTarget(h, log) && 'line-through text-muted-foreground',
                        )}>
                          {h.name}
                        </p>
                        <StreakBadge streak={streak} />
                      </div>
                      {h.type !== 'boolean' && h.target_unit && (
                        <p className="text-[10px] text-muted-foreground">
                          {t('habits.dailyTarget', { value: h.target_value, unit: h.target_unit })}
                        </p>
                      )}
                    </div>
                    <HabitCheckButton
                      habit={h}
                      log={log}
                      onToggle={() => handleToggle(h)}
                      onIncrement={(d) => incrementToday(h, d)}
                      onSkip={() => skipToday(h)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Top goal mini */}
      {topGoal && (
        <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{t('habits.topGoal')}</p>
          <p className="text-sm font-semibold truncate">{topGoal.title}</p>
          {topGoalNextMs && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {t('habits.nextMilestone')}: {topGoalNextMs.title}
            </p>
          )}
          {topGoal.target_value && topGoal.target_value > 0 && (
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full gradient-primary"
                style={{ width: `${Math.min(100, (topGoal.current_value / topGoal.target_value) * 100)}%` }}
              />
            </div>
          )}
        </div>
      )}

      <button
        onClick={() => setCreating(true)}
        className="w-full rounded-xl border-2 border-dashed border-border p-3 text-sm text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-2"
      >
        <Plus className="h-4 w-4" />{t('habits.newHabit')}
      </button>

      <HabitFormSheet open={creating} onOpenChange={setCreating} />
      <HabitFormSheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)} habit={editing} />
    </div>
  );
}