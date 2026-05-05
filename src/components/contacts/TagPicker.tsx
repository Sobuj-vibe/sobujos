import { useState } from 'react';
import { useContactTags } from '@/hooks/useContacts';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TagPicker({
  value, onChange,
}: { value: string[]; onChange: (ids: string[]) => void }) {
  const { tags, addTag } = useContactTags();
  const [newTag, setNewTag] = useState('');
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  };
  const create = async () => {
    if (!newTag.trim()) return;
    const t = await addTag(newTag.trim());
    if (t?.id) onChange([...value, t.id]);
    setNewTag('');
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => {
          const active = value.includes(t.id);
          return (
            <button key={t.id} type="button" onClick={() => toggle(t.id)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs border transition-colors tap',
                active ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/40 border-border'
              )}>
              {t.name}
              {active && <X className="inline h-3 w-3 ml-1" />}
            </button>
          );
        })}
        {!tags.length && <span className="text-xs text-muted-foreground">No tags yet</span>}
      </div>
      <div className="flex gap-2">
        <Input value={newTag} onChange={(e) => setNewTag(e.target.value)}
          placeholder="New tag…" className="h-9" maxLength={32}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); create(); } }} />
        <Button type="button" size="sm" variant="secondary" onClick={create}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
