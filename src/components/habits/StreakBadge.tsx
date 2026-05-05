import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StreakBadge({ streak, className }: { streak: number; className?: string }) {
  if (streak === 0) return null;
  const hot = streak >= 7;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
        hot ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <Flame className="h-3 w-3" />
      {streak}
    </span>
  );
}