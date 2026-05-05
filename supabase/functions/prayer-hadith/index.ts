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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: userData, error: uErr } = await supabase.auth.getUser(token);
    if (uErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const refresh = !!body.refresh;
    const today = new Date().toISOString().slice(0, 10);

    if (!refresh) {
      const { data: cached } = await supabase
        .from("hadith_daily")
        .select("text_bn, text_en, reference")
        .eq("user_id", userId).eq("date", today).maybeSingle();
      if (cached) {
        return new Response(JSON.stringify({ hadith: cached, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const seed = `${userId.slice(0, 8)}-${today}-${refresh ? Math.random() : ""}`;
    const aiResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://lovable.dev",
        "X-Title": "Personal Life OS",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an Islamic scholar assistant. Choose ONE short, motivational, authentic hadith (Sahih Bukhari, Muslim, Tirmidhi, Abu Dawud, Ibn Majah, Nasai, or Riyad as-Salihin). Provide it in both Bangla and clear English with a short reference (book + number). Vary the hadith based on the seed.",
          },
          { role: "user", content: `Seed: ${seed}. Return one motivational hadith.` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_hadith",
              description: "Return the chosen hadith.",
              parameters: {
                type: "object",
                properties: {
                  text_bn: { type: "string", description: "Hadith translated to Bangla." },
                  text_en: { type: "string", description: "Hadith translated to English." },
                  reference: { type: "string", description: "e.g. Sahih Bukhari 6018" },
                },
                required: ["text_bn", "text_en", "reference"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_hadith" } },
      }),
    });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("hadith ai error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await aiResp.json();
    const args = data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {
      return new Response(JSON.stringify({ error: "No hadith returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const hadith = typeof args === "string" ? JSON.parse(args) : args;

    if (refresh) {
      await supabase.from("hadith_daily").delete().eq("user_id", userId).eq("date", today);
    }
    await supabase.from("hadith_daily").insert({
      user_id: userId, date: today,
      text_bn: hadith.text_bn, text_en: hadith.text_en, reference: hadith.reference,
    });

    return new Response(JSON.stringify({ hadith }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("prayer-hadith error", e);
    return new Response(JSON.stringify({ error: e.message || "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});