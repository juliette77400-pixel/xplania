// Sends a one-time "80% of budget used" email to the signed-in user.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { z } from 'npm:zod@3.23.8'
import { requireAuth } from '../_shared/require-auth.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

const Body = z.object({
  budgetKey: z.string().min(1).max(300),
  destination: z.string().max(200).optional().default(''),
  spent: z.number().min(0).max(10_000_000),
  planned: z.number().positive().max(10_000_000),
  lang: z.enum(['fr', 'en']).optional().default('fr'),
})

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const auth = await requireAuth(req, corsHeaders)
  if (auth instanceof Response) return auth
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400)
  const { budgetKey, destination, spent, planned, lang } = parsed.data
  if (spent / planned < 0.8) return json({ sent: false, reason: 'below_threshold' })

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: u } = await admin.auth.admin.getUserById(auth.userId)
  const email = u?.user?.email
  if (!email) return json({ sent: false, reason: 'no_email' })

  // Stable hash of the budget key so each trip budget only alerts once.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(budgetKey))
  const hash = Array.from(new Uint8Array(digest)).slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('')
  try {
    const r = await sendTemplateEmail('budget-alert', email, {
      templateData: { destination, spent, planned, lang },
      idempotencyKey: `budget-alert-80-${auth.userId}-${hash}`,
    })
    return json(r)
  } catch (e) {
    console.error('budget-alert failed', e)
    return json({ error: 'send_failed' }, 500)
  }
})
