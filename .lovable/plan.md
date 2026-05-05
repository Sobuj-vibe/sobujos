# Habits & Goals Module — Final Build Plan

A focused life-management module that pairs **daily habits** (quick check-ins with streaks + heatmap) with **goals** (long-horizon outcomes broken into milestones). Built to match the existing Tasks/Prayer/Finance patterns: bilingual, sub-tab switcher, AI integrated, mobile-first.

## Page layout

Route: `/app/habits` — new sidebar entry "Habits" (icon: `Target`).

Sub-tab pill switcher (mirrors Prayer/Finance):

```text
[ Today | Habits | Goals | Stats ]
```

### Today (default)

- Greeting + date + overall day completion ring (e.g. "5 / 8 done · 62%")
- **Time-of-day groups**: Morning · Afternoon · Evening · Anytime
- Each habit row: icon, name, streak flame badge, check button (boolean) **or** counter buttons +1 / -1 / target (quantifiable), long-press to log custom value/note
- Skip button per habit (counts as "vacation day" — preserves streak, doesn't break it)
- Bottom: "Top goal of the week" mini card (next milestone + progress bar)

### Habits

- List of all habits, grouped by status (Active / Paused / Archived)
- Card shows: icon, name, current streak, best streak, last 7-day mini-dots, weekly target (e.g. "5 / 7 days"), edit menu
- "+ New habit" sheet:
  - Name, icon, color
  - **Type**: Boolean (done/not done) | Counter (e.g. 30 push-ups) | Duration (e.g. 20 min meditation)
  - **Target unit** (only for counter/duration): reps, pages, minutes, glasses, km, etc. (free text + presets)
  - **Daily target value** (e.g. 8 glasses, 30 min)
  - **Schedule**: Every day | Specific weekdays | X times per week
  - **Time of day**: Morning / Afternoon / Evening / Anytime
  - **Reminder time** (optional, stored — used later if push enabled)
  - **Linked goal** (optional dropdown)
  - **Why** (motivation text shown on card flip)

### Goals

- List of goals as cards. Each card shows: title, deadline countdown, progress %, milestone count (e.g. 3/5), linked-habit chips.
- "+ New goal" sheet:
  - Title, description, category (Health, Career, Learning, Finance, Spiritual, Personal, Other)
  - **Type**: Outcome (e.g. "Lose 5kg") | Process (e.g. "Read 12 books this year") | Project (one-shot)
  - **Target value + unit** (optional, for measurable goals)
  - **Start date + deadline**
  - **Milestones** (sub-checkpoints with their own dates) — repeatable rows (AI will break down the goal into multiple milestones, and you can also add manually, and if needed, you can edit the existing milestones)
  - **Linked habits** (multi-select existing habits that contribute)
  - **Weekly review reminder** (toggle)
- Goal detail view: progress chart, milestone checklist, linked habits with their streaks, notes log (timestamped quick notes added from the goal page).

### Stats

- **Yearly heatmap** per habit (GitHub-style 365-day grid, color intensity = completion). Reuses Kaza heatmap pattern from Prayer.
- **Streak leaderboard** — your habits sorted by current streak
- **Weekly consistency** — bar chart, last 12 weeks, % of habits done per week
- **Best day of week** — which weekday you're most consistent
- **Goal progress** — overall % across all active goals

## Cross-module integrations

1. **Prayer ↔ Habits**: 5 daily prayers automatically appear as a "synced" habit set in Today view (read-only, ticking them in either place updates both via the prayer logs).
2. **Tasks ↔ Goals**: From a goal's detail page, "Create task" pre-fills the task with the goal name as a tag in notes; tasks can optionally be linked to a milestone (stored in `tasks.notes` reference for now to avoid schema bloat).
3. **Finance ↔ Goals**: A goal can have a **savings target** (e.g. "Save 50,000 BDT for laptop") — progress auto-fills from a chosen finance category's net contribution this month/year.

## AI features

Extend `ai-assistant` with new tools:

- `list_habits`, `add_habit`, `update_habit`, `archive_habit`
- `log_habit` (today by default; supports value for counter/duration)
- `skip_habit_today`
- `list_goals`, `add_goal`, `update_goal_progress`, `add_milestone`, `complete_milestone`
- `get_habit_stats` (streak, last 30-day completion, consistency %)
- `get_today_habits` (what's left for today)
- `suggest_habits_for_goal` (AI proposes 2–4 supporting habits given a goal title — user approves to create)
- `weekly_review` (AI generates a short reflection: streaks held/broken, goal progress, suggestions for next week)

Natural-language examples that should work:

- "Add a habit: meditate 10 min every morning"
- "I drank 6 glasses of water today" → updates the counter habit
- "How am I doing on my reading goal?"
- "Give me my weekly review"

## Bonus features included

- **Habit templates** — quick-start library: Drink water, Exercise, Read, Sleep early, No social media after 10 pm, Walk 8k steps, Journal, Stretch, Thesis & Research Work, etc. One-tap to add.
- **Streak freeze** — 2 free freezes per month auto-applied if you miss a day (configurable, off by default to keep it strict).
- **Why card** — long-press a habit shows your "why" — keeps motivation visible.
- **Yearly heatmap export** — share-as-image button (uses canvas) on Stats tab.
- **Smart "today is light" badge** — if scheduled habits for today < 4, show a "good day to add one more" nudge.

## Out of scope (saved for later)

- Push notifications (web push) — fields stored, delivery later
- Mood/journaling — separate module
- Bad-habit/quit counter — can be added later as a habit type
- Social sharing / friends

---

## Technical details

### Database (new tables, RLS by `user_id`)

```text
habits
  id uuid pk, user_id uuid, name text, icon text, color text,
  type text ('boolean'|'counter'|'duration'),
  target_unit text null, target_value numeric null,
  schedule_kind text ('daily'|'weekdays'|'weekly_count'),
  schedule_days int[] null,         -- e.g. [1,2,3,4,5] for weekdays
  weekly_count int null,            -- if schedule_kind='weekly_count'
  time_of_day text ('morning'|'afternoon'|'evening'|'anytime'),
  reminder_time time null,
  goal_id uuid null,                -- soft FK to goals.id
  why text null,
  status text ('active'|'paused'|'archived') default 'active',
  position int default 0,
  freezes_per_month int default 0,
  created_at timestamptz default now()

habit_logs
  id uuid pk, user_id uuid, habit_id uuid,
  date date,                        -- the day this log applies to
  value numeric default 1,          -- 1 for boolean done; counter value otherwise
  status text ('done'|'partial'|'skipped'|'frozen') default 'done',
  note text null,
  logged_at timestamptz default now()
  unique (user_id, habit_id, date)  -- one row per habit per day (upsert)

goals
  id uuid pk, user_id uuid,
  title text, description text null,
  category text, type text ('outcome'|'process'|'project'),
  target_value numeric null, target_unit text null,
  current_value numeric default 0,
  start_date date default current_date,
  deadline date null,
  status text ('active'|'completed'|'archived') default 'active',
  finance_category_id uuid null,    -- optional auto-progress source
  weekly_review boolean default false,
  created_at timestamptz default now(),
  completed_at timestamptz null

goal_milestones
  id uuid pk, user_id uuid, goal_id uuid,
  title text, target_date date null,
  position int default 0,
  completed_at timestamptz null

goal_notes
  id uuid pk, user_id uuid, goal_id uuid,
  body text, created_at timestamptz default now()
```

All tables: `alter table ... enable row level security` + `create policy "x_all" for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)`.

Indexes: `(user_id, date)` on `habit_logs`; `(user_id, status)` on habits and goals.

### Frontend

- New folder `src/components/habits/`:
  - `HabitsTabs.tsx`, `TodayView.tsx`, `HabitsList.tsx`, `GoalsList.tsx`, `StatsView.tsx`
  - `HabitCard.tsx`, `HabitFormSheet.tsx`, `HabitCheckButton.tsx` (handles boolean/counter/duration)
  - `GoalCard.tsx`, `GoalFormSheet.tsx`, `GoalDetailSheet.tsx`, `MilestoneRow.tsx`
  - `YearlyHeatmap.tsx` (reusable, also good for Prayer Kaza later)
  - `StreakBadge.tsx`, `WeekDots.tsx` (last-7-day mini indicator)
  - `HabitTemplates.tsx` (template picker grid)
- New page: `src/pages/app/Habits.tsx`
- New hooks: `src/hooks/useHabits.ts`, `src/hooks/useGoals.ts` — both emit `ai-data-changed` after mutations and expose `refresh()`
- New data: `src/data/habitTemplates.ts` (preset library, bilingual)
- `src/components/app/AppSidebar.tsx` — add Habits nav entry
- `src/App.tsx` — add `/app/habits` route

### Streak math (client-side, in `useHabits`)

For each habit:

- Build a date set from `habit_logs` where `status in ('done','partial','frozen')` and value meets target (if quantifiable).
- Walk back from today over scheduled days only. `skipped` breaks the streak unless freeze applied.
- Cache per habit; recompute on mutation.

### AI assistant tool additions

In `supabase/functions/ai-assistant/index.ts`, register the new tools listed above. Each tool validates JWT, scopes by `user_id`, and returns compact JSON. `weekly_review` aggregates last-7-day logs + goal deltas server-side and lets the model phrase the summary in user's language.

### i18n

Add `habits.*` keys in `src/i18n/en.ts` and `src/i18n/bn.ts` for: tab titles, time-of-day groups, type/schedule labels, all template names, button labels (Check, Skip, Freeze, +1, -1), empty states, stats card titles, goal categories/types, AI nudges.

### Acceptance

- `/app/habits` opens to Today, lists today's scheduled habits grouped by time of day, shows real streaks.
- Adding a habit (boolean/counter/duration) and logging it updates streak, week-dots, and yearly heatmap immediately.
- Goals show progress %, can have milestones added/completed, and a goal detail view lists linked habits with their streaks.
- Stats tab renders a yearly heatmap and weekly consistency chart from real logs.
- Sidebar shows "Habits" entry that highlights when active.
- AI: "log my water habit, 7 glasses" updates the counter; "how's my reading goal?" returns progress; "weekly review" returns a coherent summary in the active language.
- Switching between English and Bengali updates every label.