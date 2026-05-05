# Prayer Tab — Build Plan

A full Prayer module replacing the current placeholder at `/app/prayer`, with bilingual (Bangla/English) labels driven by the existing `react-i18next` setup.

## Sections (in order, top → bottom)

```text
┌─────────────────────────────────────────┐
│ 1. Hadith of the Day (AI, daily)        │
├─────────────────────────────────────────┤
│ 2. Today's 5 Prayer Tracker             │
│    Fajr · Dhuhr · Asr · Maghrib · Isha  │
│    [✓ on time] [△ late] [✗ Qaza]      │
├─────────────────────────────────────────┤
│ 3. 30-Day Report (per prayer bars + %)  │
├─────────────────────────────────────────┤
│ 4. Kaza Tracker                         │
│    Heatmap (90 days) + counters + list  │
│    Tap missed entry → mark as made up   │
├─────────────────────────────────────────┤
│ 5. Quran Reading Log                    │
│    Add: Surah, Ayat from–to, note       │
│    Card list with date + streak         │
├─────────────────────────────────────────┤
│ 6. Bonus: Tasbih counter + Streak card  │
└─────────────────────────────────────────┘
```

Sub-tabs (pill switcher) at the top: **Today · Kaza · Quran · Reports** so the page stays scannable on mobile, with the Hadith card always pinned above.

## Database (new tables, all RLS by `user_id`)

- **prayer_logs** — `id, user_id, date (date), prayer (enum: fajr|dhuhr|asr|maghrib|isha), status (enum: on_time|late|qaza), made_up_at (timestamptz null), created_at`. Unique `(user_id, date, prayer)`.
- **quran_logs** — `id, user_id, date, surah_number (int), surah_name (text), ayat_from (int), ayat_to (int null), note (text null), created_at`.
- **hadith_daily** — `id, date (date unique per user), user_id, lang, text_bn, text_en, reference, created_at` — cached so we only call AI once/day/user.
- **tasbih_counters** (bonus) — `id, user_id, name, count, target, updated_at`.

All inserts/updates go through the existing migration + insert tools.

## Edge functions

- `**prayer-hadith**` — returns today's hadith for the user. Checks `hadith_daily` cache; if missing, calls Lovable AI (`google/gemini-3-flash-preview`) with structured tool-calling to get `{text_bn, text_en, reference}`, stores it, returns it. Validates JWT in code.
- Extend existing `**ai-assistant**` with new tools: `log_prayer`, `mark_kaza_made_up`, `add_quran_log`, `get_prayer_summary` so the floating AI can interact with prayer data via chat.

## Frontend

- Replace `Placeholder` route with new `src/pages/app/Prayer.tsx`. Update `App.tsx` route.
- New components in `src/components/prayer/`:
  - `HadithCard.tsx` — fetches from `prayer-hadith`, shows BN + EN with reference, refresh button.
  - `DailyPrayerTracker.tsx` — 5 prayers, three-state buttons, optimistic upsert into `prayer_logs`.
  - `PrayerReport.tsx` — 30-day per-prayer completion %, simple bar rows (no chart lib needed).
  - `KazaHeatmap.tsx` — 90-day grid (7×13), color intensity by missed count; tap a cell → list of missed prayers that day with "Mark as made up" buttons.
  - `KazaList.tsx` — outstanding kaza count per prayer (Fajr: 12 etc.) with quick-decrement.
  - `QuranLogForm.tsx` + `QuranLogList.tsx` — add form (Surah autocomplete from a static `surahs.ts` list of 114), card list with date, surah, ayat range, note.
  - `TasbihCard.tsx` (bonus) — counter with target, vibration on tap.
- Hook: `src/hooks/usePrayer.ts` — fetch + mutate prayer_logs, quran_logs; emits `ai-data-changed` event so the AI assistant sees fresh data.

## i18n

Add `prayer.*` keys in both `src/i18n/en.ts` and `src/i18n/bn.ts`: prayer names (Fajr/ফজর, Dhuhr/যোহর, Asr/আসর, Maghrib/মাগরিব, Isha/এশা), statuses, section titles, button labels, empty states. Surah list ships with both BN and EN names; the active language picks one.

## Bonus features added

1. **Tasbih (digital) counter** with custom dhikr names + targets.
2. **Streak card** — consecutive days with all 5 prayers logged on time.
3. **Daily summary toast** at end of day if any prayer left unlogged.
4. **Export 30-day report** as a text summary the user can copy/share.

## Out of scope (call out for later)

- Live prayer times by location (would need a prayer-times API). I'll leave space in the UI for it but won't fetch real times in this pass — statuses are user-marked.
- Push reminders (requires service worker + notifications permission flow).

## Acceptance

- `/app/prayer` shows Hadith → Today tracker → Reports → Kaza → Quran sections.
- Switching language toggles every label and the hadith text.
- Marking a prayer persists and updates the 30-day report and kaza counts immediately.
- Floating AI can answer "how many fajr did I miss this week?" and "log my dhuhr as on time" using new tools.