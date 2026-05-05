import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Task } from '@/hooks/useTasks';

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
  groupId: string;
  task?: Task | null;
};

export function TaskFormSheet({ open, onOpenChange, onSaved, groupId, task }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? '');
      setNotes(task?.notes ?? '');
      setDueDate(task?.due_date ?? '');
      setPriority(task?.priority ?? 'medium');
    }
  }, [open, task]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;
    setSaving(true);
    const payload = { title: title.trim(), notes: notes.trim() || null, due_date: dueDate || null, priority };
    if (task) {
      await supabase.from('tasks').update(payload).eq('id', task.id);
    } else {
      await supabase.from('tasks').insert({ ...payload, user_id: user.id, group_id: groupId });
    }
    setSaving(false);
    onSaved();
    onOpenChange(false);
  };

  const priColor = (p: string) => p === 'high' ? 'bg-destructive/10 text-destructive border-destructive/30' : p === 'low' ? 'bg-muted text-muted-foreground border-border' : 'bg-warning/10 text-warning border-warning/30';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto">
        <SheetHeader><SheetTitle>{task ? t('common.edit') : t('tasks.newTask')}</SheetTitle></SheetHeader>
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label>{t('tasks.taskTitle')}</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required autoFocus maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('tasks.notes')}</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} maxLength={1000} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('tasks.dueDate')}</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>{t('tasks.priority')}</Label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button key={p} type="button" onClick={() => setPriority(p)}
                  className={cn('h-10 rounded-xl border text-sm font-medium tap', priority === p ? priColor(p) : 'border-border text-muted-foreground')}>
                  {t(`tasks.${p}`)}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full h-12" disabled={saving}>{t('common.save')}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
