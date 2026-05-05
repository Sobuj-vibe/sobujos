import { Habit, HabitLog, isScheduledOn, meetsTarget } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';
import { useTimezone } from '@/contexts/TimezoneContext';
import { isoDateInTz } from '@/lib/datetime';

export function WeekDots({
  habit, logs,
}: { habit: Habit; logs: HabitLog[] }) {
  const { timezone } = useTimezone();
  const days: { date: string; scheduled: boolean; log: HabitLog | undefined }[] = [];
  const byDate = new Map<string, HabitLog>();
  logs.filter((l) => l.habit_id === habit.id).forEach((l) => byDate.set(l.date, l));
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = isoDateInTz(d, timezone);
    days.push({ date: key, scheduled: isScheduledOn(habit, d), log: byDate.get(key) });
  }
  return (
    <div className="flex items-center gap-1">
      {days.map((d) => {
        const done = meetsTarget(habit, d.log);
        const skipped = d.log?.status === 'skipped';
        return (
          <span
            key={d.date}
            title={d.date}
            className={cn(
              'h-2 w-2 rounded-full',
              done
                ? 'bg-[hsl(var(--success))]'
                : skipped
                ? 'bg-amber-400/50'
                : d.scheduled
                ? 'bg-muted-foreground/20'
                : 'bg-muted-foreground/10',
            )}
          />
        );
      })}
    </div>
  );
}