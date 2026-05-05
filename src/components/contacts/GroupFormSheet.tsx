import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useContactGroups, ContactGroup } from '@/hooks/useContacts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import { Trash2 } from 'lucide-react';

const colors = ['indigo', 'teal', 'rose', 'emerald', 'amber', 'sky'];
const colorBg: Record<string, string> = {
  indigo: 'bg-indigo-400', teal: 'bg-teal-400', rose: 'bg-rose-400',
  emerald: 'bg-emerald-400', amber: 'bg-amber-400', sky: 'bg-sky-400',
};
const iconList = ['Users', 'GraduationCap', 'Briefcase', 'Store', 'Heart', 'Home', 'Building2', 'Contact', 'UserCheck', 'HandHeart'];

export function GroupFormSheet({
  open, onOpenChange, group,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  group?: ContactGroup | null;
}) {
  const { addGroup, updateGroup, removeGroup } = useContactGroups();
  const [name, setName] = useState('');
  const [color, setColor] = useState('indigo');
  const [icon, setIcon] = useState('Users');

  useEffect(() => {
    if (open) {
      setName(group?.name ?? '');
      setColor(group?.color ?? 'indigo');
      setIcon(group?.icon ?? 'Users');
    }
  }, [open, group]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (group) await updateGroup(group.id, { name: name.trim(), color, icon });
    else await addGroup({ name: name.trim(), color, icon });
    toast.success('Saved');
    onOpenChange(false);
  };
  const del = async () => {
    if (!group) return;
    if (!confirm('Delete this group? Contacts will not be deleted but will lose their group.')) return;
    await removeGroup(group.id);
    toast.success('Group deleted');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[88vh] overflow-y-auto">
        <SheetHeader><SheetTitle>{group ? 'Edit group' : 'New contact group'}</SheetTitle></SheetHeader>
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="cgn">Group name</Label>
            <Input id="cgn" value={name} onChange={(e) => setName(e.target.value)} required autoFocus maxLength={60} />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {colors.map((c) => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={cn('h-9 w-9 rounded-full tap', colorBg[c],
                    color === c && 'ring-2 ring-offset-2 ring-foreground/40 ring-offset-background')} />
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
                    className={cn('h-10 w-10 rounded-xl flex items-center justify-center tap border',
                      icon === i ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground')}>
                    <I className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 h-12">Save</Button>
            {group && (
              <Button type="button" variant="destructive" size="icon" className="h-12 w-12" onClick={del}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
