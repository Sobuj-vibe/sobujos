import { useEffect, useMemo, useState } from 'react';
import * as Icons from 'lucide-react';
import { useContacts, useContactGroups } from '@/hooks/useContacts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Plus, Star, Clock, Users as UsersIcon, Settings, Pencil, ChevronRight, Phone as PhoneIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ContactDetailPanel } from './ContactDetailPanel';
import { GroupFormSheet } from './GroupFormSheet';
import { SubgroupFormSheet } from './SubgroupFormSheet';
import { GroupSettingsSheet } from './GroupSettingsSheet';
import { cn } from '@/lib/utils';

type Scope = 'all' | 'recent' | 'favorites' | 'group';

const colorBg: Record<string, string> = {
  indigo: 'bg-indigo-400', teal: 'bg-teal-400', rose: 'bg-rose-400',
  emerald: 'bg-emerald-400', amber: 'bg-amber-400', sky: 'bg-sky-400', slate: 'bg-slate-400',
};
const colorGrad: Record<string, string> = {
  indigo: 'from-indigo-400 to-purple-400',
  teal: 'from-teal-400 to-cyan-400',
  rose: 'from-rose-400 to-pink-400',
  emerald: 'from-emerald-400 to-teal-400',
  amber: 'from-amber-400 to-orange-400',
  sky: 'from-sky-400 to-blue-400',
};

