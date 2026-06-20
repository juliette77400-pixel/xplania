// Sends a notification email to the Xplania team whenever someone joins
// the premium waitlist. Uses Resend's onboarding sender (no domain needed).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TEAM_EMAIL = "juliettenoel.xplania@gmail.com";

interface Payload {
  email: string;
  first_name?: string | null;
  linkedin_url?: string | null;
  pack?: string | null;
  source?: string | null;
  locale?: string | null;
}

const escape = (v: unknown) =>
  String(v ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");

    const body = (await req.json()) as Payload;
    const email = String(body?.email ?? "").trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "email required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Anti-abuse: only allow notifications for emails that just successfully
    // went through subscribe_to_waitlist RPC (server-validated row exists,
    // created within the last 5 minutes). This prevents arbitrary callers
    // from spamming the team inbox.
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: row, error: lookupErr } = await admin
      .from("premium_waitlist")
      .select("created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lookupErr) {
      console.error("notify-waitlist lookup error", lookupErr);
      return new Response(JSON.stringify({ error: "lookup_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!row?.created_at || Date.now() - new Date(row.created_at).getTime() > 5 * 60 * 1000) {
      return new Response(JSON.stringify({ error: "not_eligible" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
        <h2 style="margin:0 0 16px">🚀 Nouvelle inscription waitlist Xplania</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px">
          <tr><td style="padding:8px 0;color:#666;width:140px">Prénom</td><td><strong>${escape(body.first_name)}</strong></td></tr>
          <tr><td style="padding:8px 0;color:#666">Email</td><td><a href="mailto:${escape(body.email)}">${escape(body.email)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666">LinkedIn</td><td>${
            body.linkedin_url
              ? `<a href="${escape(body.linkedin_url)}">${escape(body.linkedin_url)}</a>`
              : "—"
          }</td></tr>
          <tr><td style="padding:8px 0;color:#666">Pack visé</td><td>${escape(body.pack)}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Source</td><td>${escape(body.source)}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Langue</td><td>${escape(body.locale)}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Date</td><td>${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</td></tr>
        </table>
        <p style="margin-top:24px;font-size:12px;color:#888">Notification automatique — Xplania waitlist</p>
      </div>`;

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Xplania Waitlist <onboarding@resend.dev>",
        to: [TEAM_EMAIL],
        reply_to: body.email,
        subject: `🎯 Nouvelle inscription : ${body.first_name || body.email}`,
        html,
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      console.error("Resend error", r.status, data);
      return new Response(JSON.stringify({ error: data }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: data?.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("notify-waitlist error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
