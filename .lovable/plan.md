# Desktop Layout (Sidebar + Topbar)

The current mobile UI stays exactly as-is on phones. On screens ≥ `md` (768px) we switch to a roomy desktop shell with a collapsible sidebar, a topbar, and a wider main content area. Same routes, same data, same components — only the shell changes.

## Breakpoint rule

- `< md` (mobile): existing `AppShell` with `BottomTabs` + `FloatingAI` + `max-w-md` content. Untouched.
- `≥ md` (tablet/desktop): new `DesktopShell` with sidebar + topbar, no bottom tabs, wider canvas.

`AppShell` becomes a thin switcher that renders `MobileShell` or `DesktopShell` based on `useIsMobile()`.

## Desktop shell anatomy

```text
┌─────────────────────────────────────────────────────────────┐
│ Sidebar (w-60, collapsible to w-14)  │  Topbar (h-14)        │
│  ▸ Logo "Life OS"                    │   Page title          │
│  ▸ Tasks         (active)            │   ───────────────     │
│  ▸ Prayer                            │   [search] [lang]     │
│  ▸ Finance                           │   [theme]  [avatar]   │
│  ▸ Profile                           │ ────────────────────  │
│                                      │                       │
│  ── Settings ──                      │   Main content        │
│  ▸ Theme                             │   (max-w-5xl,         │
│  ▸ Language                          │    px-8, py-6)        │
│  ▸ Sign out                          │                       │
└─────────────────────────────────────────────────────────────┘
```

- **Sidebar** (`shadcn/ui` `Sidebar`, `collapsible="icon"`): brand at top, primary nav (Tasks, Prayer, Finance, Profile), divider, secondary actions (Theme toggle, Language switch, Sign out). Active route highlighted via `NavLink`. Collapses to icon-only rail.
- **Topbar**: `SidebarTrigger` (left), dynamic page title from a small context, right cluster with search placeholder, language switch, theme toggle, avatar menu (Profile / Sign out).
- **FloatingAI** stays on desktop too, anchored bottom-right (no bottom tabs to dodge).
- **Main**: centered `max-w-5xl mx-auto px-8 py-6` so content breathes instead of being trapped at `max-w-md`.

## Page adjustments (responsive, not duplicated)

Pages keep one implementation; we just relax the mobile-only constraints with `md:` classes.

- **Tasks page**:
  - Today section: full width on desktop, single column rounded card.
  - Groups grid: `grid-cols-2` on mobile → `md:grid-cols-3 lg:grid-cols-4` on desktop.
  - "New group" FAB: hidden on desktop (`md:hidden`); replaced by a "+ New group" button in the page header row.
- **GroupDetail**: wider list, two-column layout on `lg` (task list left, selected-task detail panel right — optional, fallback to current sheet).
- **Profile**: form max-width `max-w-xl`, two-column for theme/language pickers on desktop.
- **AppBar (mobile)**: only renders on mobile. On desktop the topbar shows the title via a `usePageTitle` hook the pages call (or we read from route metadata).

## Files

New:
- `src/components/app/DesktopShell.tsx` — sidebar + topbar + `<Outlet />`.
- `src/components/app/AppSidebar.tsx` — shadcn Sidebar with nav items, collapsible icon mode, active highlighting.
- `src/components/app/DesktopTopbar.tsx` — `SidebarTrigger`, title, language switch, theme toggle, avatar menu.
- `src/contexts/PageTitleContext.tsx` (small) — pages set title; mobile `AppBar` and desktop topbar both consume.

Edited:
- `src/components/app/AppShell.tsx` — branch on `useIsMobile()` to render `MobileShell` (existing markup) or `DesktopShell`.
- `src/components/app/AppBar.tsx` — render `null` on desktop (or just leave it; AppShell controls which shell shows it).
- `src/components/app/FloatingAI.tsx` — adjust position for desktop (no bottom tab offset).
- `src/pages/app/Tasks.tsx`, `GroupDetail.tsx`, `Profile.tsx` — add `md:` responsive classes; hide FABs on desktop and add inline action buttons; call `usePageTitle`.
- `src/index.css` — minor: ensure no fixed `max-w-md` leaks; desktop content uses theme tokens already defined.

Untouched:
- All hooks, data layer, auth, i18n, theme tokens, mobile look & feel.

## Behavior details

- Sidebar default: expanded on `lg+`, collapsed-to-icon on `md` (768–1023). User toggle persists via the existing shadcn cookie.
- Theme + language switchers exist in both the sidebar footer and the topbar avatar menu for discoverability.
- Floating AI button: bottom-right `right-6 bottom-6` on desktop; current position on mobile.
- No route changes — same URLs work on both layouts.

## Out of scope

- No new modules (Prayer/Finance still placeholders).
- No keyboard-shortcut palette yet (can come later).
- No multi-pane "master/detail" rework beyond the optional GroupDetail right panel.

After approval I'll implement this and you can resize the browser to see both layouts swap at 768px.