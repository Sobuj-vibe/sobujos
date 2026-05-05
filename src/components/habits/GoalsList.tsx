import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckCircle2, Calendar } from 'lucide-react';
import { useGoals, useAllMilestones } from '@/hooks/useGoals';
import { useHabits } from '@/hooks/useHabits';
import { GoalFormSheet } from './GoalFormSheet';
import { GoalDetailSheet } from './GoalDetailSheet';
import { cn } from '@/lib/utils';

export function GoalsList() {
  const { t } = useTranslation();
  const { items: goals } = useGoals();
  const { items: allMs } = useAllMilestones();
  const { items: habits } = useHabits();
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return {
      active: goals.filter((g) => g.status === 'active'),
      completed: goals.filter((g) => g.status === 'completed'),
    };
  }, [goals]);

  const renderCard = (g: typeof goals[number]) => {
    const ms = allMs.filter((m) => m.goal_id === g.id);
    const completedMs = ms.filter((m) => m.completed_at).length;
    const linked = habits.filter((h) => h.goal_id === g.id);
    const pct = g.target_value && g.target_value > 0
      ? Math.min(100, (g.current_value / g.target_value) * 100)
      : ms.length > 0 ? (completedMs / ms.length) * 100 : 0;
    const daysLeft = g.deadline
      ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null;
    return (
      <button
        key={g.id}
        onClick={() => setOpenId(g.id)}
        className="w-full text-left rounded-2xl bg-card border border-border p-3 shadow-soft hover:border-primary transition"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{g.title}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {t(`habits.categories.${g.category}`)}
            </p>
          </div>
          {g.status === 'completed' && (
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
          )}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full gradient-primary" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground">
          <span className="tabular-nums">
            {g.target_value
              ? `${g.current_value}/${g.target_value} ${g.target_unit || ''}`
              : `${completedMs}/${ms.length} ${t('habits.milestones')}`}
          </span>
          {daysLeft !== null && (
            <span className={cn('flex items-center gap-1', daysLeft < 7 && daysLeft >= 0 && 'text-amber-500', daysLeft < 0 && 'text-destructive')}>
              <Calendar className="h-3 w-3" />
              {daysLeft >= 0 ? t('habits.daysLeft', { n: daysLeft }) : t('habits.daysOverdue', { n: -daysLeft })}
            </span>
          )}
        </div>
        {linked.length > 0 && (
          <div className="flex gap-1 mt-2 flex-wrap">
            {linked.slice(0, 3).map((h) => (
              <span key={h.id} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">{h.name}</span>
            ))}
            {linked.length > 3 && <span className="text-[10px] text-muted-foreground">+{linked.length - 3}</span>}
          </div>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setCreating(true)}
        className="w-full rounded-xl gradient-primary text-primary-foreground p-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-soft"
      >
        <Plus className="h-4 w-4" />{t('habits.newGoal')}
      </button>

      {goals.length === 0 && (
        <div className="rounded-2xl bg-card border border-border p-6 text-center text-sm text-muted-foreground">
          {t('habits.noGoals')}
        </div>
      )}

      {grouped.active.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            {t('habits.activeGoals')} · {grouped.active.length}
          </h3>
          {grouped.active.map(renderCard)}
        </div>
      )}
      {grouped.completed.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            {t('habits.completedGoals')} · {grouped.completed.length}
          </h3>
          {grouped.completed.map(renderCard)}
        </div>
      )}

      <GoalFormSheet open={creating} onOpenChange={setCreating} />
      <GoalDetailSheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)} goalId={openId} />
    </div>
  );
}