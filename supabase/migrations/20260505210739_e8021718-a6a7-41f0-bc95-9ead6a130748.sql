
-- ============ ENUMS ============
CREATE TYPE public.contact_status AS ENUM ('active', 'archived', 'blocked');
CREATE TYPE public.contact_role AS ENUM ('none', 'client', 'vendor', 'lender', 'borrower');
CREATE TYPE public.contact_event_kind AS ENUM ('call', 'whatsapp', 'meet', 'email', 'sms', 'note', 'custom');
CREATE TYPE public.contact_field_type AS ENUM ('text', 'number', 'date', 'url', 'email', 'phone');

-- ============ GROUPS ============
CREATE TABLE public.contact_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'indigo',
  icon TEXT NOT NULL DEFAULT 'Users',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY cg_all ON public.contact_groups FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_groups_user ON public.contact_groups(user_id, position);

-- ============ SUBGROUPS ============
CREATE TABLE public.contact_subgroups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_subgroups ENABLE ROW LEVEL SECURITY;
CREATE POLICY csg_all ON public.contact_subgroups FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_subgroups_group ON public.contact_subgroups(group_id, position);

-- ============ CONTACTS ============
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID REFERENCES public.contact_groups(id) ON DELETE SET NULL,
  subgroup_id UUID REFERENCES public.contact_subgroups(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  nickname TEXT,
  avatar_url TEXT,
  gender TEXT,
  dob DATE,
  blood_group TEXT,
  location TEXT,
  company TEXT,
  job_title TEXT,
  website TEXT,
  relationship TEXT,
  how_we_met TEXT,
  met_through_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  finance_role contact_role NOT NULL DEFAULT 'none',
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  is_private BOOLEAN NOT NULL DEFAULT false,
  status contact_status NOT NULL DEFAULT 'active',
  last_interaction_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_all ON public.contacts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contacts_user_group ON public.contacts(user_id, group_id);
CREATE INDEX idx_contacts_user_name ON public.contacts(user_id, full_name);
CREATE INDEX idx_contacts_user_status ON public.contacts(user_id, status);
CREATE INDEX idx_contacts_user_fav ON public.contacts(user_id, is_favorite);

CREATE TRIGGER trg_contacts_updated BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ PHONES / EMAILS / ADDRESSES / SOCIALS ============
CREATE TABLE public.contact_phones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'mobile',
  number TEXT NOT NULL,
  is_whatsapp BOOLEAN NOT NULL DEFAULT false,
  is_wechat BOOLEAN NOT NULL DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_phones ENABLE ROW LEVEL SECURITY;
CREATE POLICY cp_all ON public.contact_phones FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_phones_contact ON public.contact_phones(contact_id);

CREATE TABLE public.contact_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'personal',
  email TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY ce_all ON public.contact_emails FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_emails_contact ON public.contact_emails(contact_id);

CREATE TABLE public.contact_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'home',
  line1 TEXT,
  city TEXT,
  country TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY ca_all ON public.contact_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_addresses_contact ON public.contact_addresses(contact_id);

CREATE TABLE public.contact_socials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_socials ENABLE ROW LEVEL SECURITY;
CREATE POLICY cs_all ON public.contact_socials FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_socials_contact ON public.contact_socials(contact_id);

-- ============ TAGS ============
CREATE TABLE public.contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'slate',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY ct_all ON public.contact_tags FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.contact_tag_links (
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.contact_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, tag_id)
);
ALTER TABLE public.contact_tag_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY ctl_all ON public.contact_tag_links FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ NOTES ============
CREATE TABLE public.contact_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY cn_all ON public.contact_notes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_notes_contact ON public.contact_notes(contact_id, is_pinned DESC, created_at DESC);
CREATE TRIGGER trg_contact_notes_updated BEFORE UPDATE ON public.contact_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ EVENTS / TIMELINE ============
CREATE TABLE public.contact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  kind contact_event_kind NOT NULL DEFAULT 'note',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY cev_all ON public.contact_events FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_events_contact ON public.contact_events(contact_id, occurred_at DESC);

-- ============ CUSTOM FIELDS PER GROUP ============
CREATE TABLE public.contact_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  group_id UUID NOT NULL REFERENCES public.contact_groups(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  type contact_field_type NOT NULL DEFAULT 'text',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contact_custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY ccf_all ON public.contact_custom_fields FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_custom_fields_group ON public.contact_custom_fields(group_id, position);

CREATE TABLE public.contact_field_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.contact_custom_fields(id) ON DELETE CASCADE,
  value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (contact_id, field_id)
);
ALTER TABLE public.contact_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY cfv_all ON public.contact_field_values FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_field_values_contact ON public.contact_field_values(contact_id);

-- ============ RELATIONSHIPS (Family/Colleague Graph) ============
CREATE TABLE public.contact_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  to_contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  relation TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_contact_id, to_contact_id, relation),
  CHECK (from_contact_id <> to_contact_id)
);
ALTER TABLE public.contact_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY cr_all ON public.contact_relationships FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_contact_rel_from ON public.contact_relationships(from_contact_id);
CREATE INDEX idx_contact_rel_to ON public.contact_relationships(to_contact_id);

-- ============ FOLLOW-UP LINK ON TASKS ============
ALTER TABLE public.tasks ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;
CREATE INDEX idx_tasks_contact ON public.tasks(contact_id) WHERE contact_id IS NOT NULL;
