import { useEffect, useMemo, useState } from 'react';
import { useContacts, useContactGroups, Contact } from '@/hooks/useContacts';
import { ContactCard } from './ContactCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Plus, Filter, CheckSquare, Trash2, Tag } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function ContactsList({
  onPick, onCreate, scope,
}: {
  onPick: (id: string) => void;
  onCreate: () => void;
  scope?: 'all' | 'recent' | 'favorites';
}) {
  const { user } = useAuth();
  const { contacts, refresh, bulkDelete, bulkUpdate } = useContacts();
  const { groups, subgroups } = useContactGroups();
  const [q, setQ] = useState('');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [subgroupFilter, setSubgroupFilter] = useState<string>('all');
  const [phoneByContact, setPhoneByContact] = useState<Record<string, string>>({});
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Load primary phone per contact (one query)
  useEffect(() => {
    if (!user || !contacts.length) return;
    (async () => {
      const ids = contacts.map((c) => c.id);
      const { data } = await supabase.from('contact_phones')
        .select('contact_id,number,position')
        .in('contact_id', ids).order('position');
      const map: Record<string, string> = {};
      ((data as any[]) || []).forEach((p) => {
        if (!map[p.contact_id]) map[p.contact_id] = p.number;
      });
      setPhoneByContact(map);
    })();
  }, [user, contacts]);

  const filteredSubgroups = subgroups.filter((s) => groupFilter === 'all' || s.group_id === groupFilter);

  const filtered = useMemo(() => {
    let list = contacts.filter((c) => c.status === 'active');
    if (scope === 'favorites') list = list.filter((c) => c.is_favorite);
    if (scope === 'recent') {
      list = [...list].sort((a, b) => {
        const at = a.last_interaction_at ? new Date(a.last_interaction_at).getTime() : 0;
        const bt = b.last_interaction_at ? new Date(b.last_interaction_at).getTime() : 0;
        return bt - at;
      }).filter((c) => c.last_interaction_at);
    }
    if (groupFilter !== 'all') list = list.filter((c) => c.group_id === groupFilter);
    if (subgroupFilter !== 'all') list = list.filter((c) => c.subgroup_id === subgroupFilter);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((c) =>
        c.full_name.toLowerCase().includes(t)
        || (c.nickname || '').toLowerCase().includes(t)
        || (c.company || '').toLowerCase().includes(t)
        || (c.location || '').toLowerCase().includes(t)
        || (phoneByContact[c.id] || '').includes(t),
      );
    }
    return list;
  }, [contacts, scope, groupFilter, subgroupFilter, q, phoneByContact]);

  const toggleSel = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const clearSel = () => { setSelected(new Set()); setSelecting(false); };

  const bulkMove = async (groupId: string) => {
    await bulkUpdate(Array.from(selected), { group_id: groupId === 'none' ? null : groupId, subgroup_id: null });
    toast.success('Moved');
    clearSel();
  };
  const bulkDel = async () => {
    if (!confirm(`Delete ${selected.size} contacts?`)) return;
    await bulkDelete(Array.from(selected));
    toast.success('Deleted');
    clearSel();
  };
  const bulkArchive = async () => {
    await bulkUpdate(Array.from(selected), { status: 'archived' });
    toast.success('Archived');
    clearSel();
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-9 pr-8 h-10" />
          {q && (
            <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground tap">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <Button onClick={onCreate} size="icon" className="h-10 w-10 shrink-0"><Plus className="h-4 w-4" /></Button>
      </div>

      <div className="flex gap-2">
        <Select value={groupFilter} onValueChange={(v) => { setGroupFilter(v); setSubgroupFilter('all'); }}>
          <SelectTrigger className="h-9"><Filter className="h-3.5 w-3.5 mr-1" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All groups</SelectItem>
            {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {groupFilter !== 'all' && filteredSubgroups.length > 0 && (
          <Select value={subgroupFilter} onValueChange={setSubgroupFilter}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sub-groups</SelectItem>
              {filteredSubgroups.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <Button variant={selecting ? 'default' : 'outline'} size="sm" className="h-9" onClick={() => { setSelecting((v) => !v); setSelected(new Set()); }}>
          <CheckSquare className="h-3.5 w-3.5 mr-1" /> {selecting ? 'Done' : 'Select'}
        </Button>
      </div>

      {selecting && selected.size > 0 && (
        <div className="rounded-2xl bg-primary/10 border border-primary/30 p-2.5 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Select onValueChange={bulkMove}>
            <SelectTrigger className="h-8 w-auto"><SelectValue placeholder="Move to…" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No group</SelectItem>
              {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" className="h-8" onClick={bulkArchive}>Archive</Button>
          <Button size="sm" variant="destructive" className="h-8" onClick={bulkDel}><Trash2 className="h-3.5 w-3.5 mr-1" />Delete</Button>
          <Button size="sm" variant="ghost" className="h-8 ml-auto" onClick={clearSel}><X className="h-3.5 w-3.5" /></Button>
        </div>
      )}

      <div className="space-y-1.5">
        {filtered.map((c) => {
          const g = c.group_id ? groups.find((x) => x.id === c.group_id) : null;
          return (
            <ContactCard key={c.id} contact={c} groupName={g?.name} groupColor={g?.color}
              primaryPhone={phoneByContact[c.id]}
              selectable={selecting}
              selected={selected.has(c.id)}
              onSelectChange={() => toggleSel(c.id)}
              onClick={() => selecting ? toggleSel(c.id) : onPick(c.id)} />
          );
        })}
        {!filtered.length && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {contacts.length === 0 ? 'No contacts yet. Tap + to add one.' : 'No contacts match.'}
          </div>
        )}
      </div>
    </div>
  );
}
