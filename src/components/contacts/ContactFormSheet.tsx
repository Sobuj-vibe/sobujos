import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Phone, Mail, MapPin, Link2, Star, Lock, Save, Camera, Loader2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  useContactGroups, useContactCustomFields,
  Contact, ContactPhone, ContactEmail, ContactAddress, ContactSocial,
  ContactFieldValue,
} from '@/hooks/useContacts';
import { TagPicker } from './TagPicker';
import { SocialIcon } from './SocialIcon';
import {
  PHONE_LABELS, EMAIL_LABELS, ADDRESS_LABELS, detectPlatform,
} from '@/data/contactDefaults';
import { toast } from 'sonner';
import { TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type PhoneRow = { id?: string; label: string; number: string; is_whatsapp: boolean; is_wechat: boolean };
type EmailRow = { id?: string; label: string; email: string };
type AddressRow = { id?: string; label: string; line1: string; city: string; country: string };
type SocialRow = { id?: string; platform: string; url: string };

export function ContactFormSheet({
  open, onOpenChange, contactId, defaultGroupId, defaultSubgroupId, onSaved,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  contactId?: string | null;
  defaultGroupId?: string | null;
  defaultSubgroupId?: string | null;
  onSaved?: (id: string) => void;
}) {
  const { user } = useAuth();
  const { groups, subgroups } = useContactGroups();

  const [fullName, setFullName] = useState('');
  const [nickname, setNickname] = useState('');
  const [groupId, setGroupId] = useState<string>('');
  const [subgroupId, setSubgroupId] = useState<string>('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [location, setLocation] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [website, setWebsite] = useState('');
  const [relationship, setRelationship] = useState('');
  const [howWeMet, setHowWeMet] = useState('');
  const [financeRole, setFinanceRole] = useState<Contact['finance_role']>('none');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [phones, setPhones] = useState<PhoneRow[]>([]);
  const [emails, setEmails] = useState<EmailRow[]>([]);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [socials, setSocials] = useState<SocialRow[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { fields: customFields } = useContactCustomFields(groupId || null);

  const filteredSubgroups = subgroups.filter((s) => s.group_id === groupId);

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setUploadingAvatar(true);
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${user.id}/contacts/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { toast.error(upErr.message); setUploadingAvatar(false); return; }
    const { data: signed } = await supabase.storage.from('avatars').createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
    setAvatarUrl(signed?.signedUrl ?? null);
    setUploadingAvatar(false);
    e.target.value = '';
  };
  const initialsPreview = (fullName || '?').split(/\s+/).slice(0, 2).map((s) => s[0]).join('').toUpperCase();

  useEffect(() => {
    if (!open) return;
    (async () => {
      if (contactId) {
        const [c, p, e, a, s, fv, tl] = await Promise.all([
          supabase.from('contacts').select('*').eq('id', contactId).maybeSingle(),
          supabase.from('contact_phones').select('*').eq('contact_id', contactId).order('position'),
          supabase.from('contact_emails').select('*').eq('contact_id', contactId).order('position'),
          supabase.from('contact_addresses').select('*').eq('contact_id', contactId).order('position'),
          supabase.from('contact_socials').select('*').eq('contact_id', contactId).order('position'),
          supabase.from('contact_field_values').select('*').eq('contact_id', contactId),
          supabase.from('contact_tag_links').select('tag_id').eq('contact_id', contactId),
        ]);
        const cd = c.data as Contact;
        if (cd) {
          setFullName(cd.full_name);
          setNickname(cd.nickname ?? '');
          setGroupId(cd.group_id ?? '');
          setSubgroupId(cd.subgroup_id ?? '');
          setGender(cd.gender ?? '');
          setDob(cd.dob ?? '');
          setBloodGroup(cd.blood_group ?? '');
          setLocation(cd.location ?? '');
          setCompany(cd.company ?? '');
          setJobTitle(cd.job_title ?? '');
          setWebsite(cd.website ?? '');
          setRelationship(cd.relationship ?? '');
          setHowWeMet(cd.how_we_met ?? '');
          setFinanceRole(cd.finance_role);
          setIsFavorite(cd.is_favorite);
          setIsPrivate(cd.is_private);
          setAvatarUrl(cd.avatar_url ?? null);
        }
        setPhones(((p.data as ContactPhone[]) || []).map((x) => ({
          id: x.id, label: x.label, number: x.number, is_whatsapp: x.is_whatsapp, is_wechat: x.is_wechat,
        })));
        setEmails(((e.data as ContactEmail[]) || []).map((x) => ({ id: x.id, label: x.label, email: x.email })));
        setAddresses(((a.data as ContactAddress[]) || []).map((x) => ({
          id: x.id, label: x.label, line1: x.line1 ?? '', city: x.city ?? '', country: x.country ?? '',
        })));
        setSocials(((s.data as ContactSocial[]) || []).map((x) => ({ id: x.id, platform: x.platform, url: x.url })));
        const fvMap: Record<string, string> = {};
        ((fv.data as ContactFieldValue[]) || []).forEach((x) => { fvMap[x.field_id] = x.value ?? ''; });
        setFieldValues(fvMap);
        setTagIds(((tl.data as any[]) || []).map((x) => x.tag_id));
      } else {
        setFullName(''); setNickname('');
        setGroupId(defaultGroupId ?? '');
        setSubgroupId(defaultSubgroupId ?? '');
        setGender(''); setDob(''); setBloodGroup(''); setLocation('');
        setCompany(''); setJobTitle(''); setWebsite('');
        setRelationship(''); setHowWeMet('');
        setFinanceRole('none'); setIsFavorite(false); setIsPrivate(false);
        setPhones([{ label: 'mobile', number: '', is_whatsapp: false, is_wechat: false }]);
        setEmails([]); setAddresses([]); setSocials([]); setTagIds([]); setFieldValues({});
        setAvatarUrl(null);
      }
    })();
  }, [open, contactId, defaultGroupId, defaultSubgroupId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !fullName.trim()) return;
    setSaving(true);

    const contactPatch: TablesUpdate<'contacts'> = {
      full_name: fullName.trim(),
      nickname: nickname.trim() || null,
      group_id: groupId || null,
      subgroup_id: subgroupId || null,
      gender: gender || null,
      dob: dob || null,
      blood_group: bloodGroup || null,
      location: location || null,
      company: company || null,
      job_title: jobTitle || null,
      website: website || null,
      relationship: relationship || null,
      how_we_met: howWeMet || null,
      finance_role: financeRole,
      is_favorite: isFavorite,
      is_private: isPrivate,
      avatar_url: avatarUrl,
    };

    let id = contactId;
    if (id) {
      await supabase.from('contacts').update(contactPatch).eq('id', id);
    } else {
      const insertRow: TablesInsert<'contacts'> = {
        user_id: user.id, full_name: fullName.trim(), ...contactPatch,
      };
      const { data } = await supabase.from('contacts').insert(insertRow).select('id').maybeSingle();
      id = (data as { id: string } | null)?.id ?? null;
    }
    if (!id) { setSaving(false); return; }

    // Sync child rows: simplest = wipe & insert
    await Promise.all([
      supabase.from('contact_phones').delete().eq('contact_id', id),
      supabase.from('contact_emails').delete().eq('contact_id', id),
      supabase.from('contact_addresses').delete().eq('contact_id', id),
      supabase.from('contact_socials').delete().eq('contact_id', id),
      supabase.from('contact_tag_links').delete().eq('contact_id', id),
      supabase.from('contact_field_values').delete().eq('contact_id', id),
    ]);

    const validPhones = phones.filter((p) => p.number.trim());
    if (validPhones.length) {
      await supabase.from('contact_phones').insert(validPhones.map((p, i) => ({
        user_id: user.id, contact_id: id!, label: p.label, number: p.number.trim(),
        is_whatsapp: p.is_whatsapp, is_wechat: p.is_wechat, position: i,
      })));
    }
    const validEmails = emails.filter((e) => e.email.trim());
    if (validEmails.length) {
      await supabase.from('contact_emails').insert(validEmails.map((e, i) => ({
        user_id: user.id, contact_id: id!, label: e.label, email: e.email.trim(), position: i,
      })));
    }
    const validAddrs = addresses.filter((a) => a.line1.trim() || a.city.trim() || a.country.trim());
    if (validAddrs.length) {
      await supabase.from('contact_addresses').insert(validAddrs.map((a, i) => ({
        user_id: user.id, contact_id: id!, label: a.label,
        line1: a.line1 || null, city: a.city || null, country: a.country || null, position: i,
      })));
    }
    const validSocials = socials.filter((s) => s.url.trim());
    if (validSocials.length) {
      await supabase.from('contact_socials').insert(validSocials.map((s, i) => ({
        user_id: user.id, contact_id: id!, platform: s.platform || detectPlatform(s.url).id,
        url: s.url.trim(), position: i,
      })));
    }
    if (tagIds.length) {
      await supabase.from('contact_tag_links').insert(tagIds.map((tag_id) => ({
        user_id: user.id, contact_id: id!, tag_id,
      })));
    }
    const fvRows = Object.entries(fieldValues)
      .filter(([_, v]) => v && v.trim())
      .map(([field_id, value]) => ({ user_id: user.id, contact_id: id!, field_id, value: value.trim() }));
    if (fvRows.length) {
      await supabase.from('contact_field_values').insert(fvRows);
    }

    setSaving(false);
    toast.success('Contact saved');
    window.dispatchEvent(new CustomEvent('ai-data-changed'));
    onSaved?.(id);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[92vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{contactId ? 'Edit contact' : 'New contact'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={submit} className="space-y-5 mt-4 pb-8">
          {/* Identity */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="fn">Full name *</Label>
              <Input id="fn" value={fullName} onChange={(e) => setFullName(e.target.value)} required autoFocus maxLength={120} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="nn">Nickname</Label>
                <Input id="nn" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={60} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gn">Gender</Label>
                <Input id="gn" value={gender} onChange={(e) => setGender(e.target.value)} maxLength={20} placeholder="male / female / …" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="dob">DOB</Label>
                <Input id="dob" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bg">Blood</Label>
                <Input id="bg" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} maxLength={5} placeholder="A+" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="loc">City</Label>
                <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} />
              </div>
            </div>
          </div>

          {/* Group */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label>Group</Label>
              <Select value={groupId || 'none'} onValueChange={(v) => { setGroupId(v === 'none' ? '' : v); setSubgroupId(''); }}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {groups.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sub-group</Label>
              <Select value={subgroupId || 'none'} onValueChange={(v) => setSubgroupId(v === 'none' ? '' : v)} disabled={!groupId || !filteredSubgroups.length}>
                <SelectTrigger><SelectValue placeholder={filteredSubgroups.length ? 'None' : '—'} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {filteredSubgroups.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Phones */}
          <RepeatSection
            icon={<Phone className="h-4 w-4" />} title="Phones"
            onAdd={() => setPhones([...phones, { label: 'mobile', number: '', is_whatsapp: false, is_wechat: false }])}>
            {phones.map((p, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-border p-3">
                <div className="flex gap-2">
                  <Select value={p.label} onValueChange={(v) => setPhones(phones.map((x, j) => j === i ? { ...x, label: v } : x))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{PHONE_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={p.number} onChange={(e) => setPhones(phones.map((x, j) => j === i ? { ...x, number: e.target.value } : x))} placeholder="+880…" inputMode="tel" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setPhones(phones.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="flex gap-4 text-xs">
                  <label className="flex items-center gap-1.5"><Switch checked={p.is_whatsapp} onCheckedChange={(v) => setPhones(phones.map((x, j) => j === i ? { ...x, is_whatsapp: v } : x))} /> WhatsApp</label>
                  <label className="flex items-center gap-1.5"><Switch checked={p.is_wechat} onCheckedChange={(v) => setPhones(phones.map((x, j) => j === i ? { ...x, is_wechat: v } : x))} /> WeChat</label>
                </div>
              </div>
            ))}
          </RepeatSection>

          {/* Emails */}
          <RepeatSection
            icon={<Mail className="h-4 w-4" />} title="Emails"
            onAdd={() => setEmails([...emails, { label: 'personal', email: '' }])}>
            {emails.map((e, i) => (
              <div key={i} className="flex gap-2">
                <Select value={e.label} onValueChange={(v) => setEmails(emails.map((x, j) => j === i ? { ...x, label: v } : x))}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{EMAIL_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="email" value={e.email} onChange={(ev) => setEmails(emails.map((x, j) => j === i ? { ...x, email: ev.target.value } : x))} placeholder="name@example.com" />
                <Button type="button" variant="ghost" size="icon" onClick={() => setEmails(emails.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </RepeatSection>

          {/* Socials */}
          <RepeatSection
            icon={<Link2 className="h-4 w-4" />} title="Social links"
            onAdd={() => setSocials([...socials, { platform: '', url: '' }])}>
            {socials.map((s, i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className="h-10 w-10 flex items-center justify-center rounded-md border border-border text-muted-foreground">
                  <SocialIcon platform={s.platform} url={s.url} />
                </div>
                <Input value={s.url} onChange={(ev) => {
                  const url = ev.target.value;
                  const detected = url ? detectPlatform(url).id : '';
                  setSocials(socials.map((x, j) => j === i ? { ...x, url, platform: detected } : x));
                }} placeholder="https://…" />
                <Button type="button" variant="ghost" size="icon" onClick={() => setSocials(socials.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </RepeatSection>

          {/* Addresses */}
          <RepeatSection
            icon={<MapPin className="h-4 w-4" />} title="Addresses"
            onAdd={() => setAddresses([...addresses, { label: 'home', line1: '', city: '', country: '' }])}>
            {addresses.map((a, i) => (
              <div key={i} className="space-y-2 rounded-xl border border-border p-3">
                <div className="flex gap-2">
                  <Select value={a.label} onValueChange={(v) => setAddresses(addresses.map((x, j) => j === i ? { ...x, label: v } : x))}>
                    <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                    <SelectContent>{ADDRESS_LABELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input value={a.line1} onChange={(ev) => setAddresses(addresses.map((x, j) => j === i ? { ...x, line1: ev.target.value } : x))} placeholder="Address line" />
                  <Button type="button" variant="ghost" size="icon" onClick={() => setAddresses(addresses.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Input value={a.city} onChange={(ev) => setAddresses(addresses.map((x, j) => j === i ? { ...x, city: ev.target.value } : x))} placeholder="City" />
                  <Input value={a.country} onChange={(ev) => setAddresses(addresses.map((x, j) => j === i ? { ...x, country: ev.target.value } : x))} placeholder="Country" />
                </div>
              </div>
            ))}
          </RepeatSection>

          {/* Work */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Work</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="comp">Company</Label>
                <Input id="comp" value={company} onChange={(e) => setCompany(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="job">Job title</Label>
                <Input id="job" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={100} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="web">Website</Label>
              <Input id="web" value={website} onChange={(e) => setWebsite(e.target.value)} type="url" placeholder="https://…" />
            </div>
          </div>

          {/* Relationship */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">How you know them</h4>
            <Input value={relationship} onChange={(e) => setRelationship(e.target.value)} placeholder="Relationship (e.g. school friend)" maxLength={100} />
            <Textarea value={howWeMet} onChange={(e) => setHowWeMet(e.target.value)} placeholder="How you met / context" maxLength={500} />
          </div>

          {/* Custom fields */}
          {customFields.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold">More info</h4>
              {customFields.map((f) => (
                <div key={f.id} className="space-y-1.5">
                  <Label>{f.label}</Label>
                  <Input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : f.type === 'url' ? 'url' : 'text'}
                    value={fieldValues[f.id] ?? ''}
                    onChange={(e) => setFieldValues({ ...fieldValues, [f.id]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <TagPicker value={tagIds} onChange={setTagIds} />
          </div>

          {/* Finance & flags */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Finance role</Label>
              <Select value={financeRole} onValueChange={(v) => setFinanceRole(v as Contact['finance_role'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="vendor">Vendor</SelectItem>
                  <SelectItem value="lender">Lender (lends to me)</SelectItem>
                  <SelectItem value="borrower">Borrower (owes me)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm"><Star className="h-4 w-4" /> Favorite</div>
              <Switch checked={isFavorite} onCheckedChange={setIsFavorite} />
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
              <div className="flex items-center gap-2 text-sm"><Lock className="h-4 w-4" /> Private</div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </div>

          <Button type="submit" className="w-full h-12" disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> Save contact
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function RepeatSection({ icon, title, children, onAdd }: { icon: React.ReactNode; title: string; children: React.ReactNode; onAdd: () => void }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-1.5">{icon} {title}</h4>
        <Button type="button" size="sm" variant="ghost" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
