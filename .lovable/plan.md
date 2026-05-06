# Plan: LifeOS MCP Server for Claude

## Important architecture note

Your LifeOS is **not** a "React + Node backend" app. It's:

- **React (Vite) frontend** (`src/`)
- **Supabase Cloud backend** — Postgres database with Row-Level Security, plus 3 Deno Edge Functions (`ai-assistant`, `finance-ocr`, `prayer-hadith`)

There are **no REST endpoints** in the traditional sense. The frontend talks to Postgres directly through the Supabase JS client, and RLS policies enforce that `auth.uid() = user_id` on every table. So the MCP server has two viable shapes — pick one before building.

## Choose the MCP server shape

**Option A — Direct Supabase access (recommended)**
The MCP server holds the `SUPABASE_SERVICE_ROLE_KEY` and a fixed `LIFEOS_USER_ID`. Each MCP tool runs a typed query against Postgres (e.g. `supabase.from('tasks').insert(...).eq('user_id', LIFEOS_USER_ID)`). Simple, fast, full coverage of all 30 tables.

**Option B — Wrap the existing `ai-assistant` edge function**
That function already exposes ~20 tool definitions (list_groups, create_task, log_habit, add_transaction, etc.) but only for Tasks/Habits/Finance/Prayer — not Contacts. You'd lose the new CRM module unless we extend it.

I recommend **Option A** because it gives Claude full coverage of all 5 modules (Tasks, Habits & Goals, Prayer, Finance, Contacts/CRM) with one consistent pattern.

## Deliverable: a deployable MCP server

A new Supabase Edge Function `lifeos-mcp` built with **mcp-lite + Hono** (Streamable HTTP transport), deployed at:

```
https://cpnahbutjrtfzknqjaor.supabase.co/functions/v1/lifeos-mcp
```

Connected to Claude Desktop / Claude.ai as a remote MCP server.

### Authentication

Two layers:

1. **Claude → MCP server**: a static `LIFEOS_MCP_TOKEN` secret. The server checks `Authorization: Bearer <token>` on every request. You set this token once in Claude's MCP connector config.
2. **MCP server → Supabase**: server uses `SUPABASE_SERVICE_ROLE_KEY` (already configured) and a hardcoded `LIFEOS_USER_ID` secret (your own auth.users id) to scope every query. RLS is bypassed by service role, so we manually apply `.eq('user_id', LIFEOS_USER_ID)` on every read/write — non-negotiable safety rule.

No per-request OAuth, no end-user JWTs. Single-user MCP.

### Tools to expose (grouped by module)

**Tasks (4 tools)**

- `tasks_list` — filter by `group_id`, `only_open`, `due_before`, `due_on` (timezone-aware)
- `tasks_create` — title, group_id, notes, due_date, priority
- `tasks_update` — id + partial patch (title, notes, due_date, priority, completed)
- `tasks_delete` — id

**Task Groups (2 tools)**

- `task_groups_list`
- `task_groups_create` — name, color, icon

**Habits & Goals (5 tools)**

- `habits_list` — active/archived
- `habits_log` — habit_id, date, status (done/skipped/missed), value, note
- `habits_today` — returns each habit + today's log status
- `goals_list` — by status
- `goals_create` / `goals_update_progress`

**Prayer (3 tools)**

- `prayer_log` — date, prayer (fajr/dhuhr/asr/maghrib/isha), status (on_time/late/qaza)
- `prayer_day_summary` — date → 5-prayer status array
- `quran_log_add` — surah, ayat range, note

**Finance (5 tools)**

- `finance_transactions_list` — filter by kind, category, date range
- `finance_transaction_add` — kind, amount, currency, category_id, occurred_at, note
- `finance_loans_list` / `finance_loan_add`
- `finance_summary` — month → income/expense/net per currency

**Contacts / CRM (7 tools)**

- `contacts_search` — by name, group, tag, favorite
- `contacts_get` — full profile with phones, emails, socials, notes, relations
- `contacts_create` — full_name, group_id, gender, dob, etc.
- `contacts_update`
- `contact_note_add` — contact_id, body, is_pinned
- `contact_relation_link` — from, to, relation
- `contact_groups_list`

**Cross-cutting (1 tool)**

- `whoami` — returns the bound user_id, timezone, primary currency. Useful for Claude to confirm context.

That's ~27 tools. mcp-lite handles them all in one server file.

### Files to create

```text
supabase/functions/lifeos-mcp/
├── index.ts          # Hono app + mcp-lite server + tool registrations
├── deno.json         # imports for mcp-lite, hono
└── lib/
    ├── auth.ts       # bearer token check
    ├── supabase.ts   # service-role client factory
    └── tools/
        ├── tasks.ts
        ├── habits.ts
        ├── prayer.ts
        ├── finance.ts
        └── contacts.ts
```

Plus `supabase/config.toml` entry:

```toml
[functions.lifeos-mcp]
verify_jwt = false   # we do our own bearer check
```

And one new secret: `LIFEOS_MCP_TOKEN` (random 32-byte hex) and `LIFEOS_USER_ID` (your auth.users uuid).

## Reference docs I'll generate alongside the server

I'll also write `supabase/functions/lifeos-mcp/README.md` containing exactly what you asked for in your message, but accurate to this architecture:

1. **Tool catalog** — every MCP tool with its input schema and what it does (replaces "API endpoints")
2. **Database schema reference** — all 30 tables grouped by module, with column types and the enums (`contact_status`, `habit_type`, `finance_currency`, `prayer_name`, `goal_type`, etc.)
3. **Auth model** — bearer-token + service-role + bound user_id explanation
4. **Request/response shapes** — JSON examples for each tool's input and the row shapes returned
5. **Claude connector config** — exact JSON to paste into Claude Desktop's `claude_desktop_config.json` or the Claude.ai remote MCP UI

## Open questions before I implement

1. **Single-user or multi-user?** I'm assuming single-user (just you). If you ever want to share LifeOS, the MCP server needs OAuth instead of a static token — much bigger build.
2. **Read-only or read-write?** I'm assuming full read-write so Claude can actually create tasks, log prayers, add transactions. Confirm or restrict.
3. **Any modules you want excluded?** E.g. should Claude be able to touch Finance and Contacts, or only Tasks/Habits/Prayer?
4. **Confirm Option A** (direct Supabase access) vs Option B (wrap `ai-assistant`).  
  
answers:
  1. Right now i am building it for me and i am the only user, but in the future maybe and maybe i can share that with my brother and very close friend, but the possibility is really low.
  2. Full read and write access.
  3. Full access, and also need to add the future modules what i will add in the future.
  4. Option A

Answer these four and I'll implement the full server, the README, and give you the exact Claude connector config in one go.