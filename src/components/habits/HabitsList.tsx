import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as Icons from 'lucide-react';
import { Plus, Pause, Play, Archive, Pencil } from 'lucide-react';
import { Habit, computeBestStreak, computeStreak, useHabits, useHabitLogs } from '@/hooks/useHabits';
import { HabitFormSheet } from './HabitFormSheet';
import { HabitTemplates } from './HabitTemplates';
import { StreakBadge } from './StreakBadge';
import { WeekDots } from './WeekDots';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function HabitsList() {
  const { t } = useTranslation();
  const { items, update } = useHabits();
  const { logs } = useHabitLogs(60);
  const [editing, setEditing] = useState<Habit | null>(null);
  const [creating, setCreating] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const grouped = useMemo(() => {
    const active = items.filter((h) => h.status === 'active');
    const paused = items.filter((h) => h.status === 'paused');
    const archived = items.filter((h) => h.status === 'archived');
    return { active, paused, archived };
  }, [items]);

  const renderCard = (h: Habit) => {
    const Icon = (Icons as any)[h.icon] || Icons.Target;
    const streak = computeStreak(h, logs);
    const best = computeBestStreak(h, logs);
    return (
      <div key={h.id} className="rounded-2xl bg-card border border-border p-3 shadow-soft">
        <div className="flex items-start gap-2">
          <div className="h-10 w-10 rounded-xl gradient-soft flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold truncate">{h.name}</p>
              <StreakBadge streak={streak} />
            </div>
            <p className="text-[11px] text-muted-foreground">
              {h.type === 'boolean'
                ? t(`habits.scheduleKinds.${h.schedule_kind}`)
                : t('habits.dailyTarget', { value: h.target_value, unit: h.target_unit || '' })}
              {' · '}{t('habits.bestStreak', { n: best })}
            </p>
            <div className="mt-2"><WeekDots habit={h} logs={logs} /></div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                <Icons.MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditing(h)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />{t('common.edit')}
              </DropdownMenuItem>
              {h.status === 'active' ? (
                <DropdownMenuItem onClick={() => update(h.id, { status: 'paused' })}>
                  <Pause className="h-3.5 w-3.5 mr-2" />{t('habits.pause')}
                </DropdownMenuItem>
              ) : h.status === 'paused' ? (
                <DropdownMenuItem onClick={() => update(h.id, { status: 'active' })}>
                  <Play className="h-3.5 w-3.5 mr-2" />{t('habits.resume')}
                </DropdownMenuItem>
              ) : null}
              {h.status !== 'archived' ? (
                <DropdownMenuItem onClick={() => update(h.id, { status: 'archived' })}>
                  <Archive className="h-3.5 w-3.5 mr-2" />{t('habits.archive')}
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => update(h.id, { status: 'active' })}>
                  <Play className="h-3.5 w-3.5 mr-2" />{t('habits.unarchive')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <button
        onClick={() => setCreating(true)}
        className="w-full rounded-xl gradient-primary text-primary-foreground p-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-soft"
      >
        <Plus className="h-4 w-4" />{t('habits.newHabit')}
      </button>

      {grouped.active.length === 0 && grouped.paused.length === 0 && (
        <HabitTemplates />
      )}

      {grouped.active.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            {t('habits.active')} · {grouped.active.length}
          </h3>
          {grouped.active.map(renderCard)}
        </div>
      )}

      {grouped.paused.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">
            {t('habits.paused')} · {grouped.paused.length}
          </h3>
          {grouped.paused.map(renderCard)}
        </div>
      )}

      {grouped.archived.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowArchived((p) => !p)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            {showArchived ? '▼' : '▶'} {t('habits.archived')} · {grouped.archived.length}
          </button>
          {showArchived && grouped.archived.map(renderCard)}
        </div>
      )}

      <HabitFormSheet open={creating} onOpenChange={setCreating} />
      <HabitFormSheet open={!!editing} onOpenChange={(o) => !o && setEditing(null)} habit={editing} />
    </div>
  );
}