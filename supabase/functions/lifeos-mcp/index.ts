// LifeOS MCP Server - exposes the LifeOS Postgres backend to Claude over MCP.
// Auth: static bearer token (LIFEOS_MCP_TOKEN). All queries scoped to LIFEOS_USER_ID.

import { Hono } from "hono";
import { McpServer, StreamableHttpTransport } from "mcp-lite";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MCP_TOKEN = Deno.env.get("LIFEOS_MCP_TOKEN")!;
const USER_ID = Deno.env.get("LIFEOS_USER_ID")!;

const sb = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
});

async function run<T>(p: PromiseLike<{ data: T; error: any }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw new Error(error.message);
  return data;
}

const mcp = new McpServer({ name: "lifeos-mcp", version: "1.0.0" });

/* whoami */
mcp.tool({
  name: "whoami",
  description: "Returns bound user_id, display name, timezone, primary currency, language.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const profile = await run(
      sb.from("profiles").select("id,display_name,timezone,language").eq("id", USER_ID).maybeSingle(),
    );
    const fset = await run(
      sb.from("finance_settings").select("primary_currency").eq("user_id", USER_ID).maybeSingle(),
    );
    return ok({ ...profile, primary_currency: (fset as any)?.primary_currency ?? null });
  },
});

/* Task Groups */
mcp.tool({
  name: "task_groups_list",
  description: "List all task groups.",
  inputSchema: { type: "object", properties: {} },
  handler: async () =>
    ok(await run(sb.from("task_groups").select("*").eq("user_id", USER_ID).order("position"))),
});

mcp.tool({
  name: "task_groups_create",
  description: "Create a task group. Color: indigo|teal|rose|emerald|amber|sky. Icon: lucide name.",
  inputSchema: {
    type: "object",
    properties: { name: { type: "string" }, color: { type: "string" }, icon: { type: "string" } },
    required: ["name"],
  },
  handler: async (a: any) =>
    ok(await run(
      sb.from("task_groups").insert({
        user_id: USER_ID, name: a.name,
        color: a.color ?? "indigo", icon: a.icon ?? "folder",
      }).select().single(),
    )),
});

/* Tasks */
mcp.tool({
  name: "tasks_list",
  description: "List tasks. Filter by group_id, only_open, due_before/due_on (YYYY-MM-DD).",
  inputSchema: {
    type: "object",
    properties: {
      group_id: { type: "string" }, only_open: { type: "boolean" },
      due_before: { type: "string" }, due_on: { type: "string" },
    },
  },
  handler: async (a: any) => {
    let q = sb.from("tasks").select("*").eq("user_id", USER_ID);
    if (a.group_id) q = q.eq("group_id", a.group_id);
    if (a.only_open) q = q.is("completed_at", null);
    if (a.due_before) q = q.lte("due_date", a.due_before);
    if (a.due_on) q = q.eq("due_date", a.due_on);
    return ok(await run(q.order("due_date", { ascending: true, nullsFirst: false })));
  },
});

mcp.tool({
  name: "tasks_create",
  description: "Create a task. priority: low|medium|high. due_date YYYY-MM-DD.",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" }, group_id: { type: "string" },
      notes: { type: "string" }, due_date: { type: "string" },
      priority: { type: "string" }, contact_id: { type: "string" },
    },
    required: ["title", "group_id"],
  },
  handler: async (a: any) =>
    ok(await run(
      sb.from("tasks").insert({
        user_id: USER_ID, title: a.title, group_id: a.group_id,
        notes: a.notes ?? null, due_date: a.due_date ?? null,
        priority: a.priority ?? "medium", contact_id: a.contact_id ?? null,
      }).select().single(),
    )),
});

mcp.tool({
  name: "tasks_update",
  description: "Update a task. Set completed=true to mark done, false to reopen.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string" }, title: { type: "string" }, notes: { type: "string" },
      due_date: { type: "string" }, priority: { type: "string" }, completed: { type: "boolean" },
    },
    required: ["id"],
  },
  handler: async (a: any) => {
    const patch: any = {};
    for (const k of ["title", "notes", "due_date", "priority"]) if (k in a) patch[k] = a[k];
    if ("completed" in a) patch.completed_at = a.completed ? new Date().toISOString() : null;
    return ok(await run(sb.from("tasks").update(patch).eq("id", a.id).eq("user_id", USER_ID).select().single()));
  },
});

