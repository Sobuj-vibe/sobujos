import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { computeStreak, isScheduledOn, isoDate, meetsTarget, useHabits, useHabitLogs } from '@/hooks/useHabits';
import { useGoals, useAllMilestones } from '@/hooks/useGoals';
import { YearlyHeatmap } from './YearlyHeatmap';
import { StreakBadge } from './StreakBadge';

export function StatsView() {
  const { t } = useTranslation();
  const { items: habits } = useHabits();
  const { logs } = useHabitLogs(365);
  const { items: goals } = useGoals();
  const { items: ms } = useAllMilestones();

  const active = habits.filter((h) => h.status === 'active');
  const [selectedId, setSelectedId] = useState<string>(active[0]?.id || '');
  const selected = active.find((h) => h.id === selectedId) || active[0];

  const leaderboard = useMemo(() =>
    active.map((h) => ({ h, streak: computeStreak(h, logs) }))
      .sort((a, b) => b.streak - a.streak),
    [active, logs],
  );

  // Last 12 weeks consistency
  const weekly = useMemo(() => {
    const today = new Date();
    const weeks: { label: string; pct: number }[] = [];
    for (let w = 11; w >= 0; w--) {
      let scheduled = 0, done = 0;
      for (let d = 6; d >= 0; d--) {
        const date = new Date(today);
        date.setDate(today.getDate() - (w * 7 + d));
        const key = isoDate(date);
        for (const h of active) {
          if (!isScheduledOn(h, date)) continue;
          scheduled++;
          const log = logs.find((l) => l.habit_id === h.id && l.date === key);
          if (meetsTarget(h, log)) done++;
        }
      }
      weeks.push({ label: `W${12 - w}`, pct: scheduled ? Math.round((done / scheduled) * 100) : 0 });
    }
    return weeks;
  }, [active, logs]);

  // Best day of week
  const bestDay = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const sched = [0, 0, 0, 0, 0, 0, 0];
    for (const l of logs) {
      const dow = new Date(l.date).getDay();
      const h = active.find((x) => x.id === l.habit_id);
      if (!h) continue;
      sched[dow]++;
      if (meetsTarget(h, l)) counts[dow]++;
    }
    const ratios = counts.map((c, i) => (sched[i] ? c / sched[i] : 0));
    const best = ratios.indexOf(Math.max(...ratios));
    const KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    return { key: KEYS[best], pct: Math.round(ratios[best] * 100) };
  }, [logs, active]);

  const goalProgress = useMemo(() => {
    const act = goals.filter((g) => g.status === 'active');
    if (act.length === 0) return 0;
    let sum = 0;
    for (const g of act) {
      if (g.target_value && g.target_value > 0) {
        sum += Math.min(100, (g.current_value / g.target_value) * 100);
      } else {
        const gms = ms.filter((m) => m.goal_id === g.id);
        const done = gms.filter((m) => m.completed_at).length;
        sum += gms.length > 0 ? (done / gms.length) * 100 : 0;
      }
    }
    return Math.round(sum / act.length);
  }, [goals, ms]);

  if (active.length === 0) {
    return <div className="rounded-2xl bg-card border border-border p-6 text-center text-sm text-muted-foreground">
      {t('habits.noStats')}
    </div>;
  }

  return (
    <div className="space-y-3">
      {/* Heatmap */}
      <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">{t('habits.yearlyHeatmap')}</h3>
          <select
            value={selected?.id || ''}
            onChange={(e) => setSelectedId(e.target.value)}
            className="text-xs h-7 rounded border border-border bg-background px-1.5"
          >
            {active.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        {selected && <YearlyHeatmap habit={selected} logs={logs} />}
      </div>

      {/* Leaderboard */}
      <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
        <h3 className="text-sm font-semibold mb-2">{t('habits.streakLeaderboard')}</h3>
        <div className="space-y-1.5">
          {leaderboard.slice(0, 8).map(({ h, streak }) => {
            const Icon = (Icons as any)[h.icon] || Icons.Target;
            return (
              <div key={h.id} className="flex items-center gap-2 text-xs">
                <Icon className="h-3.5 w-3.5 text-primary" />
                <span className="flex-1 truncate">{h.name}</span>
                <StreakBadge streak={streak} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly consistency */}
      <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
        <h3 className="text-sm font-semibold mb-2">{t('habits.weeklyConsistency')}</h3>
        <div className="flex items-end gap-1 h-24">
          {weekly.map((w) => (
            <div key={w.label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex-1 flex items-end">
                <div className="w-full gradient-primary rounded-t" style={{ height: `${w.pct}%` }} title={`${w.pct}%`} />
              </div>
              <span className="text-[9px] text-muted-foreground">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best day & goal progress */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-card border border-border p-3 shadow-soft">
          <p className="text-xs text-muted-foreground">{t('habits.bestDay')}</p>
          <p className="text-lg font-bold mt-1">{t(`habits.weekdaysFull.${bestDay.key}`)}</p>
          <p className="text-xs text-muted-foreground">{bestDay.pct}%</p>
        </div>
        <div className="rounded-2xl gradient-primary p-3 text-primary-foreground shadow-soft">
          <p className="text-xs opacity-90">{t('habits.goalProgress')}</p>
          <p className="text-lg font-bold mt-1 tabular-nums">{goalProgress}%</p>
          <p className="text-xs opacity-90">{goals.filter((g) => g.status === 'active').length} {t('habits.activeGoals')}</p>
        </div>
      </div>
    </div>
  );
}