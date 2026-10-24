import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

// J-60 reminder: the two slow steps (visa, housing) plus the first-month budget.
interface Props { destination?: string; departureDate?: string; housingConfirmed?: boolean; lang?: string }

const COPY = {
  fr: {
    preview: (d: string) => `Départ pour ${d} dans 2 mois : le bon moment pour le visa et le logement`,
    title: (d: string) => `Plus que 2 mois avant ${d}`,
    intro: (date: string) => `Ton départ est prévu le ${date}. Certaines démarches prennent plusieurs semaines : voici ce qu'il vaut mieux régler maintenant.`,
    visa: "📄 Visa et documents : vérifie si un visa est nécessaire pour ta nationalité et combien de temps prend la démarche. Si tu pars dans l'UE avec une nationalité européenne, vérifie surtout que ta pièce d'identité reste valide pendant tout le séjour.",
    housingTodo: "🏠 Logement : il n'est pas encore confirmé. Compare tes options, demande une visite (en vrai ou en visio) et ne paie jamais de caution avant d'avoir signé un contrat.",
    housingDone: "🏠 Logement confirmé : prépare la caution, l'assurance habitation et l'état des lieux d'entrée.",
    budget: "💶 Budget : vérifie que tu peux couvrir ton premier mois (caution, premier loyer, installation).",
    cta: "Voir ce qu'il me reste à préparer",
    footer: "Tu reçois ce rappel car tu prépares un séjour sur Xplania. Tu peux désactiver les rappels de départ dans Paramètres → Notifications.",
  },
  en: {
    preview: (d: string) => `Leaving for ${d} in 2 months: the right time for your visa and housing`,
    title: (d: string) => `2 months to go before ${d}`,
    intro: (date: string) => `You leave on ${date}. Some steps take several weeks: here is what is best sorted now.`,
    visa: "📄 Visa and documents: check whether your nationality needs a visa and how long it takes. If you are an EU national going to the EU, mainly check that your ID stays valid for the whole stay.",
    housingTodo: "🏠 Housing: not confirmed yet. Compare your options, ask for a visit (in person or by video) and never pay a deposit before signing a contract.",
    housingDone: "🏠 Housing confirmed: plan the deposit, home insurance and the move-in inventory.",
    budget: "💶 Budget: check you can cover your first month (deposit, first rent, move-in costs).",
    cta: "See what's left to prepare",
    footer: "You get this reminder because you are preparing a stay on Xplania. You can turn off departure reminders in Settings → Notifications.",
  },
}

const DepartureReminderEmail = ({ destination = 'ta destination', departureDate = '', housingConfirmed = false, lang = 'fr' }: Props) => {
  const c = lang === 'en' ? COPY.en : COPY.fr
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
            <Text style={item}>{c.visa}</Text>
            <Text style={item}>{housingConfirmed ? c.housingDone : c.housingTodo}</Text>
            <Text style={item}>{c.budget}</Text>
          </Section>
          <Button href="https://xplania.app/app" style={button}>{c.cta}</Button>
          <Text style={footer}>{c.footer}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: DepartureReminderEmail,
  subject: (d: Record<string, any>) => d.lang === 'en' ? `2 months before ${d.destination || 'your departure'}: visa and housing` : `J-60 avant ${d.destination || 'ton départ'} : visa et logement`,
  displayName: 'Rappel J-60 (visa, logement, budget)',
  previewData: { destination: 'Japon', departureDate: '1 février 2027', housingConfirmed: false, lang: 'fr' },
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