mcp.tool({
  name: "tasks_delete",
  description: "Delete a task by id.",
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  handler: async (a: any) => {
    await run(sb.from("tasks").delete().eq("id", a.id).eq("user_id", USER_ID));
    return ok({ deleted: a.id });
  },
});

/* Habits & Goals */
mcp.tool({
  name: "habits_list",
  description: "List habits. status: active|paused|archived (default active).",
  inputSchema: { type: "object", properties: { status: { type: "string" } } },
  handler: async (a: any) =>
    ok(await run(
      sb.from("habits").select("*").eq("user_id", USER_ID).eq("status", a.status ?? "active").order("position"),
    )),
});

mcp.tool({
  name: "habits_today",
  description: "List active habits with today's log status. date YYYY-MM-DD (default today UTC).",
  inputSchema: { type: "object", properties: { date: { type: "string" } } },
  handler: async (a: any) => {
    const date = a.date ?? new Date().toISOString().slice(0, 10);
    const habits = await run(sb.from("habits").select("*").eq("user_id", USER_ID).eq("status", "active"));
    const logs = await run(sb.from("habit_logs").select("*").eq("user_id", USER_ID).eq("date", date));
    const byHabit = new Map((logs as any[]).map((l) => [l.habit_id, l]));
    return ok((habits as any[]).map((h) => ({ ...h, today_log: byHabit.get(h.id) ?? null })));
  },
});

mcp.tool({
  name: "habits_log",
  description: "Log a habit for a date. status: done|skipped|missed. value optional (numeric habits).",
  inputSchema: {
    type: "object",
    properties: {
      habit_id: { type: "string" }, date: { type: "string" },
      status: { type: "string" }, value: { type: "number" }, note: { type: "string" },
    },
    required: ["habit_id", "date"],
  },
  handler: async (a: any) => {
    await run(sb.from("habit_logs").delete().eq("user_id", USER_ID).eq("habit_id", a.habit_id).eq("date", a.date));
    return ok(await run(
      sb.from("habit_logs").insert({
        user_id: USER_ID, habit_id: a.habit_id, date: a.date,
        status: a.status ?? "done", value: a.value ?? 1, note: a.note ?? null,
      }).select().single(),
    ));
  },
});

mcp.tool({
  name: "goals_list",
  description: "List goals. status: active|completed|archived (default active).",
  inputSchema: { type: "object", properties: { status: { type: "string" } } },
  handler: async (a: any) =>
    ok(await run(
      sb.from("goals").select("*").eq("user_id", USER_ID).eq("status", a.status ?? "active").order("created_at", { ascending: false }),
    )),
});

mcp.tool({
  name: "goals_create",
  description: "Create a goal. type: outcome|process. category free text.",
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" }, description: { type: "string" }, category: { type: "string" },
      type: { type: "string" }, target_value: { type: "number" },
      target_unit: { type: "string" }, deadline: { type: "string" },
    },
    required: ["title"],
  },
  handler: async (a: any) =>
    ok(await run(
      sb.from("goals").insert({
        user_id: USER_ID, title: a.title, description: a.description ?? null,
        category: a.category ?? "personal", type: a.type ?? "outcome",
        target_value: a.target_value ?? null, target_unit: a.target_unit ?? null,
        deadline: a.deadline ?? null,
      }).select().single(),
    )),
});

mcp.tool({
  name: "goals_update_progress",
  description: "Update a goal's current_value, or mark complete.",
  inputSchema: {
    type: "object",
    properties: { id: { type: "string" }, current_value: { type: "number" }, complete: { type: "boolean" } },
    required: ["id"],
  },
  handler: async (a: any) => {
    const patch: any = {};
    if ("current_value" in a) patch.current_value = a.current_value;
    if (a.complete) { patch.status = "completed"; patch.completed_at = new Date().toISOString(); }
    return ok(await run(sb.from("goals").update(patch).eq("id", a.id).eq("user_id", USER_ID).select().single()));
  },
});

