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

export default function Tasks() {
  const { t } = useTranslation();
  const { groups, refresh } = useTaskGroups();
  const { tasks, refresh: refreshTasks } = useTasks();
  const [open, setOpen] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = useMemo(
    () => tasks.filter((x) => !x.completed_at && x.due_date && x.due_date <= today),
    [tasks, today]
  );

  const toggleTask = async (id: string, done: boolean) => {
    await supabase.from('tasks').update({ completed_at: done ? new Date().toISOString() : null }).eq('id', id);
    refreshTasks();
  };

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

        {todayTasks.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground px-1">{t('tasks.todayTitle')}</h2>
            <div className="rounded-2xl bg-card border border-border shadow-soft divide-y divide-border">
              {todayTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3">
                  <Checkbox checked={false} onCheckedChange={(v) => toggleTask(task.id, !!v)} />
                  <Link to={`/app/tasks/${task.group_id}`} className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                  </Link>
                </div>
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
