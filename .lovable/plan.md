# Personal CRM Module — Plan

A new top-level module `/app/contacts` that lets you store people as rich profiles, organize them into Contact Groups → Sub‑groups (e.g. **University → Batch 2018**, **RBIT Clients → Active**, **Service Sellers → Hosting**), and keep multiple notes, social links, and timeline events per person.

---

## 1. Core Module (the must‑have you described)

### Contact Groups & Sub‑groups

- Create / rename / recolor / reorder groups (e.g. *University, RBIT Clients, Service Sellers, Family, Friends, Others*).
- Each group can have multiple sub‑groups (e.g. *Service Sellers → Hosting, Domain, Design*).
- Default groups seeded on first visit (you can edit/delete).
- A contact lives in **one sub‑group** (or directly under a group if no sub‑group), and can additionally be assigned **labels/tags** for cross‑cutting (VIP, Lead, Paid, Friend…).

### Contact Profile (the person record)

Fields, all optional except name:

- **Identity**: full name, nickname, avatar (upload to existing `avatars` bucket), gender, date of birth, blood group, location.
- **Reach**: multiple phone numbers (with label: mobile/work/home + WhatsApp, wechat toggle), multiple emails, multiple addresses (label + city + country).
- **Online**: company, job title, website, and a **dynamic list of social links** (Facebook, Instagram, X, LinkedIn, GitHub, YouTube, Telegram, Discord, custom — auto‑detect platform from URL & show icon).
- **Relations**: relationship to you (free text), how you met, introduced by (link to another contact).
- **Group**: contact group + sub‑group + tags.
- **Notes**: a rich list of timestamped notes (`contact_notes` table) — add, edit, delete each independently. Pin important ones to top.
- **Files/IDs** (optional): national ID, passport no, etc. (free‑form custom fields — see suggestion #3 below).
  &nbsp;

### Contacts page UX

- Sub‑tabs: **All / Groups / Recent / Favorites**.
- Search bar (name, phone, email, company, note text, website, location).
- Filter by group, sub‑group, tag.
- Grid of group cards on the **Groups** tab → tap a group → see its sub‑groups → see contacts.
- List view with avatar, name, group chip, last interaction date.
- Tap a contact → **detail sheet** with tabs: *Info · Notes · Activity · Files*.
- Quick actions: call, WhatsApp, email, copy phone, open social link.

### AI assistant tools (extends existing `ai-assistant` edge function)

`list_contacts`, `add_contact`, `update_contact`, `archive_contact`, `add_contact_note`, `find_contact`, `list_groups`, `add_group`, `add_subgroup`, `set_contact_tags`. Examples: *"Add Karim from RBIT, phone +880…, hosting client"*, *"Show all RBIT clients"*, *"Add note to Karim: paid for 2026 hosting"*.

---

## 2. Suggested Extra Features — pick what you want

Mark each as **Yes / Maybe / No** and I'll lock the final scope.

**(Maybe) Interaction timeline** — auto-log when you opened the profile, called, or messaged. Manual "Logged a meeting" entries with date + summary. Helps you remember *"when did I last talk to X"*.

1. **(Yes add this)  Custom fields per group** — e.g. *University* group can have "Student ID, Department, Session"; *RBIT Clients* can have "Service, Renewal date, Amount". Defined once per group, applies to all contacts in it.
2. **(Yes add this) Follow‑up reminders** — set "Remind me to follow up with Karim on May 20" → creates a task in the existing Tasks module linked back to the contact.
3. **(Yes add this) Link to Finance** — mark a contact as a *client/vendor/lender*. Their `finance_loans` and recurring payments auto‑show on the profile. *"Karim owes you 5,000 BDT"* visible at a glance.
4. **(Maybe but not now save for future) Link to Habits/Goals** — assign a contact as accountability partner for a goal or habit (shows their avatar on the goal card).
5. **(Yes good features idea)  Family tree / relationships** — link contacts to each other ("father of", "wife of", "colleague at"). Shown as a small graph on profile.
6. **(Maybe) Communication log shortcuts** — tap "Called" / "WhatsApped" / "Met" buttons → logs to timeline in one tap.
7. **(Yes) Bulk actions** — multi‑select contacts to move group, add tag, or export.
8. **Shared with assistant context** — when chatting with AI, *"What do I know about Karim?"* returns full profile + recent notes + linked finance/tasks.

My recommendation if you want a strong v1 without bloat: **Yes** to 1, 2, 3, 4, 5, 9, 13, 15. **Maybe** 7, 8, 12. **Skip for now** 6, 10, 11, 14.

---

## 3. Database (new tables, all RLS by `user_id`)

```text
contact_groups       (id, user_id, name, color, icon, position, created_at)
contact_subgroups    (id, user_id, group_id, name, position, created_at)
contacts             (id, user_id, group_id, subgroup_id,
                      full_name, nickname, avatar_url, gender, dob,
                      company, job_title, website, relationship,
                      met_through_id (→ contacts.id), notes_summary,
                      is_favorite, is_private, status, created_at, updated_at)
contact_phones       (id, contact_id, user_id, label, number, is_whatsapp, position)
contact_emails       (id, contact_id, user_id, label, email, position)
contact_addresses    (id, contact_id, user_id, label, line1, city, country, position)
contact_socials      (id, contact_id, user_id, platform, url, position)
contact_tags         (id, user_id, name, color)            ← reusable tag library
contact_tag_links    (contact_id, tag_id, user_id)         ← M:N
contact_notes        (id, contact_id, user_id, body, is_pinned, created_at, updated_at)
contact_events       (id, contact_id, user_id, kind (call/meet/whatsapp/email/custom),
                      occurred_at, summary)                 ← interaction timeline
contact_custom_fields(id, group_id, user_id, label, type, position)   ← if you pick #3
contact_field_values (id, contact_id, field_id, user_id, value)
```

Indexes on `(user_id, group_id)`, `(user_id, full_name)` (trigram for search), `(contact_id)` on every child table.

Foreign‑key cascade deletes on contact removal. `met_through_id` set NULL on delete.

---

## 4. Frontend structure

```text
src/pages/app/Contacts.tsx                   ← new page, tabs: All / Groups / Recent / Favorites
src/components/contacts/
  ContactsTabs.tsx
  GroupsView.tsx          (group cards → subgroup list)
  ContactsList.tsx        (search + filter + virtualized list)
  ContactCard.tsx         (avatar, name, chips, quick actions)
  ContactDetailSheet.tsx  (tabs: Info / Notes / Activity / Linked)
  ContactFormSheet.tsx    (full editor with repeatable phone/email/social rows)
  GroupFormSheet.tsx
  SubgroupFormSheet.tsx
  TagPicker.tsx
  SocialIcon.tsx          (auto-detect platform from URL)
  NotesList.tsx           (per-contact pinnable notes)
  EventsTimeline.tsx      (interaction log)
src/hooks/useContacts.ts
src/hooks/useContactGroups.ts
src/data/contactDefaults.ts (seed groups + common social platforms)
```

Routing: add `/app/contacts` to `App.tsx`. Sidebar + bottom-tabs gain a **Contacts** entry (icon `Users`). Bottom tabs become 6 entries — I'll switch to a "More" overflow if it gets cramped on mobile.

i18n: `contacts.*` keys added to `en.ts` and `bn.ts`.

All date columns use the existing `useTimezone()` + `todayInTz()` so birthdays/reminders match your local day.

---

## 5. Out of scope (won't build unless you ask)

- Two‑way sync with Google/Apple Contacts.
- Email/SMS sending from the app.
- Multi‑user shared CRM / team accounts.
- Encryption at rest beyond what the database already provides.

---

## What I need from you before I build

1. Mark **Yes / Maybe / No** on suggestions **1–15** in section 2 (or just say *"go with your recommendation"*).
2. Confirm bottom-tab plan: keep 5 tabs and put Contacts under a **More** menu.
3. Confirm seed groups: *University, RBIT Clients, Service Sellers, Family, Friends, Others* — add/remove any?