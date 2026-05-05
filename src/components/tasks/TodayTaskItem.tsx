import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Task, Subtask } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';

export function TodayTaskItem({
  task,
  subtasks,
  onChanged,
}: {
  task: Task;
  subtasks: Subtask[];
  onChanged: () => void;
}) {
  const hasSubs = subtasks.length > 0;
  const completedSubs = subtasks.filter((s) => !!s.completed_at).length;
  const pct = hasSubs ? Math.round((completedSubs / subtasks.length) * 100) : 0;
  const done = !!task.completed_at;

  const toggleTask = async (val: boolean) => {
    await supabase
      .from('tasks')
      .update({ completed_at: val ? new Date().toISOString() : null })
      .eq('id', task.id);
    onChanged();
  };

  const toggleSub = async (id: string, val: boolean) => {
    await supabase
      .from('subtasks')
      .update({ completed_at: val ? new Date().toISOString() : null })
      .eq('id', id);
    onChanged();
  };

  return (
    <div className="p-3">
      <div className="flex items-center gap-3">
        <Checkbox checked={done} onCheckedChange={(v) => toggleTask(!!v)} />
        <Link to={`/app/tasks/${task.group_id}`} className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', done && 'line-through text-muted-foreground')}>
            {task.title}
          </p>
        </Link>
      </div>
      {hasSubs && (
        <div className="mt-2 pl-7 pr-1">
          <div className="flex items-center gap-2">
            <Progress value={pct} className="h-1.5 flex-1" />
            <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
              {completedSubs}/{subtasks.length} · {pct}%
            </span>
          </div>
          <div className="mt-2 space-y-1.5">
            {subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <Checkbox checked={!!s.completed_at} onCheckedChange={(v) => toggleSub(s.id, !!v)} />
                <span
                  className={cn(
                    'text-xs flex-1 text-muted-foreground',
                    s.completed_at && 'line-through opacity-70'
                  )}
                >
                  {s.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Hook: fetch all subtasks for a list of task ids in one query. */
export function useSubtasksForTasks(taskIds: string[]) {
  const [map, setMap] = useState<Record<string, Subtask[]>>({});

  const refresh = async () => {
    if (taskIds.length === 0) {
      setMap({});
      return;
    }
    const { data } = await supabase
      .from('subtasks')
      .select('*')
      .in('task_id', taskIds)
      .order('position')
      .order('created_at');
    const grouped: Record<string, Subtask[]> = {};
    (data as Subtask[] | null)?.forEach((s) => {
      (grouped[s.task_id] ||= []).push(s);
    });
    setMap(grouped);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskIds.join(',')]);

  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskIds.join(',')]);

  return { subtasksByTask: map, refresh };
}