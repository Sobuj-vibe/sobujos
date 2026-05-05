import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { useContactGroups, ContactSubgroup } from '@/hooks/useContacts';
import { toast } from 'sonner';

export function SubgroupFormSheet({
  open, onOpenChange, groupId, subgroup,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  groupId: string;
  subgroup?: ContactSubgroup | null;
}) {
  const { addSubgroup, updateSubgroup, removeSubgroup } = useContactGroups();
  const [name, setName] = useState('');

  useEffect(() => { if (open) setName(subgroup?.name ?? ''); }, [open, subgroup]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (subgroup) await updateSubgroup(subgroup.id, { name: name.trim() });
    else await addSubgroup(groupId, name.trim());
    toast.success('Saved');
    onOpenChange(false);
  };
  const del = async () => {
    if (!subgroup) return;
    if (!confirm('Delete this sub-group? Contacts will lose this sub-group.')) return;
    await removeSubgroup(subgroup.id);
    toast.success('Deleted');
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl">
        <SheetHeader><SheetTitle>{subgroup ? 'Edit sub-group' : 'New sub-group'}</SheetTitle></SheetHeader>
        <form onSubmit={submit} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <Label htmlFor="sgn">Sub-group name</Label>
            <Input id="sgn" value={name} onChange={(e) => setName(e.target.value)} required autoFocus maxLength={60} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1 h-12">Save</Button>
            {subgroup && (
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
