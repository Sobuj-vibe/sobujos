# LifeOS MCP Server

Remote MCP server that exposes the LifeOS database to Claude. Single-user, full read-write.

## Endpoint

```
https://cpnahbutjrtfzknqjaor.supabase.co/functions/v1/lifeos-mcp
```

Transport: **MCP Streamable HTTP** (mcp-lite). All requests POST JSON-RPC 2.0.

## Authentication

Bearer token on every request:

```
Authorization: Bearer <LIFEOS_MCP_TOKEN>
```

Server-side, the function uses Supabase service role + a hardcoded `LIFEOS_USER_ID` env var. Every query is scoped with `.eq('user_id', LIFEOS_USER_ID)`. RLS is bypassed by service role, so this scoping is the only thing protecting your data — never remove it.

## Connect to Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "lifeos": {
      "url": "https://cpnahbutjrtfzknqjaor.supabase.co/functions/v1/lifeos-mcp",
      "headers": {
        "Authorization": "Bearer YOUR_LIFEOS_MCP_TOKEN_HERE"
      }
    }
  }
}
```

Or for Claude.ai web → Settings → Connectors → Add custom connector → paste the URL and bearer token.

## Tool catalog

### Cross-cutting
- **`whoami`** → `{ id, display_name, timezone, language, primary_currency }`

### Tasks (5 tools)
- **`task_groups_list`** → `[{ id, name, color, icon, position }]`
- **`task_groups_create`** `{ name, color?, icon? }`
- **`tasks_list`** `{ group_id?, only_open?, due_before?, due_on? }`
- **`tasks_create`** `{ title, group_id, notes?, due_date?, priority?, contact_id? }`
- **`tasks_update`** `{ id, title?, notes?, due_date?, priority?, completed? }`
- **`tasks_delete`** `{ id }`

### Habits & Goals (5 tools)
- **`habits_list`** `{ status? }` → status defaults `active`
- **`habits_today`** `{ date? }` → habits + today's log status
- **`habits_log`** `{ habit_id, date, status?, value?, note? }` → status: `done|skipped|missed`
- **`goals_list`** `{ status? }`
- **`goals_create`** `{ title, description?, category?, type?, target_value?, target_unit?, deadline? }`
- **`goals_update_progress`** `{ id, current_value?, complete? }`

### Prayer (3 tools)
- **`prayer_log`** `{ date, prayer, status }` → prayer: `fajr|dhuhr|asr|maghrib|isha`, status: `on_time|late|qaza`
- **`prayer_day_summary`** `{ date }` → array of 5 prayer rows
- **`quran_log_add`** `{ surah_number, surah_name, ayat_from, ayat_to?, date?, note? }`

### Finance (6 tools)
- **`finance_categories_list`** `{ kind? }` → kind: `income|expense`
- **`finance_transactions_list`** `{ kind?, category_id?, from?, to?, limit? }`
- **`finance_transaction_add`** `{ kind, amount, currency?, category_id?, subcategory_id?, pay_for?, payment_method?, occurred_at?, note? }`
- **`finance_summary`** `{ month }` → `{ month, by_currency: { BDT: {income, expense, net}, ... } }`
- **`finance_loans_list`** `{ direction?, only_open? }`
- **`finance_loan_add`** `{ direction, person_name, amount, currency?, loan_date?, expected_return_date?, reason?, note? }`

### Contacts / CRM (7 tools)
- **`contact_groups_list`** → `{ groups, subgroups }`
- **`contacts_search`** `{ query?, group_id?, subgroup_id?, only_favorite?, limit? }`
- **`contacts_get`** `{ id }` → full profile with phones, emails, addresses, socials, notes, events, relationships
- **`contacts_create`** `{ full_name, group_id?, subgroup_id?, nickname?, gender?, dob?, blood_group?, location?, company?, job_title?, website?, relationship?, how_we_met? }`
- **`contacts_update`** `{ id, ...any updatable field, is_favorite?, status? }`
- **`contact_note_add`** `{ contact_id, body, is_pinned? }`
- **`contact_relation_link`** `{ from_contact_id, to_contact_id, relation }`

Total: **27 tools**.

## Database schema (reference)

All tables have `id`, `user_id`, `created_at`. Listed below: domain-specific columns only.

### profiles
`display_name, avatar_url, language, theme, theme_color, timezone, location`

### Tasks
- **`task_groups`** — `name, color, icon, position`
- **`tasks`** — `group_id, title, notes, due_date, priority (low|medium|high), completed_at, position, contact_id`
- **`subtasks`** — `task_id, title, completed_at, position`

### Habits & Goals
- **`habits`** — `name, icon, color, type (boolean|numeric), target_value, target_unit, schedule_kind (daily|weekly|specific_days), schedule_days, weekly_count, time_of_day (morning|afternoon|evening|night|anytime), reminder_time, goal_id, why, status (active|paused|archived), position, freezes_per_month`
- **`habit_logs`** — `habit_id, date, value, status (done|skipped|missed), note, logged_at`
- **`goals`** — `title, description, category, type (outcome|process), target_value, target_unit, current_value, start_date, deadline, status (active|completed|archived), finance_category_id, weekly_review, completed_at`
- **`goal_milestones`** — `goal_id, title, target_date, completed_at, position`
- **`goal_notes`** — `goal_id, body`

### Prayer
- **`prayer_logs`** — `date, prayer (fajr|dhuhr|asr|maghrib|isha), status (on_time|late|qaza), made_up_at`
- **`quran_logs`** — `date, surah_number, surah_name, ayat_from, ayat_to, note`
- **`tasbih_counters`** — `name, count, target`
- **`hadith_daily`** — `date, text_en, text_bn, reference`

### Finance (currency enum: `BDT|USD|CNY`)
- **`finance_categories`** — `kind (income|expense), name, color, icon, position`
- **`finance_subcategories`** — `category_id, name, position`
- **`finance_transactions`** — `kind, amount, currency, category_id, subcategory_id, pay_for, payment_method, receipt_url, occurred_at, note, recurring_id`
- **`finance_loans`** — `direction (lent|borrowed), person_name, reason, amount, currency, loan_date, expected_return_date, paid_at, note`
- **`finance_recurring`** — `kind, service_name, amount, currency, category_id, payment_method, start_date, frequency (weekly|monthly|quarterly|yearly), next_renewal_date, auto_post, note, logo_url`
- **`finance_budgets`** — `category_id, month, amount_limit, currency`
- **`finance_settings`** — `primary_currency, fx_bdt_per_cny, fx_usd_per_cny`

### Contacts / CRM
- **`contact_groups`** — `name, color, icon, position`
- **`contact_subgroups`** — `group_id, name, position`
- **`contacts`** — `group_id, subgroup_id, full_name, nickname, avatar_url, gender, dob, blood_group, location, company, job_title, website, relationship, how_we_met, met_through_id, finance_role (none|debtor|creditor|both), is_favorite, is_private, status (active|archived|blocked), last_interaction_at`
- **`contact_phones`** — `contact_id, label, number, is_whatsapp, is_wechat, position`
- **`contact_emails`** — `contact_id, label, email, position`
- **`contact_addresses`** — `contact_id, label, line1, city, country, position`
- **`contact_socials`** — `contact_id, platform, url, position`
- **`contact_notes`** — `contact_id, body, is_pinned, updated_at`
- **`contact_events`** — `contact_id, kind (note|call|meeting|message|email|other), occurred_at, summary`
- **`contact_relationships`** — `from_contact_id, to_contact_id, relation` (free-text e.g. "father of")
- **`contact_tags`** — `name, color`
- **`contact_tag_links`** — `contact_id, tag_id`
- **`contact_custom_fields`** — `group_id, label, type, position`
- **`contact_field_values`** — `contact_id, field_id, value`

## Adding tools for future modules

When you add a new module (e.g. Journal, Workouts):

1. Create the table(s) via migration (always include `user_id uuid` + RLS `auth.uid() = user_id`).
2. Open `supabase/functions/lifeos-mcp/index.ts`, add a new `mcp.tool({ ... })` block following the same pattern.
3. Always include `.eq('user_id', USER_ID)` on every query.
4. Save and the function auto-deploys.

## Quick test

```bash
curl -X POST https://cpnahbutjrtfzknqjaor.supabase.co/functions/v1/lifeos-mcp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

You should see all 27 tools listed.

```bash
curl -X POST https://cpnahbutjrtfzknqjaor.supabase.co/functions/v1/lifeos-mcp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"whoami","arguments":{}}}'
```
