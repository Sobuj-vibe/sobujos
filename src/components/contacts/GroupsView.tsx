import { useEffect, useState } from 'react';
import * as Icons from 'lucide-react';
import { useContactGroups, useContacts } from '@/hooks/useContacts';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, ChevronRight, Settings } from 'lucide-react';
import { GroupFormSheet } from './GroupFormSheet';
import { SubgroupFormSheet } from './SubgroupFormSheet';
import { GroupSettingsSheet } from './GroupSettingsSheet';

const colorMap: Record<string, string> = {
  indigo: 'from-indigo-400 to-purple-400',
  teal: 'from-teal-400 to-cyan-400',
  rose: 'from-rose-400 to-pink-400',
  emerald: 'from-emerald-400 to-teal-400',
  amber: 'from-amber-400 to-orange-400',
  sky: 'from-sky-400 to-blue-400',
};

export function GroupsView({
  onPickGroup, onPickSubgroup,
}: {
  onPickGroup: (groupId: string, subgroupId?: string) => void;
  onPickSubgroup?: (subgroupId: string) => void;
}) {
  const { groups, subgroups } = useContactGroups();
  const { contacts } = useContacts();
  const [groupOpen, setGroupOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<any>(null);
  const [subOpen, setSubOpen] = useState(false);
  const [subGroupId, setSubGroupId] = useState<string>('');
  const [editSub, setEditSub] = useState<any>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [settingsGroup, setSettingsGroup] = useState<any>(null);

  const countFor = (gid: string, sid?: string) =>
    contacts.filter((c) => c.group_id === gid && (sid ? c.subgroup_id === sid : true)).length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">Contact Groups</h2>
        <Button size="sm" variant="ghost" onClick={() => { setEditGroup(null); setGroupOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Group
        </Button>
      </div>
      <div className="space-y-2">
        {groups.map((g) => {
          const Icon = (Icons[g.icon as keyof typeof Icons] as any) || Icons.Users;
          const grad = colorMap[g.color] || colorMap.indigo;
          const subs = subgroups.filter((s) => s.group_id === g.id);
          const isOpen = expanded === g.id;
          return (
            <div key={g.id} className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="flex items-center gap-3 p-3">
                <button onClick={() => onPickGroup(g.id)} className="flex items-center gap-3 flex-1 min-w-0 tap text-left">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shadow-soft shrink-0`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{g.name}</p>
                    <p className="text-xs text-muted-foreground">{countFor(g.id)} contacts · {subs.length} sub-groups</p>
                  </div>
                </button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSettingsGroup(g)} title="Custom fields">
                  <Settings className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditGroup(g); setGroupOpen(true); }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <button onClick={() => setExpanded(isOpen ? null : g.id)} className="p-1 tap">
                  <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
              </div>
              {isOpen && (
                <div className="border-t border-border bg-muted/20 px-3 py-2 space-y-1">
                  {subs.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <button onClick={() => onPickGroup(g.id, s.id)} className="flex-1 text-left text-sm py-1.5 tap">
                        {s.name} <span className="text-xs text-muted-foreground">({countFor(g.id, s.id)})</span>
                      </button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setSubGroupId(g.id); setEditSub(s); setSubOpen(true); }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button size="sm" variant="ghost" className="w-full justify-start h-8" onClick={() => { setSubGroupId(g.id); setEditSub(null); setSubOpen(true); }}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add sub-group
                  </Button>
                </div>
              )}
            </div>
          );
        })}
        {!groups.length && (
          <div className="text-center py-10 text-sm text-muted-foreground">No groups yet. Tap + to create one.</div>
        )}
      </div>

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
