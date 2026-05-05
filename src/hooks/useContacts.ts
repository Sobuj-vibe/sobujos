import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

export type ContactGroup = Database['public']['Tables']['contact_groups']['Row'];
export type ContactSubgroup = Database['public']['Tables']['contact_subgroups']['Row'];
export type Contact = Database['public']['Tables']['contacts']['Row'];
export type ContactPhone = Database['public']['Tables']['contact_phones']['Row'];
export type ContactEmail = Database['public']['Tables']['contact_emails']['Row'];
export type ContactAddress = Database['public']['Tables']['contact_addresses']['Row'];
export type ContactSocial = Database['public']['Tables']['contact_socials']['Row'];
export type ContactNote = Database['public']['Tables']['contact_notes']['Row'];
export type ContactEvent = Database['public']['Tables']['contact_events']['Row'];
export type ContactTag = Database['public']['Tables']['contact_tags']['Row'];
export type ContactCustomField = Database['public']['Tables']['contact_custom_fields']['Row'];
export type ContactFieldValue = Database['public']['Tables']['contact_field_values']['Row'];
export type ContactRelationship = Database['public']['Tables']['contact_relationships']['Row'];

export function useContactGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [subgroups, setSubgroups] = useState<ContactSubgroup[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [g, s] = await Promise.all([
      supabase.from('contact_groups').select('*').eq('user_id', user.id).order('position').order('created_at'),
      supabase.from('contact_subgroups').select('*').eq('user_id', user.id).order('position').order('created_at'),
    ]);
    setGroups((g.data as ContactGroup[]) || []);
    setSubgroups((s.data as ContactSubgroup[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const addGroup = async (input: { name: string; color?: string; icon?: string }) => {
    if (!user) return;
    await supabase.from('contact_groups').insert({
      user_id: user.id, name: input.name,
      color: input.color || 'indigo', icon: input.icon || 'Users',
      position: groups.length,
    });
    refresh();
  };
  const updateGroup = async (id: string, patch: Partial<ContactGroup>) => {
    await supabase.from('contact_groups').update(patch).eq('id', id);
    refresh();
  };
  const removeGroup = async (id: string) => {
    await supabase.from('contact_groups').delete().eq('id', id);
    refresh();
  };
  const addSubgroup = async (group_id: string, name: string) => {
    if (!user) return;
    const count = subgroups.filter(s => s.group_id === group_id).length;
    await supabase.from('contact_subgroups').insert({ user_id: user.id, group_id, name, position: count });
    refresh();
  };
  const updateSubgroup = async (id: string, patch: Partial<ContactSubgroup>) => {
    await supabase.from('contact_subgroups').update(patch).eq('id', id);
    refresh();
  };
  const removeSubgroup = async (id: string) => {
    await supabase.from('contact_subgroups').delete().eq('id', id);
    refresh();
  };

  return { groups, subgroups, loading, refresh, addGroup, updateGroup, removeGroup, addSubgroup, updateSubgroup, removeSubgroup };
}

export function useContacts() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('contacts').select('*').eq('user_id', user.id)
      .order('full_name');
    setContacts((data as Contact[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const h = () => refresh();
    window.addEventListener('ai-data-changed', h);
    return () => window.removeEventListener('ai-data-changed', h);
  }, [refresh]);

  const removeContact = async (id: string) => {
    await supabase.from('contacts').delete().eq('id', id);
    refresh();
  };
  const toggleFavorite = async (id: string, val: boolean) => {
    await supabase.from('contacts').update({ is_favorite: val }).eq('id', id);
    refresh();
  };
  const setStatus = async (id: string, status: Contact['status']) => {
    await supabase.from('contacts').update({ status }).eq('id', id);
    refresh();
  };
  const bulkUpdate = async (ids: string[], patch: Partial<Contact>) => {
    if (!ids.length) return;
    await supabase.from('contacts').update(patch).in('id', ids);
    refresh();
  };
  const bulkDelete = async (ids: string[]) => {
    if (!ids.length) return;
    await supabase.from('contacts').delete().in('id', ids);
    refresh();
  };
  const touchInteraction = async (id: string) => {
    await supabase.from('contacts').update({ last_interaction_at: new Date().toISOString() }).eq('id', id);
    refresh();
  };

  return { contacts, loading, refresh, removeContact, toggleFavorite, setStatus, bulkUpdate, bulkDelete, touchInteraction };
}

export function useContactDetail(contactId: string | null) {
  const { user } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [phones, setPhones] = useState<ContactPhone[]>([]);
  const [emails, setEmails] = useState<ContactEmail[]>([]);
  const [addresses, setAddresses] = useState<ContactAddress[]>([]);
  const [socials, setSocials] = useState<ContactSocial[]>([]);
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [events, setEvents] = useState<ContactEvent[]>([]);
  const [fieldValues, setFieldValues] = useState<ContactFieldValue[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [relations, setRelations] = useState<ContactRelationship[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!contactId || !user) {
      setContact(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [c, p, e, a, s, n, ev, fv, tl, rel] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', contactId).maybeSingle(),
      supabase.from('contact_phones').select('*').eq('contact_id', contactId).order('position'),
      supabase.from('contact_emails').select('*').eq('contact_id', contactId).order('position'),
      supabase.from('contact_addresses').select('*').eq('contact_id', contactId).order('position'),
      supabase.from('contact_socials').select('*').eq('contact_id', contactId).order('position'),
      supabase.from('contact_notes').select('*').eq('contact_id', contactId)
        .order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('contact_events').select('*').eq('contact_id', contactId)
        .order('occurred_at', { ascending: false }).limit(100),
      supabase.from('contact_field_values').select('*').eq('contact_id', contactId),
      supabase.from('contact_tag_links').select('tag_id').eq('contact_id', contactId),
      supabase.from('contact_relationships').select('*')
        .or(`from_contact_id.eq.${contactId},to_contact_id.eq.${contactId}`),
    ]);
    setContact((c.data as Contact) || null);
    setPhones((p.data as ContactPhone[]) || []);
    setEmails((e.data as ContactEmail[]) || []);
    setAddresses((a.data as ContactAddress[]) || []);
    setSocials((s.data as ContactSocial[]) || []);
    setNotes((n.data as ContactNote[]) || []);
    setEvents((ev.data as ContactEvent[]) || []);
    setFieldValues((fv.data as ContactFieldValue[]) || []);
    setTagIds(((tl.data as any[]) || []).map((x) => x.tag_id));
    setRelations((rel.data as ContactRelationship[]) || []);
    setLoading(false);
  }, [contactId, user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { contact, phones, emails, addresses, socials, notes, events, fieldValues, tagIds, relations, loading, refresh };
}

export function useContactTags() {
  const { user } = useAuth();
  const [tags, setTags] = useState<ContactTag[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('contact_tags').select('*').eq('user_id', user.id).order('name');
    setTags((data as ContactTag[]) || []);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addTag = async (name: string, color = 'slate') => {
    if (!user || !name.trim()) return null;
    const { data } = await supabase.from('contact_tags')
      .insert({ user_id: user.id, name: name.trim(), color })
      .select().maybeSingle();
    refresh();
    return data;
  };
  const removeTag = async (id: string) => {
    await supabase.from('contact_tags').delete().eq('id', id);
    refresh();
  };
  return { tags, refresh, addTag, removeTag };
}

export function useContactCustomFields(groupId: string | null) {
  const { user } = useAuth();
  const [fields, setFields] = useState<ContactCustomField[]>([]);

  const refresh = useCallback(async () => {
    if (!user || !groupId) { setFields([]); return; }
    const { data } = await supabase.from('contact_custom_fields')
      .select('*').eq('group_id', groupId).order('position');
    setFields((data as ContactCustomField[]) || []);
  }, [user, groupId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addField = async (label: string, type: ContactCustomField['type']) => {
    if (!user || !groupId) return;
    await supabase.from('contact_custom_fields').insert({
      user_id: user.id, group_id: groupId, label, type, position: fields.length,
    });
    refresh();
  };
  const removeField = async (id: string) => {
    await supabase.from('contact_custom_fields').delete().eq('id', id);
    refresh();
  };
  return { fields, refresh, addField, removeField };
}
