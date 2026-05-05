import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const tools = [
  {
    type: "function",
    function: {
      name: "list_groups",
      description: "List all task groups for the user. Returns id, name, color, icon.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tasks",
      description:
        "List tasks. Optionally filter by group_id, only_open (incomplete), or due_before (YYYY-MM-DD).",
      parameters: {
        type: "object",
        properties: {
          group_id: { type: "string" },
          only_open: { type: "boolean" },
          due_before: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_group",
      description: "Create a new task group.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string" },
          color: { type: "string", enum: ["indigo", "teal", "rose", "emerald", "amber", "sky"] },
          icon: { type: "string", description: "lucide-react icon name e.g. Folder, Briefcase, Home, Heart, BookOpen, Dumbbell, ShoppingCart, Plane, Code, Music" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_task",
      description: "Create a new task in a group. Resolve group_id by listing groups first if needed.",
      parameters: {
        type: "object",
        properties: {
          group_id: { type: "string" },
          group_name: { type: "string", description: "Use if group_id is unknown; will match by name (case-insensitive). If no match, create the group first." },
          title: { type: "string" },
          notes: { type: "string" },
          due_date: { type: "string", description: "YYYY-MM-DD" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_subtask",
      description: "Create a subtask under a task.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          task_title_match: { type: "string", description: "Use if task_id is unknown; matches task title case-insensitively." },
          title: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a task as completed (or uncompleted).",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          task_title_match: { type: "string" },
          completed: { type: "boolean" },
        },
        required: ["completed"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_task",
      description: "Delete a task by id or title match.",
      parameters: {
        type: "object",
        properties: {
          task_id: { type: "string" },
          task_title_match: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "log_prayer",
      description: "Log one of the 5 daily prayers with status. Date defaults to today.",
      parameters: {
        type: "object",
        properties: {
          prayer: { type: "string", enum: ["fajr","dhuhr","asr","maghrib","isha"] },
          status: { type: "string", enum: ["on_time","late","qaza"] },
          date: { type: "string", description: "YYYY-MM-DD, defaults to today" },
        },
        required: ["prayer","status"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_kaza_made_up",
      description: "Mark a previously-missed (qaza) prayer as made up. Provide prayer + date.",
      parameters: {
        type: "object",
        properties: {
          prayer: { type: "string", enum: ["fajr","dhuhr","asr","maghrib","isha"] },
          date: { type: "string", description: "YYYY-MM-DD" },
        },
        required: ["prayer","date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_quran_log",
      description: "Add a Quran reading log entry.",
      parameters: {
        type: "object",
        properties: {
          surah_number: { type: "number" },
          surah_name: { type: "string" },
          ayat_from: { type: "number" },
          ayat_to: { type: "number" },
          note: { type: "string" },
        },
        required: ["surah_number","surah_name","ayat_from"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_prayer_summary",
      description: "Get prayer stats for the last N days (default 30): per-prayer counts of on_time/late/qaza and outstanding kaza.",
      parameters: {
        type: "object",
        properties: { days: { type: "number" } },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_finance_categories",
      description: "List all finance categories. Optional kind filter (income or expense).",
      parameters: { type: "object", properties: { kind: { type: "string", enum: ["income","expense"] } } },
    },
  },
  {
    type: "function",
    function: {
      name: "add_transaction",
      description: "Add an income or expense transaction. Resolve category by name if id unknown.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["income","expense"] },
          amount: { type: "number" },
          currency: { type: "string", enum: ["BDT","CNY","USD"] },
          category_name: { type: "string", description: "Category name to match (case-insensitive). Will create if missing." },
          subcategory_name: { type: "string" },
          pay_for: { type: "string" },
          payment_method: { type: "string", description: "WeChat, Alipay, Cash, bKash, Nagad, Bank, or Card" },
          occurred_at: { type: "string", description: "ISO datetime, defaults to now" },
          note: { type: "string" },
        },
        required: ["kind","amount","currency"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_transactions",
      description: "List recent transactions. Optional kind, days_back, category_name filters.",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["income","expense"] },
          days_back: { type: "number" },
          category_name: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_loan",
      description: "Add a loan record (taken or given).",
      parameters: {
        type: "object",
        properties: {
          direction: { type: "string", enum: ["taken","given"] },
          person_name: { type: "string" },
          reason: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string", enum: ["BDT","CNY","USD"] },
          loan_date: { type: "string", description: "YYYY-MM-DD" },
          expected_return_date: { type: "string", description: "YYYY-MM-DD" },
          note: { type: "string" },
        },
        required: ["direction","person_name","amount","currency"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_loans",
      description: "List loans. Optional only_open and direction filters.",
      parameters: {
        type: "object",
        properties: {
          only_open: { type: "boolean" },
          direction: { type: "string", enum: ["taken","given"] },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "mark_loan_paid",
      description: "Mark a loan as paid. Provide loan_id, or person_name + amount to find it.",
      parameters: {
        type: "object",
        properties: {
          loan_id: { type: "string" },
          person_name: { type: "string" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_recurring",
      description: "Add a recurring income or expense (e.g. subscription).",
      parameters: {
        type: "object",
        properties: {
          kind: { type: "string", enum: ["income","expense"] },
          service_name: { type: "string" },
          amount: { type: "number" },
          currency: { type: "string", enum: ["BDT","CNY","USD"] },
          frequency: { type: "string", enum: ["daily","weekly","monthly","yearly"] },
          payment_method: { type: "string" },
          start_date: { type: "string", description: "YYYY-MM-DD" },
          next_renewal_date: { type: "string", description: "YYYY-MM-DD" },
          auto_post: { type: "boolean" },
          note: { type: "string" },
        },
        required: ["kind","service_name","amount","currency","frequency"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recurring",
      description: "List recurring items.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_finance_summary",
      description: "Get total income, expense, net, and top expense categories for the last N days (default 30).",
      parameters: { type: "object", properties: { days: { type: "number" } } },
    },
  },
];

async function runTool(name: string, args: any, supabase: any, userId: string) {
  switch (name) {
    case "list_groups": {
      const { data, error } = await supabase
        .from("task_groups")
        .select("id, name, color, icon")
        .eq("user_id", userId);
      if (error) throw error;
      return data;
    }
    case "list_tasks": {
      let q = supabase
        .from("tasks")
        .select("id, group_id, title, notes, due_date, priority, completed_at")
        .eq("user_id", userId);
      if (args.group_id) q = q.eq("group_id", args.group_id);
      if (args.only_open) q = q.is("completed_at", null);
      if (args.due_before) q = q.lte("due_date", args.due_before);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data;
    }
    case "create_group": {
      const { data, error } = await supabase
        .from("task_groups")
        .insert({
          user_id: userId,
          name: args.name,
          color: args.color || "indigo",
          icon: args.icon || "Folder",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "create_task": {
      let groupId = args.group_id;
      if (!groupId && args.group_name) {
        const { data: gs } = await supabase
          .from("task_groups")
          .select("id, name")
          .eq("user_id", userId)
          .ilike("name", args.group_name);
        if (gs && gs.length > 0) groupId = gs[0].id;
        else {
          const { data: newG, error: gErr } = await supabase
            .from("task_groups")
            .insert({ user_id: userId, name: args.group_name, color: "indigo", icon: "Folder" })
            .select()
            .single();
          if (gErr) throw gErr;
          groupId = newG.id;
        }
      }
      if (!groupId) {
        const { data: anyG } = await supabase
          .from("task_groups")
          .select("id")
          .eq("user_id", userId)
          .limit(1);
        if (anyG && anyG.length) groupId = anyG[0].id;
        else {
          const { data: newG, error: gErr } = await supabase
            .from("task_groups")
            .insert({ user_id: userId, name: "Inbox", color: "indigo", icon: "Folder" })
            .select()
            .single();
          if (gErr) throw gErr;
          groupId = newG.id;
        }
      }
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          user_id: userId,
          group_id: groupId,
          title: args.title,
          notes: args.notes ?? null,
          due_date: args.due_date ?? null,
          priority: args.priority ?? "medium",
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "create_subtask": {
      let taskId = args.task_id;
      if (!taskId && args.task_title_match) {
        const { data: ts } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", userId)
          .ilike("title", `%${args.task_title_match}%`)
          .limit(1);
        if (!ts || !ts.length) throw new Error("Task not found");
        taskId = ts[0].id;
      }
      if (!taskId) throw new Error("task_id or task_title_match required");
      const { data, error } = await supabase
        .from("subtasks")
        .insert({ user_id: userId, task_id: taskId, title: args.title })
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "complete_task": {
      let taskId = args.task_id;
      if (!taskId && args.task_title_match) {
        const { data: ts } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", userId)
          .ilike("title", `%${args.task_title_match}%`)
          .limit(1);
        if (!ts || !ts.length) throw new Error("Task not found");
        taskId = ts[0].id;
      }
      const { data, error } = await supabase
        .from("tasks")
        .update({ completed_at: args.completed ? new Date().toISOString() : null })
        .eq("id", taskId)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    case "delete_task": {
      let taskId = args.task_id;
      if (!taskId && args.task_title_match) {
        const { data: ts } = await supabase
          .from("tasks")
          .select("id")
          .eq("user_id", userId)
          .ilike("title", `%${args.task_title_match}%`)
          .limit(1);
        if (!ts || !ts.length) throw new Error("Task not found");
        taskId = ts[0].id;
      }
      const { error } = await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId);
      if (error) throw error;
      return { ok: true };
    }
    case "log_prayer": {
      const date = args.date || new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("prayer_logs")
        .upsert(
          { user_id: userId, date, prayer: args.prayer, status: args.status, made_up_at: null },
          { onConflict: "user_id,date,prayer" },
        )
        .select().single();
      if (error) throw error;
      return data;
    }
    case "mark_kaza_made_up": {
      const { data, error } = await supabase
        .from("prayer_logs")
        .update({ made_up_at: new Date().toISOString() })
        .eq("user_id", userId).eq("date", args.date).eq("prayer", args.prayer)
        .select().maybeSingle();
      if (error) throw error;
      return data || { ok: false, message: "No matching qaza found" };
    }
    case "add_quran_log": {
      const { data, error } = await supabase
        .from("quran_logs")
        .insert({
          user_id: userId,
          date: new Date().toISOString().slice(0, 10),
          surah_number: args.surah_number,
          surah_name: args.surah_name,
          ayat_from: args.ayat_from,
          ayat_to: args.ayat_to ?? null,
          note: args.note ?? null,
        }).select().single();
      if (error) throw error;
      return data;
    }
    case "get_prayer_summary": {
      const days = args.days || 30;
      const from = new Date();
      from.setDate(from.getDate() - days);
      const { data, error } = await supabase
        .from("prayer_logs")
        .select("prayer,status,made_up_at,date")
        .eq("user_id", userId)
        .gte("date", from.toISOString().slice(0, 10));
      if (error) throw error;
      const PR = ["fajr","dhuhr","asr","maghrib","isha"];
      const summary: any = { days, per_prayer: {}, outstanding_kaza: 0 };
      for (const p of PR) {
        const rows = (data || []).filter((r: any) => r.prayer === p);
        const on_time = rows.filter((r: any) => r.status === "on_time").length;
        const late = rows.filter((r: any) => r.status === "late").length;
        const qaza = rows.filter((r: any) => r.status === "qaza" && !r.made_up_at).length;
        summary.per_prayer[p] = { on_time, late, qaza };
        summary.outstanding_kaza += qaza;
      }
      return summary;
    }
  }
  throw new Error(`Unknown tool: ${name}`);
}

async function buildContext(supabase: any, userId: string) {
  const [{ data: groups }, { data: tasks }, { data: profile }] = await Promise.all([
    supabase.from("task_groups").select("id, name, color, icon").eq("user_id", userId),
    supabase
      .from("tasks")
      .select("id, group_id, title, due_date, priority, completed_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase.from("profiles").select("display_name, language").eq("id", userId).maybeSingle(),
  ]);
  const today = new Date().toISOString().slice(0, 10);
  const open = (tasks || []).filter((t: any) => !t.completed_at);
  const overdue = open.filter((t: any) => t.due_date && t.due_date < today);
  return {
    today,
    profile,
    groups: groups || [],
    open_count: open.length,
    overdue_count: overdue.length,
    recent_open_tasks: open.slice(0, 25),
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: uErr } = await supabase.auth.getUser(token);
    if (uErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { messages: clientMessages, attachments } = await req.json();
    const ctx = await buildContext(supabase, userId);

    const language = ctx.profile?.language === "en" ? "English" : "Bangla (বাংলা)";
    const systemPrompt = `You are the AI Assistant for Personal Life OS, a personal productivity app.
Reply in ${language} unless the user writes in another language.
Be concise, friendly, and proactive. Use markdown.

You can read the user's data and take actions through tools. Always prefer taking action over just describing how.
When the user shares an image or PDF (e.g. handwritten notes, screenshot, receipt, syllabus), extract tasks/items and create them via tools, asking only if truly ambiguous.

CONTEXT (live snapshot):
- Today: ${ctx.today}
- User: ${ctx.profile?.display_name ?? "Unknown"}
- Groups (${ctx.groups.length}): ${JSON.stringify(ctx.groups)}
- Open tasks: ${ctx.open_count} (overdue: ${ctx.overdue_count})
- Recent open tasks: ${JSON.stringify(ctx.recent_open_tasks)}

Rules:
- When creating tasks, reuse an existing group when reasonable (match by name).
- After taking actions, briefly confirm what you did.
- For multi-step requests, call multiple tools in sequence.`;

    // Build messages. Last user message may include attachments → multimodal content array.
    const messages: any[] = [{ role: "system", content: systemPrompt }];
    for (let i = 0; i < clientMessages.length; i++) {
      const m = clientMessages[i];
      const isLast = i === clientMessages.length - 1;
      if (isLast && m.role === "user" && attachments && attachments.length > 0) {
        const content: any[] = [{ type: "text", text: m.content || "" }];
        for (const a of attachments) {
          if (a.type?.startsWith("image/")) {
            content.push({ type: "image_url", image_url: { url: a.dataUrl } });
          } else if (a.type === "application/pdf") {
            content.push({ type: "file", file: { filename: a.name || "file.pdf", file_data: a.dataUrl } });
          }
        }
        messages.push({ role: "user", content });
      } else {
        messages.push({ role: m.role, content: m.content });
      }
    }

    // Tool-calling loop (max 6 iterations)
    let finalText = "";
    const actionsLog: any[] = [];
    for (let iter = 0; iter < 6; iter++) {
      const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://lovable.dev",
          "X-Title": "Personal Life OS",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages,
          tools,
          tool_choice: "auto",
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error("OpenRouter error", resp.status, errText);
        return new Response(JSON.stringify({ error: `AI error: ${resp.status}` }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const data = await resp.json();
      const choice = data.choices?.[0];
      const msg = choice?.message;
      if (!msg) break;

      messages.push(msg);

      const toolCalls = msg.tool_calls;
      if (!toolCalls || toolCalls.length === 0) {
        finalText = msg.content || "";
        break;
      }

      for (const tc of toolCalls) {
        let result: any;
        try {
          const args = typeof tc.function.arguments === "string"
            ? JSON.parse(tc.function.arguments || "{}")
            : tc.function.arguments;
          result = await runTool(tc.function.name, args, supabase, userId);
          actionsLog.push({ tool: tc.function.name, args, ok: true });
        } catch (e: any) {
          result = { error: e.message };
          actionsLog.push({ tool: tc.function.name, ok: false, error: e.message });
        }
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
    }

    return new Response(
      JSON.stringify({ reply: finalText || "Done.", actions: actionsLog }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("ai-assistant error", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});