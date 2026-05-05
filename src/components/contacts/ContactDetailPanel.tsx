import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useContactDetail, useContactGroups, useContacts } from '@/hooks/useContacts';
import { Phone, Mail, MapPin, Globe, Edit3, Star, Lock, MessageCircle, Copy, Trash2, Users as UsersIcon, UserPlus, X } from 'lucide-react';
import { SocialIcon } from './SocialIcon';
import { NotesList } from './NotesList';
import { EventsTimeline } from './EventsTimeline';
import { ContactFormSheet } from './ContactFormSheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

type Loan = Tables<'finance_loans'>;

export function ContactDetailPanel({ contactId, onCreate, onNavigate }: { contactId: string | null; onCreate?: () => void; onNavigate?: (id: string) => void }) {
  const { user } = useAuth();
  const { contact, phones, emails, addresses, socials, notes, events, fieldValues, tagIds, relations, refresh } = useContactDetail(contactId);
  const { groups, subgroups } = useContactGroups();
  const { contacts, toggleFavorite, removeContact, touchInteraction } = useContacts();
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState('info');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);
  const [customFields, setCustomFields] = useState<{ id: string; label: string; type: string }[]>([]);
  const [relTo, setRelTo] = useState('');
  const [relName, setRelName] = useState('');
  const [showRelForm, setShowRelForm] = useState(false);

  useEffect(() => {
    if (!contactId || !user) return;
    (async () => {
      const [l, tg, cf] = await Promise.all([
        contact?.full_name
          ? supabase.from('finance_loans').select('*').eq('user_id', user.id)
              .ilike('person_name', contact.full_name).order('loan_date', { ascending: false })
          : Promise.resolve({ data: [] as Loan[] }),
        tagIds.length
          ? supabase.from('contact_tags').select('id,name,color').in('id', tagIds)
          : Promise.resolve({ data: [] }),
        contact?.group_id
          ? supabase.from('contact_custom_fields').select('id,label,type').eq('group_id', contact.group_id).order('position')
          : Promise.resolve({ data: [] }),
      ]);
      setLoans((l.data as Loan[]) || []);
      setTags((tg.data as any) || []);
      setCustomFields((cf.data as any) || []);
    })();
  }, [contactId, user, contact?.full_name, contact?.group_id, tagIds.join(',')]);

  const groupName = contact?.group_id ? groups.find((g) => g.id === contact.group_id)?.name : null;
  const subgroupName = contact?.subgroup_id ? subgroups.find((s) => s.id === contact.subgroup_id)?.name : null;
  const initials = useMemo(() => contact?.full_name.split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase() ?? '?', [contact]);

  if (!contactId || !contact) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-10">
        <UsersIcon className="h-12 w-12 mb-4 opacity-30" />
        <p className="text-sm mb-3">Pick a contact to see details</p>
        {onCreate && (
          <Button variant="outline" onClick={onCreate}>
            <UserPlus className="h-4 w-4 mr-2" /> New contact
          </Button>
        )}
      </div>
    );
  }

  const fav = contact.is_favorite;
  const copy = (text: string) => { navigator.clipboard.writeText(text); toast.success('Copied'); };
  const del = async () => {
    if (!confirm(`Delete ${contact.full_name}? This removes all their data.`)) return;
    await removeContact(contact.id);
    toast.success('Deleted');
  };
  const linkRelation = async () => {
    if (!user || !relTo || !relName.trim()) return;
    await supabase.from('contact_relationships').insert({
      user_id: user.id, from_contact_id: contact.id, to_contact_id: relTo, relation: relName.trim(),
    });
    setRelTo(''); setRelName('');
    refresh();
    toast.success('Linked');
  };
  const unlinkRelation = async (id: string) => {
    await supabase.from('contact_relationships').delete().eq('id', id);
    refresh();
  };
  const otherContacts = contacts.filter((c) => c.id !== contact.id);
  const RELATION_PRESETS = ['father of', 'mother of', 'son of', 'daughter of', 'brother of', 'sister of', 'spouse of', 'friend of', 'business partner of', 'colleague of', 'client of', 'mentor of'];
  const genderDisplay = contact.gender ? contact.gender.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) : null;

  const inverseRelation = (rel: string, otherGender?: string | null): string => {
    const r = rel.toLowerCase().trim();
    const g = (otherGender || '').toLowerCase();
    const map: Record<string, string> = {
      'father of': g === 'male' ? 'son of' : g === 'female' ? 'daughter of' : 'child of',
      'mother of': g === 'male' ? 'son of' : g === 'female' ? 'daughter of' : 'child of',
      'son of': g === 'male' ? 'father of' : g === 'female' ? 'mother of' : 'parent of',
      'daughter of': g === 'male' ? 'father of' : g === 'female' ? 'mother of' : 'parent of',
      'brother of': g === 'male' ? 'brother of' : g === 'female' ? 'sister of' : 'sibling of',
      'sister of': g === 'male' ? 'brother of' : g === 'female' ? 'sister of' : 'sibling of',
      'spouse of': 'spouse of',
      'husband of': 'wife of',
      'wife of': 'husband of',
      'friend of': 'friend of',
      'business partner of': 'business partner of',
      'colleague of': 'colleague of',
      'mentor of': 'mentee of',
      'mentee of': 'mentor of',
      'client of': 'service provider of',
      'service provider of': 'client of',
    };
    return map[r] || r;
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        {contact.avatar_url ? (
          <img src={contact.avatar_url} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-gradient-to-br from-indigo-400 to-purple-400 text-white flex items-center justify-center font-semibold text-2xl">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold truncate">{contact.full_name}</h2>
            {contact.is_private && <Lock className="h-4 w-4 text-muted-foreground" />}
          </div>
          {contact.nickname && <p className="text-sm text-muted-foreground">"{contact.nickname}"</p>}
          {(contact.job_title || contact.company) && (
            <p className="text-sm text-muted-foreground">
              {[contact.job_title, contact.company].filter(Boolean).join(' · ')}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {groupName && <span className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary">{groupName}</span>}
            {subgroupName && <span className="text-xs px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{subgroupName}</span>}
            {tags.map((t) => <span key={t.id} className="text-xs px-2 py-0.5 rounded-md bg-muted">#{t.name}</span>)}
          </div>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => toggleFavorite(contact.id, !fav)}>
            <Star className={fav ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-4 w-4'} />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setEditOpen(true)}><Edit3 className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Quick actions */}
      {(phones[0] || emails[0]) && (
        <div className="grid grid-cols-3 gap-2">
          {phones[0] && (
            <Button asChild variant="secondary" className="h-10" onClick={() => touchInteraction(contact.id)}>
              <a href={`tel:${phones[0].number}`}><Phone className="h-4 w-4 mr-2" />Call</a>
            </Button>
          )}
          {phones.find((p) => p.is_whatsapp) && (
            <Button asChild variant="secondary" className="h-10" onClick={() => touchInteraction(contact.id)}>
              <a href={`https://wa.me/${(phones.find((p) => p.is_whatsapp)?.number || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />WhatsApp
              </a>
            </Button>
          )}
          {emails[0] && (
            <Button asChild variant="secondary" className="h-10" onClick={() => touchInteraction(contact.id)}>
              <a href={`mailto:${emails[0].email}`}><Mail className="h-4 w-4 mr-2" />Email</a>
            </Button>
          )}
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="linked">Linked</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-3 mt-4">
          {phones.length > 0 && (
            <Section title="Phones" icon={<Phone className="h-3.5 w-3.5" />}>
              {phones.map((p) => (
                <Row key={p.id} label={p.label}>
                  <a href={`tel:${p.number}`} className="text-primary truncate">{p.number}</a>
                  <div className="flex items-center gap-1 ml-auto">
                    {p.is_whatsapp && <span className="text-[10px] px-1 py-0.5 rounded bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300">WA</span>}
                    {p.is_wechat && <span className="text-[10px] px-1 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">WC</span>}
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copy(p.number)}><Copy className="h-3.5 w-3.5" /></Button>
                  </div>
                </Row>
              ))}
            </Section>
          )}
          {emails.length > 0 && (
            <Section title="Emails" icon={<Mail className="h-3.5 w-3.5" />}>
              {emails.map((e) => (
                <Row key={e.id} label={e.label}>
                  <a href={`mailto:${e.email}`} className="text-primary truncate">{e.email}</a>
                  <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto" onClick={() => copy(e.email)}><Copy className="h-3.5 w-3.5" /></Button>
                </Row>
              ))}
            </Section>
          )}
          {socials.length > 0 && (
            <Section title="Social" icon={<Globe className="h-3.5 w-3.5" />}>
              <div className="flex flex-wrap gap-2">
                {socials.map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted text-sm tap">
                    <SocialIcon platform={s.platform} url={s.url} />
                    <span className="capitalize">{s.platform || 'link'}</span>
                  </a>
                ))}
              </div>
            </Section>
          )}
          {addresses.length > 0 && (
            <Section title="Addresses" icon={<MapPin className="h-3.5 w-3.5" />}>
              {addresses.map((a) => (
                <div key={a.id} className="text-sm">
                  <p className="text-[11px] text-muted-foreground capitalize">{a.label}</p>
                  <p>{[a.line1, a.city, a.country].filter(Boolean).join(', ')}</p>
                </div>
              ))}
            </Section>
          )}
          {(contact.dob || contact.blood_group || contact.location || contact.gender) && (
            <Section title="Personal">
              {contact.dob && <Row label="Birthday">{new Date(contact.dob).toLocaleDateString()}</Row>}
              {genderDisplay && <Row label="Gender">{genderDisplay}</Row>}
              {contact.blood_group && <Row label="Blood">{contact.blood_group}</Row>}
              {contact.location && <Row label="City">{contact.location}</Row>}
            </Section>
          )}
          {contact.website && (
            <Section title="Website" icon={<Globe className="h-3.5 w-3.5" />}>
              <a href={contact.website} target="_blank" rel="noreferrer" className="text-primary text-sm break-all">{contact.website}</a>
            </Section>
          )}
          {(contact.relationship || contact.how_we_met) && (
            <Section title="Relationship">
              {contact.relationship && <Row label="Relation">{contact.relationship}</Row>}
              {contact.how_we_met && <p className="text-sm text-muted-foreground">{contact.how_we_met}</p>}
            </Section>
          )}
          {customFields.length > 0 && customFields.some((f) => fieldValues.find((v) => v.field_id === f.id)?.value) && (
            <Section title="More info">
              {customFields.map((f) => {
                const v = fieldValues.find((x) => x.field_id === f.id)?.value;
                if (!v) return null;
                return <Row key={f.id} label={f.label}>{v}</Row>;
              })}
            </Section>
          )}
          {contact.finance_role !== 'none' && loans.length > 0 && (
            <Section title={`Finance · ${contact.finance_role}`}>
              {loans.map((l) => (
                <div key={l.id} className="flex justify-between text-sm py-1">
                  <span className="text-muted-foreground">{l.direction === 'given' ? 'Given' : 'Taken'} · {new Date(l.loan_date).toLocaleDateString()}</span>
                  <span className="font-medium">{l.amount} {l.currency}</span>
                </div>
              ))}
            </Section>
          )}

          <Button variant="destructive" className="w-full mt-2" onClick={del}>
            <Trash2 className="h-4 w-4 mr-2" /> Delete contact
          </Button>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesList contactId={contact.id} notes={notes} onChanged={refresh} />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <EventsTimeline contactId={contact.id} events={events} onChanged={refresh} />
        </TabsContent>

        <TabsContent value="linked" className="mt-4 space-y-4">
          <Section title="Relationships" icon={<UsersIcon className="h-3.5 w-3.5" />}>
            {relations.length === 0 && (
              <p className="text-sm text-muted-foreground">No links yet. Add one below.</p>
            )}
            {relations.map((r) => {
              const otherId = r.from_contact_id === contact.id ? r.to_contact_id : r.from_contact_id;
              const other = contacts.find((c) => c.id === otherId);
              if (!other) return null;
              const verb = r.from_contact_id === contact.id ? r.relation : `↩ ${r.relation}`;
              return (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground capitalize">{verb}</span>
                  <span className="font-medium truncate flex-1">{other.full_name}</span>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => unlinkRelation(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              );
            })}

            <div className="pt-2 border-t border-border space-y-2">
              <p className="text-xs text-muted-foreground">Add new link — "{contact.full_name} is …"</p>
              <div className="flex flex-wrap gap-1.5">
                {RELATION_PRESETS.map((p) => (
                  <button key={p} type="button" onClick={() => setRelName(p)}
                    className={`text-xs px-2 py-1 rounded-md border tap ${relName === p ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-muted/40'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={relName} onChange={(e) => setRelName(e.target.value)} placeholder="relation (e.g. father of)" maxLength={40} className="flex-1" />
                <Select value={relTo} onValueChange={setRelTo}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Pick contact" /></SelectTrigger>
                  <SelectContent>
                    {otherContacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="icon" onClick={linkRelation} disabled={!relTo || !relName.trim()}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
          </Section>
        </TabsContent>
      </Tabs>

      <ContactFormSheet open={editOpen} onOpenChange={setEditOpen} contactId={contact.id} onSaved={() => refresh()} />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
      <h4 className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">{icon}{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground capitalize w-20 shrink-0">{label}</span>
      <div className="flex-1 min-w-0 flex items-center gap-1.5">{children}</div>
    </div>
  );
}