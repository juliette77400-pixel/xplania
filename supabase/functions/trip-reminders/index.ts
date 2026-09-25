// Daily job: emails a J-7 reminder (with formalities checklist) to owners of trips leaving in 7 days.
// Idempotent per trip, so repeated calls never send duplicates.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const target = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const { data: trips, error } = await admin.from('trips').select('id,user_id,destination,departure_date').eq('departure_date', target).limit(500)
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  let sent = 0
  for (const t of trips || []) {
    try {
      const { data: u } = await admin.auth.admin.getUserById(t.user_id)
      const email = u?.user?.email
      if (!email) continue
      const lang = (u.user.user_metadata?.lang === 'en') ? 'en' : 'fr'
      const dateLabel = new Date(t.departure_date + 'T12:00:00Z').toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      const r = await sendTemplateEmail('trip-reminder', email, {
        templateData: { destination: t.destination || '', departureDate: dateLabel, tripUrl: `https://xplania.app/carnet/${t.id}`, lang },
        idempotencyKey: `trip-reminder-j7-${t.id}-${t.departure_date}`,
      })
      if (r.sent) sent++
    } catch (e) { console.error('trip-reminder failed', t.id, e) }
  }
  return new Response(JSON.stringify({ checked: trips?.length || 0, sent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})