/* Prayer */
mcp.tool({
  name: "prayer_log",
  description: "Log a prayer. prayer: fajr|dhuhr|asr|maghrib|isha. status: on_time|late|qaza.",
  inputSchema: {
    type: "object",
    properties: { date: { type: "string" }, prayer: { type: "string" }, status: { type: "string" } },
    required: ["date", "prayer", "status"],
  },
  handler: async (a: any) =>
    ok(await run(
      sb.from("prayer_logs").upsert(
        { user_id: USER_ID, date: a.date, prayer: a.prayer, status: a.status, made_up_at: null },
        { onConflict: "user_id,date,prayer" },
      ).select().single(),
    )),
});

mcp.tool({
  name: "prayer_day_summary",
  description: "Get all 5 prayer statuses for a given date (YYYY-MM-DD).",
  inputSchema: { type: "object", properties: { date: { type: "string" } }, required: ["date"] },
  handler: async (a: any) =>
    ok(await run(
      sb.from("prayer_logs").select("prayer,status,made_up_at").eq("user_id", USER_ID).eq("date", a.date),
    )),
});

mcp.tool({
  name: "quran_log_add",
  description: "Log Quran reading. date YYYY-MM-DD, surah_number 1-114.",
  inputSchema: {
    type: "object",
    properties: {
      date: { type: "string" }, surah_number: { type: "number" }, surah_name: { type: "string" },
      ayat_from: { type: "number" }, ayat_to: { type: "number" }, note: { type: "string" },
    },
    required: ["surah_number", "surah_name", "ayat_from"],
  },
  handler: async (a: any) =>
    ok(await run(
      sb.from("quran_logs").insert({
        user_id: USER_ID, date: a.date ?? new Date().toISOString().slice(0, 10),
        surah_number: a.surah_number, surah_name: a.surah_name,
        ayat_from: a.ayat_from, ayat_to: a.ayat_to ?? null, note: a.note ?? null,
      }).select().single(),
    )),
});

/* Finance */
mcp.tool({
  name: "finance_categories_list",
  description: "List finance categories. kind: income|expense (optional).",
  inputSchema: { type: "object", properties: { kind: { type: "string" } } },
  handler: async (a: any) => {
    let q = sb.from("finance_categories").select("*").eq("user_id", USER_ID);
    if (a.kind) q = q.eq("kind", a.kind);
    return ok(await run(q.order("position")));
  },
});

mcp.tool({
  name: "finance_transactions_list",
  description: "List transactions. Filter by kind, category_id, date range (YYYY-MM-DD).",
  inputSchema: {
    type: "object",
    properties: {
      kind: { type: "string" }, category_id: { type: "string" },
      from: { type: "string" }, to: { type: "string" }, limit: { type: "number" },
    },
  },
  handler: async (a: any) => {
    let q = sb.from("finance_transactions").select("*").eq("user_id", USER_ID);
    if (a.kind) q = q.eq("kind", a.kind);
    if (a.category_id) q = q.eq("category_id", a.category_id);
    if (a.from) q = q.gte("occurred_at", a.from);
    if (a.to) q = q.lte("occurred_at", a.to);
    return ok(await run(q.order("occurred_at", { ascending: false }).limit(a.limit ?? 100)));
  },
});

mcp.tool({
  name: "finance_transaction_add",
  description: "Add a transaction. kind: income|expense. currency: BDT|USD|CNY.",
  inputSchema: {
    type: "object",
    properties: {
      kind: { type: "string" }, amount: { type: "number" }, currency: { type: "string" },
      category_id: { type: "string" }, subcategory_id: { type: "string" },
      pay_for: { type: "string" }, payment_method: { type: "string" },
      occurred_at: { type: "string" }, note: { type: "string" },
    },
    required: ["kind", "amount"],
  },
  handler: async (a: any) =>
    ok(await run(
      sb.from("finance_transactions").insert({
        user_id: USER_ID, kind: a.kind, amount: a.amount,
        currency: a.currency ?? "BDT",
        category_id: a.category_id ?? null, subcategory_id: a.subcategory_id ?? null,
        pay_for: a.pay_for ?? null, payment_method: a.payment_method ?? null,
        occurred_at: a.occurred_at ?? new Date().toISOString(), note: a.note ?? null,
      }).select().single(),
    )),
});

