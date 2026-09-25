import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props { destination?: string; spent?: number; planned?: number; lang?: string }

const BudgetAlertEmail = ({ destination = '', spent = 0, planned = 0, lang = 'fr' }: Props) => {
  const en = lang === 'en'
  const left = Math.max(0, Math.round(planned - spent))
  const pct = planned ? Math.round((spent / planned) * 100) : 0
  return (
    <Html lang={en ? 'en' : 'fr'} dir="ltr">
      <Head />
      <Preview>{en ? `You've used ${pct}% of your budget` : `Tu as utilisé ${pct} % de ton budget`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>XPLANIA</Text>
          <Heading style={h1}>{en ? `💰 ${pct}% of your budget used` : `💰 ${pct} % de ton budget utilisé`}</Heading>
          <Text style={text}>
            {en
              ? `For your trip${destination ? ` to ${destination}` : ''}, you've spent €${Math.round(spent)} out of €${Math.round(planned)}. You have €${left} left.`
              : `Pour ton voyage${destination ? ` à ${destination}` : ''}, tu as dépensé ${Math.round(spent)} € sur ${Math.round(planned)} € prévus. Il te reste ${left} €.`}
          </Text>
          <Text style={text}>{en ? 'Open the Budget Guide to see where you can save.' : 'Ouvre le Guide Budget pour voir où tu peux économiser.'}</Text>
          <Button href="https://xplania.app/guide-budget" style={button}>{en ? 'Open my budget' : 'Voir mon budget'}</Button>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: BudgetAlertEmail,
  subject: (d: Record<string, any>) => d.lang === 'en' ? '💰 Budget alert: 80% used' : '💰 Alerte budget : 80 % utilisés',
  displayName: 'Alerte budget 80 %',
  previewData: { destination: 'Tokyo', spent: 660, planned: 820, lang: 'fr' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '3px', color: '#06b6d4', fontWeight: 'bold' as const, margin: '0 0 8px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f1629', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5' }
const button = { backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '12px 20px', textDecoration: 'none' }
