import { useEffect, useState } from 'react';
import { AppBar } from '@/components/app/AppBar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useContactGroups, useContacts } from '@/hooks/useContacts';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_CONTACT_GROUPS } from '@/data/contactDefaults';
import { ContactsList } from '@/components/contacts/ContactsList';
import { GroupsView } from '@/components/contacts/GroupsView';
import { ContactFormSheet } from '@/components/contacts/ContactFormSheet';
import { ContactDetailSheet } from '@/components/contacts/ContactDetailSheet';
import { ContactsDesktop } from '@/components/contacts/ContactsDesktop';

export default function Contacts() {
  const { user } = useAuth();
  const { groups, loading: gLoading, refresh: gRefresh } = useContactGroups();
  const { contacts } = useContacts();
  const [tab, setTab] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [defaultGroupId, setDefaultGroupId] = useState<string | null>(null);
  const [defaultSubgroupId, setDefaultSubgroupId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  // Seed default groups on first visit
  useEffect(() => {
    if (!user || gLoading) return;
    if (groups.length > 0) return;
    (async () => {
      const rows = DEFAULT_CONTACT_GROUPS.map((g, i) => ({
        user_id: user.id, name: g.name, color: g.color, icon: g.icon, position: i,
      }));
      await supabase.from('contact_groups').insert(rows);
      gRefresh();
    })();
  }, [user, groups.length, gLoading, gRefresh]);

  const openCreate = (groupId?: string, subgroupId?: string) => {
    setDefaultGroupId(groupId ?? null);
    setDefaultSubgroupId(subgroupId ?? null);
    setFormOpen(true);
  };

  return (
    <div className="pb-24">
      <div className="md:hidden">
        <AppBar title="Contacts" subtitle={`${contacts.length} people`} right={
          <Button size="icon" variant="ghost" onClick={() => openCreate()}><Plus className="h-5 w-5" /></Button>
        } />
      </div>
      <div className="hidden md:flex md:items-center md:justify-between md:mb-4">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground">{contacts.length} people</p>
        </div>
      </div>

      {/* DESKTOP — split view */}
      <ContactsDesktop onCreate={openCreate} />

      {/* MOBILE — tabbed view */}
      <main className="md:hidden max-w-md mx-auto px-3 pt-16 space-y-4">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-3">
            <ContactsList scope="all" onPick={setDetailId} onCreate={() => openCreate()} />
          </TabsContent>
          <TabsContent value="groups" className="mt-3 space-y-4">
            <GroupsView onPickGroup={(gid, sid) => { setTab('all'); setTimeout(() => { /* filtering by group is via ContactsList state — switch to all and let user filter */ }, 0); openInGroup(gid, sid); }} />
          </TabsContent>
          <TabsContent value="recent" className="mt-3">
            <ContactsList scope="recent" onPick={setDetailId} onCreate={() => openCreate()} />
          </TabsContent>
          <TabsContent value="favorites" className="mt-3">
            <ContactsList scope="favorites" onPick={setDetailId} onCreate={() => openCreate()} />
          </TabsContent>
        </Tabs>
      </main>

      <ContactFormSheet
        open={formOpen} onOpenChange={setFormOpen}
        defaultGroupId={defaultGroupId} defaultSubgroupId={defaultSubgroupId}
        onSaved={(id) => setDetailId(id)}
      />
      <ContactDetailSheet
        open={!!detailId} onOpenChange={(b) => !b && setDetailId(null)}
        contactId={detailId}
        onNavigate={(id) => setDetailId(id)}
      />
    </div>
  );

  // Helper: pick a group → open create-form pre-filled with that group
  function openInGroup(gid: string, sid?: string) {
    openCreate(gid, sid);
  }
}
