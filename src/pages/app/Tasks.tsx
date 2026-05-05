import { useState, useMemo } from 'react';
import { AppBar } from '@/components/app/AppBar';
import { useTaskGroups, useTasks } from '@/hooks/useTasks';
import { GroupCard } from '@/components/tasks/GroupCard';
import { GroupFormSheet } from '@/components/tasks/GroupFormSheet';
import { Plus, FolderPlus, ListTodo } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { TodayTaskItem, useSubtasksForTasks } from '@/components/tasks/TodayTaskItem';
import { cn } from '@/lib/utils';

type ViewMode = 'today' | 'tomorrow' | 'week';

export default function Tasks() {
  const { t } = useTranslation();
  const { groups, refresh } = useTaskGroups();
  const { tasks, refresh: refreshTasks } = useTasks();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<ViewMode>('today');

  const { today, tomorrow, weekEnd } = useMemo(() => {
    const d = new Date();
    const iso = (x: Date) => x.toISOString().slice(0, 10);
    const tmr = new Date(d);
    tmr.setDate(d.getDate() + 1);
    const wk = new Date(d);
    wk.setDate(d.getDate() + 6);
    return { today: iso(d), tomorrow: iso(tmr), weekEnd: iso(wk) };
  }, []);

  // Range of dates included in the current view (inclusive)
  const inRange = (date: string) => {
    if (view === 'today') return date <= today;
    if (view === 'tomorrow') return date === tomorrow;
    return date <= weekEnd; // week: from today through next 6 days, includes overdue
  };

  const viewTasks = useMemo(
    () => tasks.filter((x) => x.due_date && inRange(x.due_date)),
    [tasks, view, today, tomorrow, weekEnd]
  );
  const openViewTasks = useMemo(
    () => viewTasks.filter((x) => !x.completed_at),
    [viewTasks]
  );

  const viewIds = useMemo(() => viewTasks.map((t) => t.id), [viewTasks]);
  const { subtasksByTask } = useSubtasksForTasks(viewIds);

  const summary = useMemo(() => {
    const totalTasks = viewTasks.length;
    const completedTasks = viewTasks.filter((x) => x.completed_at).length;

    let totalSubs = 0;
    let completedSubs = 0;
    viewTasks.forEach((tk) => {
      const subs = subtasksByTask[tk.id] || [];
      totalSubs += subs.length;
      completedSubs += subs.filter((s) => !!s.completed_at).length;
    });
    const remainingSubs = totalSubs - completedSubs;

    // Overall completion: combine tasks with no subtasks + subtasks of those that have any
    let unitsTotal = 0;
    let unitsDone = 0;
    viewTasks.forEach((tk) => {
      const subs = subtasksByTask[tk.id] || [];
      if (subs.length > 0) {
        unitsTotal += subs.length;
        unitsDone += subs.filter((s) => !!s.completed_at).length;
      } else {
        unitsTotal += 1;
        if (tk.completed_at) unitsDone += 1;
      }
    });
    const overallPct = unitsTotal ? Math.round((unitsDone / unitsTotal) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      remainingTasks: totalTasks - completedTasks,
      totalSubs,
      completedSubs,
      remainingSubs,
      overallPct,
    };
  }, [viewTasks, subtasksByTask]);

  const viewLabel = view === 'today' ? "Today" : view === 'tomorrow' ? 'Tomorrow' : 'This Week';

  return (
    <div>
      <AppBar title={t('tasks.title')} />
      <div className="pt-appbar md:pt-0 px-4 md:px-0 pb-4 space-y-5">
        <div className="hidden md:flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{t('tasks.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('app.tagline')}</p>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <FolderPlus className="h-4 w-4" />
            {t('tasks.newGroup')}
          </Button>
        </div>

        {/* View toggle */}
        <div className="inline-flex items-center bg-muted rounded-full p-1 text-sm">
          {(['today', 'tomorrow', 'week'] as ViewMode[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn(
                'px-4 py-1.5 rounded-full font-medium tap transition-colors',
                view === v
                  ? 'bg-card text-foreground shadow-soft'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {v === 'today' ? 'Today' : v === 'tomorrow' ? 'Tomorrow' : 'This Week'}
            </button>
          ))}
        </div>

        {viewTasks.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground px-1">
              {viewLabel}'s Task Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
                <p className="text-xs text-muted-foreground">Tasks</p>
                <p className="text-2xl font-bold mt-1">{summary.totalTasks}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="text-emerald-500">{summary.completedTasks} done</span>
                  {' · '}
                  <span>{summary.remainingTasks} left</span>
                </p>
              </div>
              <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
                <p className="text-xs text-muted-foreground">Total subtasks</p>
                <p className="text-2xl font-bold mt-1">{summary.totalSubs}</p>
              </div>
              <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
                <p className="text-xs text-muted-foreground">Completed subtasks</p>
                <p className="text-2xl font-bold mt-1 text-emerald-500">{summary.completedSubs}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {summary.totalSubs ? Math.round((summary.completedSubs / summary.totalSubs) * 100) : 0}%
                </p>
              </div>
              <div className="rounded-2xl bg-card border border-border p-4 shadow-soft">
                <p className="text-xs text-muted-foreground">Overall completion</p>
                <p className="text-2xl font-bold mt-1 text-primary">{summary.overallPct}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">{summary.remainingSubs} subtasks left</p>
              </div>
            </div>
          </section>
        )}

        {openViewTasks.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground px-1">{viewLabel}'s tasks</h2>
            <div className="rounded-2xl bg-card border border-border shadow-soft divide-y divide-border">
              {openViewTasks.slice(0, 8).map((task) => (
                <TodayTaskItem
                  key={task.id}
                  task={task}
                  subtasks={subtasksByTask[task.id] || []}
                  onChanged={refreshTasks}
                />
              ))}
            </div>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground px-1">{t('tasks.title')}</h2>
          {groups.length === 0 ? (
            <div className="rounded-2xl gradient-soft border border-border p-8 text-center space-y-3">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-card flex items-center justify-center shadow-soft">
                <ListTodo className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{t('tasks.noGroups')}</h3>
                <p className="text-sm text-muted-foreground mt-1">{t('tasks.noGroupsSub')}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {groups.map((g) => <GroupCard key={g.id} group={g} />)}
            </div>
          )}
        </section>
      </div>

      <button
        onClick={() => setOpen(true)}
        aria-label={t('tasks.newGroup')}
        className="md:hidden fixed left-4 z-40 tap shadow-elevated rounded-full h-14 w-14 flex items-center justify-center bg-primary text-primary-foreground"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        <FolderPlus className="h-6 w-6" />
      </button>

      <GroupFormSheet open={open} onOpenChange={setOpen} onSaved={refresh} />
    </div>
  );
}