mcp.tool({
  name: "finance_summary",
  description: "Income/expense/net per currency for a month (YYYY-MM).",
  inputSchema: { type: "object", properties: { month: { type: "string" } }, required: ["month"] },
  handler: async (a: any) => {
    const start = `${a.month}-01`;
    const [y, m] = a.month.split("-").map(Number);
    const end = new Date(Date.UTC(y, m, 1)).toISOString();
    const rows = await run(
      sb.from("finance_transactions").select("kind,amount,currency").eq("user_id", USER_ID).gte("occurred_at", start).lt("occurred_at", end),
    );
    const agg: Record<string, { income: number; expense: number; net: number }> = {};
    for (const r of rows as any[]) {
      agg[r.currency] ??= { income: 0, expense: 0, net: 0 };
      const v = Number(r.amount);
      if (r.kind === "income") agg[r.currency].income += v;
      else agg[r.currency].expense += v;
    }
    for (const c of Object.keys(agg)) agg[c].net = agg[c].income - agg[c].expense;
    return ok({ month: a.month, by_currency: agg });
  },
});

mcp.tool({
  name: "finance_loans_list",
  description: "List loans. direction: lent|borrowed (optional). only_open=true to skip paid.",
  inputSchema: {
    type: "object",
    properties: { direction: { type: "string" }, only_open: { type: "boolean" } },
  },
  handler: async (a: any) => {
    let q = sb.from("finance_loans").select("*").eq("user_id", USER_ID);
    if (a.direction) q = q.eq("direction", a.direction);
    if (a.only_open) q = q.is("paid_at", null);
    return ok(await run(q.order("loan_date", { ascending: false })));
  },
});

mcp.tool({
  name: "finance_loan_add",
  description: "Record a loan. direction: lent|borrowed.",
  inputSchema: {
    type: "object",
    properties: {
      direction: { type: "string" }, person_name: { type: "string" },
      amount: { type: "number" }, currency: { type: "string" },
      loan_date: { type: "string" }, expected_return_date: { type: "string" },
      reason: { type: "string" }, note: { type: "string" },
    },
    required: ["direction", "person_name", "amount"],
  },
  handler: async (a: any) =>
    ok(await run(
      sb.from("finance_loans").insert({
        user_id: USER_ID, direction: a.direction, person_name: a.person_name,
        amount: a.amount, currency: a.currency ?? "BDT",
        loan_date: a.loan_date ?? new Date().toISOString().slice(0, 10),
        expected_return_date: a.expected_return_date ?? null,
        reason: a.reason ?? null, note: a.note ?? null,
      }).select().single(),
    )),
});

/* Contacts / CRM */
mcp.tool({
  name: "contact_groups_list",
  description: "List contact groups and subgroups.",
  inputSchema: { type: "object", properties: {} },
  handler: async () => {
    const [g, s] = await Promise.all([
      run(sb.from("contact_groups").select("*").eq("user_id", USER_ID).order("position")),
      run(sb.from("contact_subgroups").select("*").eq("user_id", USER_ID).order("position")),
    ]);
    return ok({ groups: g, subgroups: s });
  },
});

mcp.tool({
  name: "contacts_search",
  description: "Search contacts. Filter by query (name), group_id, subgroup_id, only_favorite.",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string" }, group_id: { type: "string" },
      subgroup_id: { type: "string" }, only_favorite: { type: "boolean" }, limit: { type: "number" },
    },
  },
  handler: async (a: any) => {
    let q = sb.from("contacts").select("*").eq("user_id", USER_ID);
    if (a.query) q = q.ilike("full_name", `%${a.query}%`);
    if (a.group_id) q = q.eq("group_id", a.group_id);
    if (a.subgroup_id) q = q.eq("subgroup_id", a.subgroup_id);
    if (a.only_favorite) q = q.eq("is_favorite", true);
    return ok(await run(q.order("full_name").limit(a.limit ?? 50)));
  },
});

