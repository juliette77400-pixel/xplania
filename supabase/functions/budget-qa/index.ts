import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const {
      question = "",
      history = [],
      firstName = "",
      destination = "Paris",
      totalBudget = 0,
      days = 0,
      travelers = 1,
      categories = [],
      expenses = [],
      locale = "fr",
      departureDate = "",
      returnDate = "",
      tripTypes = [],
      spendingPriorities = [],
      accommodationStanding = "",
      organization = "",
      rhythm = "",
    } = await req.json();

    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "missing_question" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    type Cat = { key: string; planned: number; spent: number };
    const cats = categories as Cat[];
    const breakdown = cats
      .map((c) => {
        const remaining = (Number(c.planned) || 0) - (Number(c.spent) || 0);
        return `${c.key}: planned €${c.planned}, spent €${c.spent}, remaining €${remaining}`;
      })
      .join(" | ");

    const totalSpent = (expenses as Array<{ amount: number }>).reduce(
      (s, e) => s + (Number(e.amount) || 0),
      0
    );
    const totalRemaining = (Number(totalBudget) || 0) - totalSpent;

    const expensesList = (expenses as Array<{ amount: number; category?: string; label?: string; date?: string }>)
      .slice(-20)
      .map((e) => `${e.date || ""} ${e.category || ""} €${e.amount}${e.label ? ` (${e.label})` : ""}`.trim())
      .join(" ; ") || "none";

    const styleBits = [
      tripTypes?.length ? `trip type: ${(tripTypes as string[]).join(", ")}` : "",
      spendingPriorities?.length ? `priorities: ${(spendingPriorities as string[]).join(", ")}` : "",
      accommodationStanding ? `accommodation: ${accommodationStanding}` : "",
      organization ? `organization: ${organization}` : "",
      rhythm ? `rhythm: ${rhythm}` : "",
    ].filter(Boolean).join(" | ");

    const today = new Date().toISOString().slice(0, 10);

    const context = `USER
First name: ${firstName || "(unknown)"}

TRIP
Destination: ${destination}
Dates: ${departureDate || "n/a"}${returnDate ? ` → ${returnDate}` : ""}
Duration: ${days} days
Travelers: ${travelers}
Profile: ${styleBits || "n/a"}

BUDGET
Total budget: €${totalBudget}
Total spent: €${Math.round(totalSpent)}
Total remaining: €${Math.round(totalRemaining)}
Per category: ${breakdown || "n/a"}

EXPENSES (recent)
${expensesList}

CURRENT DATE: ${today}`;

    const system = `You are Pip, Xplania's personal travel copilote. You are warm, encouraging, and speak like a well-traveled friend — not a customer service bot. You always use "tu" in French and "you" in English. You use the user's first name whenever you know it (use it naturally, not in every sentence). You are enthusiastic about travel and genuinely care about helping the user make the most of their trip without stress.

You have full access to the user's trip context: first name, destination, travel dates and duration, number of travelers, budget breakdown by category, expenses already logged, and remaining budget per category.

You can answer any question related to: budget feasibility, daily spending pace, local prices and cost of life at destination, transport options and costs, food budget tips (local restaurants, markets, street food), free or cheap activities, currency and exchange tips, how to split costs between travelers, what to do when going over budget, and general travel advice linked to budget.

You never say you cannot answer. If you are not 100% sure of something, you say so honestly but still give your best helpful estimate with context. You keep answers concise but warm — no bullet point walls, write like you're texting a friend who asked for advice. Use the occasional emoji to feel alive, but don't overdo it. Always respond in the same language the user writes in (French or English). The user's interface language is currently: ${locale}.

CONTEXT
${context}`;

    const recentHistory = (history as ChatMessage[])
      .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
      .slice(-10);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          ...recentHistory.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "rate_limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "credits_exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      console.error("AI gateway error", response.status, txt);
      throw new Error(`AI gateway ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ answer }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("budget-qa error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
