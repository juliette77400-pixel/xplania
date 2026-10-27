import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

// Last-stretch reminders: J-10 prepares the arrival on site, J-5 the suitcase.
interface Props { stage?: 'j10' | 'j5'; destination?: string; departureDate?: string; housingConfirmed?: boolean; lang?: string }

const COPY = {
  fr: {
    j10: {
      preview: (d: string) => `Plus que 10 jours avant ${d} : prépare ton arrivée`,
      title: (d: string) => `Plus que 10 jours avant ${d}`,
      intro: (date: string) => `Ton départ est prévu le ${date}. C'est le bon moment pour préparer ton arrivée sur place.`,
      items: (housingConfirmed: boolean) => [
        housingConfirmed
          ? "🏠 Arrivée au logement : note l'adresse exacte, l'heure de remise des clés et le contact de ton propriétaire ou de ta résidence."
          : "🏠 Logement : il n'est pas encore confirmé. Prévois au moins tes premières nuits sur place, et ne paie jamais de caution avant d'avoir signé un contrat.",
        "🚆 Trajet d'arrivée : repère comment rejoindre ton logement depuis l'aéroport ou la gare.",
        "💳 Banque et téléphone : préviens ta banque de ton départ et vérifie ce que ton forfait mobile couvre à l'étranger.",
        "📑 Copies : garde une copie numérique de ta pièce d'identité, de ton contrat et de ton assurance.",
      ],
      cta: "Voir ce qu'il me reste à préparer",
      url: 'https://xplania.app/app',
    },
    j5: {
      preview: (d: string) => `Plus que 5 jours avant ${d} : c'est l'heure de la valise`,
      title: (d: string) => `Plus que 5 jours avant ${d} 🧳`,
      intro: (date: string) => `Ton départ est prévu le ${date}. Il est temps de boucler ta valise.`,
      items: () => [
        '🧳 Valise : coche ta liste dans le guide Valise, préparée selon la météo habituelle de ton séjour.',
        '⚖️ Bagages : vérifie le poids et les dimensions autorisés par ta compagnie.',
        '🎒 Bagage à main : garde avec toi ta pièce d\'identité, tes documents, tes médicaments et ton chargeur.',
        "🎫 Billet : vérifie l'heure de départ et, si tu prends l'avion, l'ouverture de l'enregistrement en ligne.",
      ],
      cta: 'Préparer ma valise',
      url: 'https://xplania.app/guide-valise',
    },
    footer: 'Tu reçois ce rappel car tu prépares un séjour sur Xplania. Tu peux désactiver les rappels de départ dans Paramètres → Notifications.',
  },
  en: {
    j10: {
      preview: (d: string) => `10 days to go before ${d}: plan your arrival`,
      title: (d: string) => `10 days to go before ${d}`,
      intro: (date: string) => `You leave on ${date}. Now is a good time to plan your arrival.`,
      items: (housingConfirmed: boolean) => [
        housingConfirmed
          ? '🏠 Moving in: note the exact address, the key handover time and your landlord or residence contact.'
          : '🏠 Housing: not confirmed yet. Book at least your first nights, and never pay a deposit before signing a contract.',
        '🚆 Getting there: check how to reach your home from the airport or station.',
        '💳 Bank and phone: tell your bank you are leaving and check what your mobile plan covers abroad.',
        '📑 Copies: keep a digital copy of your ID, your contract and your insurance.',
      ],
      cta: "See what's left to prepare",
      url: 'https://xplania.app/app',
    },
    j5: {
      preview: (d: string) => `5 days to go before ${d}: time to pack`,
      title: (d: string) => `5 days to go before ${d} 🧳`,
      intro: (date: string) => `You leave on ${date}. Time to finish your suitcase.`,
      items: () => [
        '🧳 Suitcase: tick your list in the Packing guide, based on the usual weather of your stay.',
        '⚖️ Luggage: check the weight and size your carrier allows.',
        '🎒 Hand luggage: keep your ID, documents, medicines and charger with you.',
        '🎫 Ticket: check your departure time and, if you fly, when online check-in opens.',
      ],
      cta: 'Pack my suitcase',
      url: 'https://xplania.app/guide-valise',
    },
    footer: 'You get this reminder because you are preparing a stay on Xplania. You can turn off departure reminders in Settings → Notifications.',
  },
}

const CountdownReminderEmail = ({ stage = 'j10', destination = 'ta destination', departureDate = '', housingConfirmed = false, lang = 'fr' }: Props) => {
  const l = lang === 'en' ? COPY.en : COPY.fr
  const c = stage === 'j5' ? l.j5 : l.j10
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
            {c.items(housingConfirmed).map((i) => <Text key={i} style={item}>{i}</Text>)}
          </Section>
          <Button href={c.url} style={button}>{c.cta}</Button>
          <Text style={footer}>{l.footer}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: CountdownReminderEmail,
  subject: (d: Record<string, any>) => {
    const en = d.lang === 'en'
    const dest = d.destination || (en ? 'your departure' : 'ton départ')
    if (d.stage === 'j5') return en ? `5 days before ${dest}: time to pack` : `J-5 avant ${dest} : ta valise`
    return en ? `10 days before ${dest}: plan your arrival` : `J-10 avant ${dest} : prépare ton arrivée`
  },
  displayName: 'Rappels J-10 (arrivée) et J-5 (valise)',
  previewData: { stage: 'j10', destination: 'Espagne', departureDate: '6 novembre 2026', housingConfirmed: false, lang: 'fr' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '3px', color: '#06b6d4', fontWeight: 'bold' as const, margin: '0 0 8px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f1629', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5' }
const box = { backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '8px 16px', margin: '12px 0 20px' }
const item = { fontSize: '14px', color: '#0f1629', margin: '10px 0', lineHeight: '1.5' }
const button = { backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '28px 0 0', lineHeight: '1.5' }
