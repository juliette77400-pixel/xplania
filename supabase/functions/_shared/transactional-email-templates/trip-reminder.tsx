import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { destination?: string; departureDate?: string; tripUrl?: string; checklistUrl?: string; remainingItems?: string[]; lang?: string }

const COPY = {
  fr: {
    preview: (d: string) => `J-7 : ton voyage à ${d} approche !`,
    title: (d: string) => `Plus que 7 jours avant ${d} ✈️`,
    intro: (date: string) => `Ton départ est prévu le ${date}. Voici ta liste de vérification avant de partir :`,
    itemLabels: { passport: '🛂 Passeport ou carte d\'identité valide', visa: '📄 Visa ou autorisation d\'entrée si nécessaire', vaccines: '💉 Vaccins recommandés pour la destination', insurance: '🛡️ Assurance voyage souscrite', packing: '🧳 Valise préparée avec le Guide Valise' } as Record<string, string>,
    cta: 'Ouvrir mon voyage',
    done: "C'est fait ✔ — voir ma checklist",
    footer: 'Bon voyage avec Xplania 🌍',
  },
  en: {
    preview: (d: string) => `7 days to go: your trip to ${d} is coming up!`,
    title: (d: string) => `Only 7 days until ${d} ✈️`,
    intro: (date: string) => `You leave on ${date}. Here is your pre-departure checklist:`,
    itemLabels: { passport: '🛂 Valid passport or ID card', visa: '📄 Visa or entry authorisation if required', vaccines: '💉 Recommended vaccines for the destination', insurance: '🛡️ Travel insurance purchased', packing: '🧳 Suitcase packed with the Packing Guide' } as Record<string, string>,
    cta: 'Open my trip',
    done: "It's done ✔ — see my checklist",
    footer: 'Have a great trip with Xplania 🌍',
  },
}

const TripReminderEmail = ({ destination = 'ta destination', departureDate = '', tripUrl = 'https://xplania.app', checklistUrl, remainingItems, lang = 'fr' }: Props) => {
  const c = lang === 'en' ? COPY.en : COPY.fr
  const items = (remainingItems && remainingItems.length ? remainingItems : Object.keys(c.itemLabels)).map((k) => c.itemLabels[k]).filter(Boolean)
  return (
    <Html lang={lang === 'en' ? 'en' : 'fr'} dir="ltr">
      <Head />
      <Preview>{c.preview(destination)}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>XPLANIA</Text>
          <Heading style={h1}>{c.title(destination)}</Heading>
          <Text style={text}>{c.intro(departureDate)}</Text>
          <Section style={box}>
            {items.map((i) => <Text key={i} style={item}>{i}</Text>)}
          </Section>
          <Button href={tripUrl} style={button}>{c.cta}</Button>
          <Text style={doneLink}><a href={checklistUrl || tripUrl} style={link}>{c.done}</a></Text>
          <Text style={footer}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TripReminderEmail,
  subject: (d: Record<string, any>) => d.lang === 'en' ? `7 days to go: ${d.destination || 'your trip'} ✈️` : `J-7 : ${d.destination || 'ton voyage'} approche ✈️`,
  displayName: 'Rappel J-7 + formalités',
  previewData: { destination: 'Tokyo', departureDate: '2 octobre 2026', tripUrl: 'https://xplania.app/carnets', lang: 'fr' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '3px', color: '#06b6d4', fontWeight: 'bold' as const, margin: '0 0 8px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f1629', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5' }
const box = { backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '8px 16px', margin: '12px 0 20px' }
const item = { fontSize: '14px', color: '#0f1629', margin: '6px 0' }
const button = { backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '28px 0 0' }
const doneLink = { fontSize: '13px', margin: '14px 0 0' }
const link = { color: '#06b6d4', textDecoration: 'underline' }
