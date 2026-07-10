// Shared auth helper for edge functions.
// Returns the authenticated user id or a 401 Response.
// Also rejects anon-key JWTs (role === "anon"), so a call without a signed-in
// user is refused even though supabase.functions.invoke() falls back to the
// anon key as the Bearer token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export async function requireAuth(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<{ userId: string; token: string } | Response> {
  const unauthorized = () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return unauthorized();
  }
  const token = authHeader.slice(7).trim();
  if (!token) return unauthorized();

  // Decode the JWT payload without verification just to detect the anon key
  // (role === "anon"), which has no `sub` and must not pass as a user.
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    if (payload?.role === "anon" || !payload?.sub) return unauthorized();
  } catch {
    return unauthorized();
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return unauthorized();
    return { userId: data.user.id, token };
  } catch {
    return unauthorized();
  }
}
