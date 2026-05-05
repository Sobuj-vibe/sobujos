import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Task, Subtask } from '@/hooks/useTasks';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

const groupColorMap: Record<string, string> = {
  indigo: 'from-indigo-400 to-purple-400',
  teal: 'from-teal-400 to-cyan-400',
  rose: 'from-rose-400 to-pink-400',
  emerald: 'from-emerald-400 to-teal-400',
  amber: 'from-amber-400 to-orange-400',
  sky: 'from-sky-400 to-blue-400',
};

export type GroupMeta = { id: string; name: string; color: string; icon: string };

export function TodayTaskItem({
  task,
  subtasks,
  onChanged,
  group,
}: {
  task: Task;
  subtasks: Subtask[];
  onChanged: () => void;
  group?: GroupMeta;
}) {
  const hasSubs = subtasks.length > 0;
  const completedSubs = subtasks.filter((s) => !!s.completed_at).length;
  const pct = hasSubs ? Math.round((completedSubs / subtasks.length) * 100) : 0;
  const done = !!task.completed_at;

  const GroupIcon = group
    ? ((Icons[group.icon as keyof typeof Icons] as any) || Icons.Folder)
    : null;
  const grad = group ? groupColorMap[group.color] || groupColorMap.indigo : '';

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
        {GroupIcon && (
          <Link
            to={`/app/tasks/${task.group_id}`}
            title={group?.name}
            className={cn(
              'h-7 w-7 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-soft shrink-0',
              grad
            )}
          >
            <GroupIcon className="h-3.5 w-3.5 text-white" />
          </Link>
        )}
        <Link to={`/app/tasks/${task.group_id}`} className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium truncate', done && 'line-through text-muted-foreground')}>
            {task.title}
          </p>
          {group && (
            <p className="text-[11px] text-muted-foreground truncate">{group.name}</p>
          )}
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