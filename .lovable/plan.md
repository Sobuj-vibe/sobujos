# Personal Life OS — Plan

We'll build incrementally. This plan covers **Phase 1: Foundation** and **Phase 2: Tasks Module** (the first feature module). Future modules (Prayer, Financial, AI Assistant) will be built one at a time after each is approved.

---

## Phase 1 — Foundation

### Auth

- Email + password sign-up and login (Lovable Cloud)
- Forgot password flow (email link → `/reset-password` page to set new password)
- Protected app routes; unauthenticated users land on a clean welcome/login screen
- A `profiles` table for display name, avatar, language preference, theme preference

### Theming (Day / Night / Dim)

- **Soft Indigo / Lavender** palette across all three modes
- Light: soft lavender-tinted whites, indigo primary
- Dim: muted slate-indigo (easier on eyes than full dark)
- Dark: deep indigo-night
- Theme toggle in Settings; persists per user
- There should be an option to change the color in the settings
- All colors via HSL design tokens in `index.css`

### Localization (Bangla + English)

- **Default: Bangla (বাংলা)**
- Language switcher in Settings
- All UI strings via a translation layer (i18next)
- Bangla-friendly typography (Noto Sans Bengali for Bangla, Inter for English)

### Mobile-native shell

- Bottom tab bar (Tasks, Prayer, Finance, Profile) — feels like a native app
- Top app bar with screen title + contextual actions
- Floating Action Button (FAB) for the primary "add" action on each screen
- Safe-area padding, large tap targets, swipe gestures, smooth transitions
- Pull-to-refresh on lists
- Floating AI Assistant button (bottom-right, above tab bar) — placeholder for now, wired up in a later phase

### PWA / Installable

- Web app manifest with icons, `display: standalone`, indigo theme color
- Splash screen + app icon
- Installable from browser ("Add to Home Screen")
- An `/install` helper page with instructions for iOS and Android
- Note: full offline service worker is **not** added in v1 (it conflicts with the Lovable preview). The app will be fully installable and feel native; offline caching can be added later when ready to ship.

### Profile & Settings page

- Display name, avatar, the user can upload photo
- Theme picker (Day / Dim / Night)
- An option to change the color
- Language picker (বাংলা / English)
- user location picker
- A button to install the PWA app
- Sign out
- About the app and version number (Each update on lovable will change the version number)
- Placeholder sections for future module preferences

---

## Phase 2 — Tasks Module

Hierarchy: **Task Group → Task → Subtask**

### Screens

1. **Groups list** (Tasks tab home)
  - Cards/list of all task groups with color, icon, progress (e.g. "4/10 done today")
  - FAB → create new group
2. **Group detail**
  - Tasks in that group, grouped by status (Today / Upcoming / Completed)
  - FAB → create new task
3. **Task detail / edit sheet**
  - Title, notes, due date, priority (low/med/high), subtasks checklist, completion
  - Inline add for subtasks

### Behavior

- Check off subtasks → task progress updates automatically
- Check off task → moves to Completed
- Long-press / swipe to edit or delete
- Search across groups and tasks
- Today view at top of Tasks tab: everything due today across all groups

### Data

- `task_groups` (id, user_id, name, color, icon, created_at)
- `tasks` (id, group_id, user_id, title, notes, due_date, priority, completed_at)
- `subtasks` (id, task_id, title, completed_at, position)
- RLS so each user only sees their own data

---

## What comes after (not built yet)

- **Phase 3:** Prayer Tracker (Namaz + Kaza)
- **Phase 4:** Financial (Income, Expense, Loan, Recurring/Subscriptions)
- **Phase 5:** AI Assistant — chat that can read your data and take actions (create tasks, log expenses, mark prayers) via Lovable AI
- **Phase 6+:** Future modules

---

## Technical notes

- Lovable Cloud for auth, database, storage
- React Router with protected routes
- Tailwind + shadcn/ui, all colors as HSL semantic tokens
- i18next for Bangla/English
- Manifest-only PWA (no service worker in v1)
- Roles stored in a separate `user_roles` table (ready for future admin features)

After you approve, I'll implement Phase 1 + Phase 2 and we'll verify everything works before moving to the Prayer Tracker.