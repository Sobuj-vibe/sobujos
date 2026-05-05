import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, Plus, Trash2, Pencil, Sparkles, Loader2 } from 'lucide-react';
import { Goal, useGoals, useGoalNotes, useMilestones } from '@/hooks/useGoals';
import { useHabits, useHabitLogs, computeStreak } from '@/hooks/useHabits';
import { useTimezone } from '@/contexts/TimezoneContext';
import { GoalFormSheet } from './GoalFormSheet';
import { StreakBadge } from './StreakBadge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

export function GoalDetailSheet({
  open, onOpenChange, goalId,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  goalId: string | null;
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { items: goals, update } = useGoals();
  const { items: milestones, add: addMs, toggle: toggleMs, remove: removeMs, refresh: refreshMs } = useMilestones(goalId);
  const { items: notes, add: addNote, remove: removeNote } = useGoalNotes(goalId);
  const { items: habits } = useHabits();
  const { timezone } = useTimezone();
  const { logs } = useHabitLogs(60);
  const [editing, setEditing] = useState(false);
  const [newMs, setNewMs] = useState('');
  const [newMsDate, setNewMsDate] = useState('');
  const [newNote, setNewNote] = useState('');
  const [breakdown, setBreakdown] = useState(false);

  const goal = goals.find((g) => g.id === goalId) || null;
  if (!goal) return null;

  const linkedHabits = habits.filter((h) => h.goal_id === goal.id);
  const completedMs = milestones.filter((m) => m.completed_at).length;
  const totalMs = milestones.length;
  const pct = goal.target_value && goal.target_value > 0
    ? Math.min(100, (goal.current_value / goal.target_value) * 100)
    : totalMs > 0
    ? (completedMs / totalMs) * 100
    : 0;

  const daysLeft = goal.deadline
    ? Math.ceil((new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const aiBreakdown = async () => {
    if (!user || !goalId) return;
    setBreakdown(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          messages: [{
            role: 'user',
            content: `Break down this goal into 4-6 actionable milestones with realistic order. Goal: "${goal.title}"${goal.description ? '. Details: ' + goal.description : ''}${goal.deadline ? '. Deadline: ' + goal.deadline : ''}. Use the add_milestone tool for each. Don't ask questions, just add them.`,
          }],
          context: { goal_id: goalId },
        },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });
      if (error) throw error;
      await refreshMs();
      toast.success(t('habits.milestonesAdded'));
    } catch (e: any) {
      toast.error(e.message || 'Failed');
    } finally { setBreakdown(false); }
  };

  const updateProgress = async (delta: number) => {
    const next = Math.max(0, goal.current_value + delta);
    await update(goal.id, { current_value: next });
  };

  const completeGoal = async () => {
    await update(goal.id, {
      status: goal.status === 'completed' ? 'active' : 'completed',
      completed_at: goal.status === 'completed' ? null : new Date().toISOString(),
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between">
              <span className="truncate pr-2">{goal.title}</span>
              <button onClick={() => setEditing(true)} className="p-1.5 rounded hover:bg-muted">
                <Pencil className="h-4 w-4" />
              </button>
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            {/* Progress */}
            <div className="rounded-2xl gradient-primary p-4 text-primary-foreground">
              <div className="flex items-baseline justify-between">
                <span className="text-xs opacity-90">{t(`habits.categories.${goal.category}`)} · {t(`habits.goalTypes.${goal.type}`)}</span>
                <span className="text-sm font-semibold tabular-nums">{Math.round(pct)}%</span>
              </div>
              <div className="h-2 mt-2 rounded-full bg-white/25 overflow-hidden">
                <div className="h-full bg-white" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs opacity-90">
                {goal.target_value ? (
                  <span className="tabular-nums">{goal.current_value} / {goal.target_value} {goal.target_unit || ''}</span>
                ) : (
                  <span>{completedMs} / {totalMs} {t('habits.milestones')}</span>
                )}
                {daysLeft !== null && (
                  <span>{daysLeft >= 0 ? t('habits.daysLeft', { n: daysLeft }) : t('habits.daysOverdue', { n: -daysLeft })}</span>
                )}
              </div>
              {goal.target_value && (
                <div className="flex items-center gap-2 mt-3">
                  <button onClick={() => updateProgress(-1)} className="px-2 py-1 rounded bg-white/20 text-xs">-1</button>
                  <button onClick={() => updateProgress(1)} className="px-2 py-1 rounded bg-white/20 text-xs">+1</button>
                  <button onClick={() => updateProgress(5)} className="px-2 py-1 rounded bg-white/20 text-xs">+5</button>
                  <Button size="sm" variant="secondary" onClick={completeGoal} className="ml-auto">
                    {goal.status === 'completed' ? t('habits.reopen') : t('habits.markComplete')}
                  </Button>
                </div>
              )}
            </div>

            {goal.description && (
              <p className="text-xs text-muted-foreground">{goal.description}</p>
            )}

            {/* Milestones */}
            <div className="rounded-2xl bg-card border border-border p-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">{t('habits.milestones')}</h3>
                <button
                  onClick={aiBreakdown}
                  disabled={breakdown}
                  className="text-xs flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
                >
                  {breakdown ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {t('habits.aiBreakdown')}
                </button>
              </div>
              <div className="space-y-1.5">
                {milestones.map((m) => (
                  <div key={m.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => toggleMs(m.id)}
                      className={cn(
                        'h-5 w-5 rounded border-2 flex items-center justify-center shrink-0',
                        m.completed_at ? 'gradient-primary border-transparent' : 'border-border',
                      )}
                    >
                      {m.completed_at && <Check className="h-3 w-3 text-primary-foreground" />}
                    </button>
                    <span className={cn('text-xs flex-1 min-w-0 truncate', m.completed_at && 'line-through text-muted-foreground')}>
                      {m.title}
                    </span>
                    {m.target_date && (
                      <span className="text-[10px] text-muted-foreground">{m.target_date}</span>
                    )}
                    <button
                      onClick={() => removeMs(m.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1.5 mt-2">
                <Input
                  value={newMs}
                  onChange={(e) => setNewMs(e.target.value)}
                  placeholder={t('habits.addMilestone')}
                  className="h-8 text-xs"
                />
                <Input
                  type="date"
                  value={newMsDate}
                  onChange={(e) => setNewMsDate(e.target.value)}
                  className="h-8 text-xs w-32"
                />
                <Button
                  size="sm"
                  onClick={async () => { if (newMs.trim()) { await addMs(newMs.trim(), newMsDate || null); setNewMs(''); setNewMsDate(''); } }}
                  className="h-8"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Linked habits */}
            {linkedHabits.length > 0 && (
              <div className="rounded-2xl bg-card border border-border p-3">
                <h3 className="text-sm font-semibold mb-2">{t('habits.linkedHabits')}</h3>
                <div className="space-y-1.5">
                  {linkedHabits.map((h) => {
                    const Icon = (Icons as any)[h.icon] || Icons.Target;
                    return (
                      <div key={h.id} className="flex items-center gap-2 text-xs">
                        <Icon className="h-3.5 w-3.5 text-primary" />
                        <span className="flex-1 truncate">{h.name}</span>
                        <StreakBadge streak={computeStreak(h, logs, timezone)} />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="rounded-2xl bg-card border border-border p-3">
              <h3 className="text-sm font-semibold mb-2">{t('habits.notes')}</h3>
              <div className="flex gap-1.5 mb-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder={t('habits.addNote')}
                  rows={1}
                  className="text-xs min-h-[36px]"
                />
                <Button
                  size="sm"
                  onClick={async () => { if (newNote.trim()) { await addNote(newNote); setNewNote(''); } }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {notes.map((n) => (
                  <div key={n.id} className="text-xs p-2 rounded bg-muted/40 group flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="whitespace-pre-wrap break-words">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(n.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => removeNote(n.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <GoalFormSheet open={editing} onOpenChange={setEditing} goal={goal} />
    </>
  );
}