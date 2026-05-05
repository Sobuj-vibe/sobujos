import { Check, Minus, Plus, X, Snowflake } from 'lucide-react';
import { Habit, HabitLog, isoDate, meetsTarget } from '@/hooks/useHabits';
import { cn } from '@/lib/utils';

export function HabitCheckButton({
  habit, log, onToggle, onIncrement, onSkip,
}: {
  habit: Habit;
  log: HabitLog | undefined;
  onToggle: () => void;
  onIncrement: (delta: number) => void;
  onSkip: () => void;
}) {
  const done = meetsTarget(habit, log);
  const skipped = log?.status === 'skipped';

  if (habit.type === 'boolean') {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={onSkip}
          title="Skip"
          className={cn(
            'h-9 w-9 rounded-full border flex items-center justify-center',
            skipped ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          <Snowflake className="h-4 w-4" />
        </button>
        <button
          onClick={onToggle}
          className={cn(
            'h-10 w-10 rounded-full flex items-center justify-center transition shadow-soft',
            done ? 'gradient-primary text-primary-foreground' : 'border-2 border-border hover:border-primary',
          )}
        >
          {done && <Check className="h-5 w-5" />}
        </button>
      </div>
    );
  }

  // counter / duration
  const target = habit.target_value || 1;
  const value = log?.value || 0;
  const pct = Math.min(100, (value / target) * 100);

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onIncrement(-1)}
        className="h-8 w-8 rounded-full border border-border flex items-center justify-center hover:bg-muted"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <div className="min-w-[72px] text-center">
        <p className="text-sm font-bold tabular-nums leading-tight">
          {value}<span className="text-muted-foreground">/{target}</span>
        </p>
        <div className="h-1 mt-0.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn('h-full transition-all', done ? 'bg-[hsl(var(--success))]' : 'gradient-primary')}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <button
        onClick={() => onIncrement(1)}
        className={cn(
          'h-8 w-8 rounded-full flex items-center justify-center',
          done ? 'bg-[hsl(var(--success))] text-white' : 'gradient-primary text-primary-foreground',
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}