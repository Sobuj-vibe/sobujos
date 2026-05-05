import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';

const colors = ['indigo', 'teal', 'rose', 'emerald', 'amber', 'sky'];
const iconList = ['Folder', 'Briefcase', 'Home', 'Heart', 'BookOpen', 'Dumbbell', 'ShoppingCart', 'Plane', 'Code', 'Music'];
const colorBg: Record<string, string> = {
  indigo: 'bg-indigo-400', teal: 'bg-teal-400', rose: 'bg-rose-400',
  emerald: 'bg-emerald-400', amber: 'bg-amber-400', sky: 'bg-sky-400',
};

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSaved: () => void;
  group?: { id: string; name: string; color: string; icon: string } | null;
};

export function GroupFormSheet({ open, onOpenChange, onSaved, group }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [color, setColor] = useState('indigo');
  const [icon, setIcon] = useState('Folder');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(group?.name ?? '');
      setColor(group?.color ?? 'indigo');
      setIcon(group?.icon ?? 'Folder');
    }
  }, [open, group]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setSaving(true);
    if (group) {
      await supabase.from('task_groups').update({ name: name.trim(), color, icon }).eq('id', group.id);
    } else {
      await supabase.from('task_groups').insert({ user_id: user.id, name: name.trim(), color, icon });
    }
    setSaving(false);
    onSaved();
    onOpenChange(false);
    toast.success(t('profile.saved'));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader><SheetTitle>{group ? t('common.edit') : t('tasks.newGroup')}</SheetTitle></SheetHeader>
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="gn">{t('tasks.groupName')}</Label>
            <Input id="gn" value={name} onChange={(e) => setName(e.target.value)} required autoFocus maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label>{t('profile.themeColor')}</Label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('h-9 w-9 rounded-full tap', colorBg[c], color === c && 'ring-2 ring-offset-2 ring-foreground/40 ring-offset-background')} />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {iconList.map((i) => {
                const I = (Icons[i as keyof typeof Icons] as any);
                return (
                  <button key={i} type="button" onClick={() => setIcon(i)}
                    className={cn('h-10 w-10 rounded-xl flex items-center justify-center tap border', icon === i ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                    <I className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
          <Button type="submit" className="w-full h-12" disabled={saving}>{t('common.save')}</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
