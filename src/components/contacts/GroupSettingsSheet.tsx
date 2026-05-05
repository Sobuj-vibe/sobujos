import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useContactCustomFields, ContactGroup, ContactCustomField } from '@/hooks/useContacts';
import { toast } from 'sonner';

export function GroupSettingsSheet({
  open, onOpenChange, group,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  group: ContactGroup;
}) {
  const { fields, addField, removeField } = useContactCustomFields(group.id);
  const [label, setLabel] = useState('');
  const [type, setType] = useState<ContactCustomField['type']>('text');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    await addField(label.trim(), type);
    setLabel('');
    toast.success('Field added');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Custom fields · {group.name}</SheetTitle>
        </SheetHeader>
        <p className="text-xs text-muted-foreground mt-1">
          These fields show on every contact in this group (e.g. Student ID, Department).
        </p>
        <div className="space-y-2 mt-4">
          {fields.map((f) => (
            <div key={f.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
              <div className="flex-1">
                <p className="text-sm font-medium">{f.label}</p>
                <p className="text-[11px] text-muted-foreground capitalize">{f.type}</p>
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeField(f.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
          {!fields.length && <p className="text-sm text-muted-foreground text-center py-4">No custom fields yet.</p>}
        </div>
        <form onSubmit={submit} className="space-y-3 mt-4 border-t border-border pt-4">
          <div className="space-y-1.5">
            <Label>Field label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Student ID" maxLength={40} />
          </div>
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as ContactCustomField['type'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="url">URL</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full"><Plus className="h-4 w-4 mr-1" /> Add field</Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