export function ContactsDesktop({ onCreate }: { onCreate: (groupId?: string, subgroupId?: string) => void }) {
  const { user } = useAuth();
  const { contacts } = useContacts();
  const { groups, subgroups } = useContactGroups();
  const [scope, setScope] = useState<Scope>('all');
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeSubgroupId, setActiveSubgroupId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phoneByContact, setPhoneByContact] = useState<Record<string, string>>({});
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

  // Group management sheets
  const [groupOpen, setGroupOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<any>(null);
  const [subOpen, setSubOpen] = useState(false);
  const [subGroupId, setSubGroupId] = useState<string>('');
  const [editSub, setEditSub] = useState<any>(null);
  const [settingsGroup, setSettingsGroup] = useState<any>(null);

  useEffect(() => {
    if (!user || !contacts.length) return;
    (async () => {
      const ids = contacts.map((c) => c.id);
      const { data } = await supabase.from('contact_phones')
        .select('contact_id,number,position').in('contact_id', ids).order('position');
      const map: Record<string, string> = {};
      ((data as any[]) || []).forEach((p) => { if (!map[p.contact_id]) map[p.contact_id] = p.number; });
      setPhoneByContact(map);
    })();
  }, [user, contacts]);

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
    if (scope === 'group' && activeGroupId) {
      list = list.filter((c) => c.group_id === activeGroupId);
      if (activeSubgroupId) list = list.filter((c) => c.subgroup_id === activeSubgroupId);
    }
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
  }, [contacts, scope, activeGroupId, activeSubgroupId, q, phoneByContact]);

  const countFor = (gid: string, sid?: string) =>
    contacts.filter((c) => c.status === 'active' && c.group_id === gid && (sid ? c.subgroup_id === sid : true)).length;

  const headerLabel = scope === 'all' ? 'All Contacts'
    : scope === 'favorites' ? 'Favorites'
    : scope === 'recent' ? 'Recent'
    : groups.find((g) => g.id === activeGroupId)?.name || 'Group';

  return (
    <div className="hidden md:flex h-[calc(100vh-7rem)] rounded-2xl border border-border bg-card overflow-hidden shadow-soft">
      {/* LEFT — Groups & scope rail */}
      <aside className="w-64 border-r border-border bg-muted/20 flex flex-col">
        <div className="p-4 border-b border-border">
          <Button className="w-full" onClick={() => onCreate()}>
            <Plus className="h-4 w-4 mr-2" /> New contact
          </Button>
        </div>
        <div className="p-2 space-y-0.5">
          <RailItem icon={<UsersIcon className="h-4 w-4" />} label="All" active={scope === 'all'}
            count={contacts.filter((c) => c.status === 'active').length}
            onClick={() => { setScope('all'); setActiveGroupId(null); setActiveSubgroupId(null); }} />
          <RailItem icon={<Star className="h-4 w-4" />} label="Favorites" active={scope === 'favorites'}
            count={contacts.filter((c) => c.status === 'active' && c.is_favorite).length}
            onClick={() => { setScope('favorites'); setActiveGroupId(null); setActiveSubgroupId(null); }} />
          <RailItem icon={<Clock className="h-4 w-4" />} label="Recent" active={scope === 'recent'}
            onClick={() => { setScope('recent'); setActiveGroupId(null); setActiveSubgroupId(null); }} />
        </div>
        <div className="px-3 pt-2 pb-1 flex items-center justify-between">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Groups</p>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditGroup(null); setGroupOpen(true); }}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {groups.map((g) => {
            const Icon = (Icons[g.icon as keyof typeof Icons] as any) || Icons.Users;
            const subs = subgroups.filter((s) => s.group_id === g.id);
            const isActive = scope === 'group' && activeGroupId === g.id && !activeSubgroupId;
            const isExpanded = expandedGroup === g.id;
            return (
              <div key={g.id}>
                <div className={cn(
                  'flex items-center gap-1 rounded-lg group',
                  isActive && 'bg-primary/10',
                )}>
                  <button
                    onClick={() => { setScope('group'); setActiveGroupId(g.id); setActiveSubgroupId(null); }}
                    className="flex-1 flex items-center gap-2 px-2 py-1.5 text-left tap min-w-0"
                  >
                    <div className={cn('h-6 w-6 rounded-md bg-gradient-to-br flex items-center justify-center shrink-0', colorGrad[g.color] || colorGrad.indigo)}>
                      <Icon className="h-3 w-3 text-white" />
                    </div>
                    <span className={cn('text-sm truncate flex-1', isActive && 'font-medium')}>{g.name}</span>
                    <span className="text-[10px] text-muted-foreground">{countFor(g.id)}</span>
                  </button>
                  {subs.length > 0 && (
                    <button onClick={() => setExpandedGroup(isExpanded ? null : g.id)} className="p-1 tap text-muted-foreground">
                      <ChevronRight className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-90')} />
                    </button>
                  )}
                  <button onClick={() => setSettingsGroup(g)} className="p-1 tap text-muted-foreground opacity-0 group-hover:opacity-100" title="Custom fields">
                    <Settings className="h-3 w-3" />
                  </button>
                  <button onClick={() => { setEditGroup(g); setGroupOpen(true); }} className="p-1 tap text-muted-foreground opacity-0 group-hover:opacity-100">
                    <Pencil className="h-3 w-3" />
                  </button>
                </div>
                {isExpanded && (
                  <div className="ml-7 mt-0.5 space-y-0.5 border-l border-border pl-2">
                    {subs.map((s) => {
                      const subActive = scope === 'group' && activeGroupId === g.id && activeSubgroupId === s.id;
                      return (
                        <button key={s.id}
                          onClick={() => { setScope('group'); setActiveGroupId(g.id); setActiveSubgroupId(s.id); }}
                          className={cn(
                            'w-full flex items-center gap-2 px-2 py-1 rounded-md text-xs text-left tap',
                            subActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted',
                          )}
                        >
                          <span className="truncate flex-1">{s.name}</span>
                          <span className="text-[10px]">{countFor(g.id, s.id)}</span>
                        </button>
                      );
                    })}
                    <button onClick={() => { setSubGroupId(g.id); setEditSub(null); setSubOpen(true); }}
                      className="w-full flex items-center gap-1 px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground tap">
                      <Plus className="h-3 w-3" /> Sub-group
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* MIDDLE — Contacts list */}
      <section className="w-80 border-r border-border flex flex-col">
        <div className="p-3 border-b border-border space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold truncate">{headerLabel}</h2>
            <span className="text-xs text-muted-foreground">{filtered.length}</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="pl-8 pr-8 h-9 text-sm" />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground tap">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.map((c) => {
            const initials = c.full_name.split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase();
            const g = c.group_id ? groups.find((x) => x.id === c.group_id) : null;
            const grad = colorBg[g?.color || 'indigo'] || colorBg.indigo;
            const active = selectedId === c.id;
            return (
              <button key={c.id} onClick={() => setSelectedId(c.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left tap border-l-2 border-transparent',
                  active ? 'bg-primary/10 border-l-primary' : 'hover:bg-muted/40',
                )}>
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className={cn('h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0', grad)}>
                    {initials || '?'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-medium truncate">{c.full_name}</p>
                    {c.is_favorite && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                    {phoneByContact[c.id] && <><PhoneIcon className="h-2.5 w-2.5" />{phoneByContact[c.id]}</>}
                    {!phoneByContact[c.id] && (c.company || g?.name || '—')}
                  </p>
                </div>
              </button>
            );
          })}
          {!filtered.length && (
            <div className="text-center py-12 text-xs text-muted-foreground px-4">
              {contacts.length === 0 ? 'No contacts yet. Click "New contact" to add one.' : 'No contacts match.'}
            </div>
          )}
        </div>
      </section>

      {/* RIGHT — Detail panel */}
      <section className="flex-1 min-w-0 bg-background">
        <ContactDetailPanel contactId={selectedId} onCreate={() => onCreate(activeGroupId || undefined, activeSubgroupId || undefined)} />
      </section>

      {/* Group sheets */}
      <GroupFormSheet open={groupOpen} onOpenChange={setGroupOpen} group={editGroup} />
      {subGroupId && (
        <SubgroupFormSheet open={subOpen} onOpenChange={setSubOpen} groupId={subGroupId} subgroup={editSub} />
      )}
      {settingsGroup && (
        <GroupSettingsSheet open={!!settingsGroup} onOpenChange={(b) => !b && setSettingsGroup(null)} group={settingsGroup} />
      )}
    </div>
  );
}

function RailItem({ icon, label, count, active, onClick }: { icon: React.ReactNode; label: string; count?: number; active?: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn(
      'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left tap',
      active ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted',
    )}>
      {icon}
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-[10px] text-muted-foreground">{count}</span>}
    </button>
  );
}