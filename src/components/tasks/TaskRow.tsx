import { useState } from 'react';
import { Task, useSubtasks } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown, ChevronRight, Plus, MoreVertical, Pencil, Trash2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';

export function TaskRow({ task, onEdit, onChange }: { task: Task; onEdit: (t: Task) => void; onChange: () => void }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [newSub, setNewSub] = useState('');
  const { subtasks, refresh: refreshSubs } = useSubtasks(expanded ? task.id : null);

  const done = !!task.completed_at;
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = !done && task.due_date && task.due_date < today;

  const toggleTask = async (val: boolean) => {
    await supabase.from('tasks').update({ completed_at: val ? new Date().toISOString() : null }).eq('id', task.id);
    onChange();
  };
  const toggleSub = async (id: string, val: boolean) => {
    await supabase.from('subtasks').update({ completed_at: val ? new Date().toISOString() : null }).eq('id', id);
    refreshSubs();
  };
  const addSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSub.trim() || !user) return;
    await supabase.from('subtasks').insert({ task_id: task.id, user_id: user.id, title: newSub.trim() });
    setNewSub('');
    refreshSubs();
  };
  const removeTask = async () => { await supabase.from('tasks').delete().eq('id', task.id); onChange(); };
  const removeSub = async (id: string) => { await supabase.from('subtasks').delete().eq('id', id); refreshSubs(); };

  const priColor = task.priority === 'high' ? 'bg-destructive' : task.priority === 'low' ? 'bg-muted-foreground/40' : 'bg-warning';

  return (
    <div>
      <div className="flex items-center gap-3 p-3">
        <div className={cn('w-1 h-8 rounded-full shrink-0', priColor)} />
        <Checkbox checked={done} onCheckedChange={(v) => toggleTask(!!v)} />
        <button onClick={() => setExpanded(!expanded)} className="flex-1 min-w-0 text-left">
          <p className={cn('text-sm font-medium truncate', done && 'line-through text-muted-foreground')}>{task.title}</p>
          {task.due_date && (
            <p className={cn('text-xs flex items-center gap-1 mt-0.5', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
              <Calendar className="h-3 w-3" />{format(parseISO(task.due_date), 'MMM d')}
            </p>
          )}
        </button>
        <button onClick={() => setExpanded(!expanded)} className="p-1 text-muted-foreground tap">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1 text-muted-foreground tap"><MoreVertical className="h-4 w-4" /></DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}><Pencil className="h-4 w-4 mr-2" />{t('common.edit')}</DropdownMenuItem>
            <DropdownMenuItem onClick={removeTask} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />{t('common.delete')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {expanded && (
        <div className="px-3 pb-3 pl-12 space-y-1.5">
          {task.notes && <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">{task.notes}</p>}
          {subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-2 group">
              <Checkbox checked={!!s.completed_at} onCheckedChange={(v) => toggleSub(s.id, !!v)} />
              <span className={cn('flex-1 text-sm', s.completed_at && 'line-through text-muted-foreground')}>{s.title}</span>
              <button onClick={() => removeSub(s.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground tap"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          ))}
          <form onSubmit={addSub} className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <Input value={newSub} onChange={(e) => setNewSub(e.target.value)} placeholder={t('tasks.addSubtask')}
              className="h-8 text-sm border-0 bg-transparent focus-visible:ring-0 px-0" />
          </form>
        </div>
      )}
    </div>
  );
}