mcp.tool({
  name: "contacts_get",
  description: "Full contact profile: contact + phones, emails, addresses, socials, notes, events, relations.",
  inputSchema: { type: "object", properties: { id: { type: "string" } }, required: ["id"] },
  handler: async (a: any) => {
    const [c, p, e, ad, so, n, ev, rel] = await Promise.all([
      run(sb.from("contacts").select("*").eq("id", a.id).eq("user_id", USER_ID).maybeSingle()),
      run(sb.from("contact_phones").select("*").eq("contact_id", a.id)),
      run(sb.from("contact_emails").select("*").eq("contact_id", a.id)),
      run(sb.from("contact_addresses").select("*").eq("contact_id", a.id)),
      run(sb.from("contact_socials").select("*").eq("contact_id", a.id)),
      run(sb.from("contact_notes").select("*").eq("contact_id", a.id).order("created_at", { ascending: false })),
      run(sb.from("contact_events").select("*").eq("contact_id", a.id).order("occurred_at", { ascending: false }).limit(50)),
      run(sb.from("contact_relationships").select("*").or(`from_contact_id.eq.${a.id},to_contact_id.eq.${a.id}`)),
    ]);
    return ok({ contact: c, phones: p, emails: e, addresses: ad, socials: so, notes: n, events: ev, relationships: rel });
  },
});

mcp.tool({
  name: "contacts_create",
  description: "Create a contact. group_id optional. gender: male|female|other|prefer_not_to_say.",
  inputSchema: {
    type: "object",
    properties: {
      full_name: { type: "string" }, group_id: { type: "string" }, subgroup_id: { type: "string" },
      nickname: { type: "string" }, gender: { type: "string" }, dob: { type: "string" },
      blood_group: { type: "string" }, location: { type: "string" }, company: { type: "string" },
      job_title: { type: "string" }, website: { type: "string" },
      relationship: { type: "string" }, how_we_met: { type: "string" },
    },
    required: ["full_name"],
  },
  handler: async (a: any) => {
    const row: any = { user_id: USER_ID, full_name: a.full_name };
    for (const k of [
      "group_id","subgroup_id","nickname","gender","dob","blood_group",
      "location","company","job_title","website","relationship","how_we_met",
    ]) if (k in a) row[k] = a[k];
    return ok(await run(sb.from("contacts").insert(row).select().single()));
  },
});

mcp.tool({
  name: "contacts_update",
  description: "Update a contact's profile fields.",
  inputSchema: {
    type: "object",
    properties: {
      id: { type: "string" }, full_name: { type: "string" }, group_id: { type: "string" },
      subgroup_id: { type: "string" }, nickname: { type: "string" }, gender: { type: "string" },
      dob: { type: "string" }, blood_group: { type: "string" }, location: { type: "string" },
      company: { type: "string" }, job_title: { type: "string" }, website: { type: "string" },
      is_favorite: { type: "boolean" }, status: { type: "string" },
    },
    required: ["id"],
  },
  handler: async (a: any) => {
    const patch: any = {};
    for (const k of Object.keys(a)) if (k !== "id") patch[k] = a[k];
    return ok(await run(sb.from("contacts").update(patch).eq("id", a.id).eq("user_id", USER_ID).select().single()));
  },
});

mcp.tool({
  name: "contact_note_add",
  description: "Add a note to a contact.",
  inputSchema: {
    type: "object",
    properties: { contact_id: { type: "string" }, body: { type: "string" }, is_pinned: { type: "boolean" } },
    required: ["contact_id", "body"],
  },
  handler: async (a: any) =>
    ok(await run(
      sb.from("contact_notes").insert({
        user_id: USER_ID, contact_id: a.contact_id, body: a.body, is_pinned: !!a.is_pinned,
      }).select().single(),
    )),
});

mcp.tool({
  name: "contact_relation_link",
  description: "Link two contacts. relation example: 'father of', 'friend of', 'business partner of'.",
  inputSchema: {
    type: "object",
    properties: {
      from_contact_id: { type: "string" }, to_contact_id: { type: "string" }, relation: { type: "string" },
    },
    required: ["from_contact_id", "to_contact_id", "relation"],
  },
  handler: async (a: any) =>
    ok(await run(
      sb.from("contact_relationships").insert({
        user_id: USER_ID, from_contact_id: a.from_contact_id,
        to_contact_id: a.to_contact_id, relation: a.relation,
      }).select().single(),
    )),
});

/* HTTP transport with bearer auth */
const transport = new StreamableHttpTransport();
const app = new Hono();

app.use("*", async (c, next) => {
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type, accept, mcp-session-id",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      },
    });
  }
  const auth = c.req.header("authorization") ?? "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token || token !== MCP_TOKEN) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  await next();
  c.res.headers.set("Access-Control-Allow-Origin", "*");
});

app.all("/*", async (c) => transport.handleRequest(c.req.raw, mcp));

Deno.serve(app.fetch);
