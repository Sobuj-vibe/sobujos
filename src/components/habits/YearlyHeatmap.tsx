import { Habit, HabitLog, isScheduledOn, meetsTarget } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useTimezone } from '@/contexts/TimezoneContext';
import { isoDateInTz } from '@/lib/datetime';

export function YearlyHeatmap({
  habit, logs,
}: { habit: Habit; logs: HabitLog[] }) {
  const { t } = useTranslation();
  const { timezone } = useTimezone();
  const today = new Date();
  const days: { date: string; intensity: number; scheduled: boolean }[] = [];
  const byDate = new Map<string, HabitLog>();
  logs.filter((l) => l.habit_id === habit.id).forEach((l) => byDate.set(l.date, l));

  // last 365 days, oldest first
  for (let i = 364; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = isoDateInTz(d, timezone);
    const log = byDate.get(key);
    const sched = isScheduledOn(habit, d);
    let intensity = 0;
    if (log) {
      if (log.status === 'frozen') intensity = 2;
      else if (log.status === 'skipped') intensity = 0;
      else if (habit.type === 'boolean') intensity = log.status === 'done' ? 4 : 0;
      else {
        const tgt = habit.target_value || 1;
        const ratio = log.value / tgt;
        intensity = ratio >= 1 ? 4 : ratio >= 0.66 ? 3 : ratio >= 0.33 ? 2 : ratio > 0 ? 1 : 0;
      }
    }
    days.push({ date: key, intensity, scheduled: sched });
  }

  const colorFor = (i: number, sched: boolean) => {
    if (i === 0) return sched ? 'bg-muted/40' : 'bg-muted/20';
    if (i === 1) return 'bg-emerald-500/20';
    if (i === 2) return 'bg-emerald-500/45';
    if (i === 3) return 'bg-emerald-500/70';
    return 'bg-emerald-500';
  };

  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-[2px] overflow-x-auto py-1">
        {days.map((d) => (
          <span
            key={d.date}
            title={`${d.date}`}
            className={cn('h-2.5 w-2.5 rounded-[2px]', colorFor(d.intensity, d.scheduled))}
          />
        ))}
      </div>
      <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-muted-foreground">
        <span>{t('prayer.legend.less')}</span>
        <span className="h-2.5 w-2.5 rounded-[2px] bg-muted/40" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500/20" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500/45" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500/70" />
        <span className="h-2.5 w-2.5 rounded-[2px] bg-emerald-500" />
        <span>{t('prayer.legend.more')}</span>
      </div>
    </div>
  );
}