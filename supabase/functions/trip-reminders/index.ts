// Daily job: emails a J-7 reminder (with formalities checklist) to owners of trips leaving in 7 days.
// Idempotent per trip, so repeated calls never send duplicates.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const { data: okSecret } = await admin.rpc('verify_cron_secret', { _name: 'trip-reminders', _secret: req.headers.get('x-cron-secret') ?? '' })
  if (okSecret !== true) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  const target = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)
  const { data: trips, error } = await admin.from('trips').select('id,user_id,destination,departure_date').eq('departure_date', target).limit(500)
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const REMINDER_ITEMS = ['passport', 'visa', 'vaccines', 'insurance', 'packing']
  let sent = 0
  for (const t of trips || []) {
    try {
      const { data: checks } = await admin.from('trip_reminder_checks').select('item').eq('trip_id', t.id).eq('user_id', t.user_id)
      const doneItems = new Set((checks || []).map((c: { item: string }) => c.item))
      const allDone = REMINDER_ITEMS.every((i) => doneItems.has(i))
      if (allDone) continue // ✨ tout est prêt : pas de mail de formalités

      const { data: u } = await admin.auth.admin.getUserById(t.user_id)
      const email = u?.user?.email
      if (!email) continue
      const lang = (u.user.user_metadata?.lang === 'en') ? 'en' : 'fr'
      const dateLabel = new Date(t.departure_date + 'T12:00:00Z').toLocaleDateString(lang === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      const remainingItems = REMINDER_ITEMS.filter((i) => !doneItems.has(i))
      const r = await sendTemplateEmail('trip-reminder', email, {
        templateData: {
          destination: t.destination || '',
          departureDate: dateLabel,
          tripUrl: `https://xplania.app/carnet/${t.id}`,
          checklistUrl: `https://xplania.app/carnet/${t.id}`,
          remainingItems,
          lang,
        },
        idempotencyKey: `trip-reminder-j7-${t.id}-${t.departure_date}`,
      })
      if (r.sent) sent++
    } catch (e) { console.error('trip-reminder failed', t.id, e) }
  }
  const weatherSent = await weatherAlerts(admin)
  return new Response(JSON.stringify({ checked: trips?.length || 0, sent, weatherSent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
})

// ---- Weather alerts: trips leaving in 1-5 days with severe forecast at destination ----
const SEVERE = (d: { code: number; rain: number; tmax: number; tmin: number }) =>
  d.code >= 95 || d.rain >= 15 || d.tmax >= 35 || d.tmin <= -5

function describe(d: { code: number; rain: number; tmax: number; tmin: number }, en: boolean) {
  const parts: string[] = []
  if (d.code >= 95) parts.push(en ? 'thunderstorms' : 'orages')
  if (d.rain >= 15) parts.push(en ? `${Math.round(d.rain)} mm of rain` : `${Math.round(d.rain)} mm de pluie`)
  if (d.tmax >= 35) parts.push(en ? `heat up to ${Math.round(d.tmax)}°C` : `forte chaleur jusqu'à ${Math.round(d.tmax)} °C`)
  if (d.tmin <= -5) parts.push(en ? `cold down to ${Math.round(d.tmin)}°C` : `grand froid jusqu'à ${Math.round(d.tmin)} °C`)
  return (en ? 'expected: ' : 'prévu : ') + parts.join(', ')
}

async function suggest(destination: string, summary: string, en: boolean) {
  const key = Deno.env.get('LOVABLE_API_KEY')
  if (!key) return []
  try {
    const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: `${en ? 'In English' : 'En français'}. Destination: ${destination}. Weather: ${summary}. Give 3 real, named activities located in ${destination} (not generic) suited to this weather. Reply ONLY JSON: [{"title":"...","why":"short reason"}]` }],
      }),
    })
    if (!r.ok) return []
    const txt: string = (await r.json())?.choices?.[0]?.message?.content || ''
    const m = txt.match(/\[[\s\S]*\]/)
    const arr = m ? JSON.parse(m[0]) : []
    return Array.isArray(arr) ? arr.slice(0, 3).map((a: any) => ({ title: String(a.title || '').slice(0, 120), why: String(a.why || '').slice(0, 200) })).filter((a: any) => a.title) : []
  } catch { return [] }
}

async function weatherAlerts(admin: any) {
  const from = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const to = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10)
  const { data: trips } = await admin.from('trips').select('id,user_id,destination,arrival_city,departure_date,return_date')
    .gte('departure_date', from).lte('departure_date', to).limit(300)
  let sent = 0
  const geoCache = new Map<string, { lat: number; lng: number } | null>()
  for (const t of trips || []) {
    try {
      const place = (t.arrival_city || t.destination || '').trim()
      if (!place) continue
      if (!geoCache.has(place)) {
        const g = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=1&name=${encodeURIComponent(place.split(',')[0])}`).then((r) => r.json()).catch(() => null)
        const hit = g?.results?.[0]
        geoCache.set(place, hit ? { lat: hit.latitude, lng: hit.longitude } : null)
      }
      const geo = geoCache.get(place)
      if (!geo) continue
      const end = t.return_date && t.return_date < to ? t.return_date : to
      const f = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lng}&daily=weathercode,precipitation_sum,temperature_2m_max,temperature_2m_min&timezone=auto&start_date=${t.departure_date}&end_date=${end < t.departure_date ? t.departure_date : end}`).then((r) => r.json()).catch(() => null)
      const dd = f?.daily
      if (!dd?.time) continue
      const days = dd.time.map((date: string, i: number) => ({ date, code: dd.weathercode[i] ?? 0, rain: dd.precipitation_sum[i] ?? 0, tmax: dd.temperature_2m_max[i] ?? 20, tmin: dd.temperature_2m_min[i] ?? 10 }))
      const bad = days.find(SEVERE)
      if (!bad) continue

      const { data: u } = await admin.auth.admin.getUserById(t.user_id)
      const email = u?.user?.email
      if (!email) continue
      const en = u.user.user_metadata?.lang === 'en'
      const summary = describe(bad, en)
      const dayLabel = new Date(bad.date + 'T12:00:00Z').toLocaleDateString(en ? 'en-GB' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
      const suggestions = await suggest(place, summary, en)
      const r = await sendTemplateEmail('weather-alert', email, {
        templateData: { destination: place, dayLabel, summary, suggestions, tripUrl: `https://xplania.app/carnet/${t.id}`, lang: en ? 'en' : 'fr' },
        idempotencyKey: `weather-alert-${t.id}-${bad.date}`,
      })
      if (r.sent) sent++
    } catch (e) { console.error('weather-alert failed', t.id, e) }
  }
  return sent
}
