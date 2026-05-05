import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { AppBar } from '@/components/app/AppBar';
import { useTasks, Task } from '@/hooks/useTasks';
import { TaskFormSheet } from '@/components/tasks/TaskFormSheet';
import { TaskRow } from '@/components/tasks/TaskRow';
import { Plus, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GroupFormSheet } from '@/components/tasks/GroupFormSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function GroupDetail() {
  const { t } = useTranslation();
  const { id } = useParams();
  const nav = useNavigate();
  const { tasks, refresh } = useTasks(id);
  const [group, setGroup] = useState<{ id: string; name: string; color: string; icon: string } | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [groupEditOpen, setGroupEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from('task_groups').select('*').eq('id', id).maybeSingle().then(({ data }) => setGroup(data as any));
  }, [id]);

  const today = new Date().toISOString().slice(0, 10);
  const grouped = useMemo(() => {
    const todayList: Task[] = [], upcoming: Task[] = [], done: Task[] = [];
    tasks.forEach((tk) => {
      if (tk.completed_at) done.push(tk);
      else if (tk.due_date && tk.due_date <= today) todayList.push(tk);
      else upcoming.push(tk);
    });
    return { todayList, upcoming, done };
  }, [tasks, today]);

  const openEdit = (tk: Task) => { setEditing(tk); setTaskOpen(true); };
  const openNew = () => { setEditing(null); setTaskOpen(true); };

  const deleteGroup = async () => {
    if (!id) return;
    await supabase.from('task_groups').delete().eq('id', id);
    nav('/app/tasks', { replace: true });
  };

  if (!id) return null;

  return (
    <div>
      <AppBar
        title={group?.name ?? '...'}
        back
        right={
          <DropdownMenu>
            <DropdownMenuTrigger className="p-2 rounded-full hover:bg-muted tap"><MoreVertical className="h-5 w-5" /></DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setGroupEditOpen(true)}><Pencil className="h-4 w-4 mr-2" />{t('common.edit')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />{t('common.delete')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />
      <div className="pt-appbar md:pt-0 px-4 md:px-0 pb-4 space-y-5">
        <div className="hidden md:flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => nav(-1)} className="shrink-0">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold truncate">{group?.name ?? '...'}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" />
              {t('tasks.newTask')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setGroupEditOpen(true)}><Pencil className="h-4 w-4 mr-2" />{t('common.edit')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" />{t('common.delete')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {tasks.length === 0 && (
          <div className="rounded-2xl gradient-soft border border-border p-8 text-center text-sm text-muted-foreground">
            {t('tasks.noTasks')}
          </div>
        )}
        <Section label={t('common.today')} list={grouped.todayList} onEdit={openEdit} onChange={refresh} />
        <Section label={t('common.upcoming')} list={grouped.upcoming} onEdit={openEdit} onChange={refresh} />
        <Section label={t('common.completed')} list={grouped.done} onEdit={openEdit} onChange={refresh} />
      </div>

      <button
        onClick={openNew}
        aria-label={t('tasks.newTask')}
        className="md:hidden fixed left-4 z-40 tap shadow-elevated rounded-full h-14 w-14 flex items-center justify-center bg-primary text-primary-foreground"
        style={{ bottom: 'calc(5.5rem + env(safe-area-inset-bottom))' }}
      >
        <Plus className="h-6 w-6" />
      </button>

      <TaskFormSheet open={taskOpen} onOpenChange={setTaskOpen} onSaved={refresh} groupId={id} task={editing} />
      <GroupFormSheet open={groupEditOpen} onOpenChange={setGroupEditOpen} onSaved={() => { setGroupEditOpen(false); supabase.from('task_groups').select('*').eq('id', id).maybeSingle().then(({ data }) => setGroup(data as any)); }} group={group} />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('tasks.deleteGroup')}</AlertDialogTitle>
            <AlertDialogDescription>{t('tasks.deleteGroupConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={deleteGroup} className="bg-destructive text-destructive-foreground">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({ label, list, onEdit, onChange }: { label: string; list: Task[]; onEdit: (t: Task) => void; onChange: () => void }) {
  if (list.length === 0) return null;
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-muted-foreground px-1">{label} <span className="text-xs text-muted-foreground/70">· {list.length}</span></h2>
      <div className="rounded-2xl bg-card border border-border shadow-soft overflow-hidden divide-y divide-border">
        {list.map((tk) => <TaskRow key={tk.id} task={tk} onEdit={onEdit} onChange={onChange} />)}
      </div>
    </section>
  );
}
