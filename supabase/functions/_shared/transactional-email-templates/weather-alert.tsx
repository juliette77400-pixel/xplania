import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Suggestion { title: string; why?: string }
interface Props { destination?: string; dayLabel?: string; summary?: string; suggestions?: Suggestion[]; tripUrl?: string; lang?: string }

const WeatherAlertEmail = ({ destination = '', dayLabel = '', summary = '', suggestions = [], tripUrl = 'https://xplania.app', lang = 'fr' }: Props) => {
  const en = lang === 'en'
  return (
    <Html lang={en ? 'en' : 'fr'} dir="ltr">
      <Head />
      <Preview>{en ? `Weather alert for ${destination}` : `Alerte météo à ${destination}`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>XPLANIA</Text>
          <Heading style={h1}>{en ? `⛈️ Weather change in ${destination}` : `⛈️ La météo change à ${destination}`}</Heading>
          <Text style={text}>{dayLabel}{dayLabel && summary ? ' : ' : ''}{summary}</Text>
          {suggestions.length > 0 && (
            <>
              <Text style={sub}>{en ? 'Activity ideas adapted to the weather:' : 'Idées d\'activités adaptées à la météo :'}</Text>
              <Section style={box}>
                {suggestions.map((s, i) => (
                  <Text key={i} style={item}><strong>{s.title}</strong>{s.why ? ` — ${s.why}` : ''}</Text>
                ))}
              </Section>
            </>
          )}
          <Text style={text}>{en ? 'Think about adapting your suitcase too.' : 'Pense aussi à adapter ta valise.'}</Text>
          <Button href={tripUrl} style={button}>{en ? 'Open my trip' : 'Ouvrir mon voyage'}</Button>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WeatherAlertEmail,
  subject: (d: Record<string, any>) => d.lang === 'en' ? `⛈️ Weather alert: ${d.destination || 'your trip'}` : `⛈️ Alerte météo : ${d.destination || 'ton voyage'}`,
  displayName: 'Alerte météo avant le départ',
  previewData: { destination: 'Tokyo', dayLabel: 'Samedi 3 octobre', summary: 'orages et 25 mm de pluie prévus', suggestions: [{ title: 'teamLab Planets', why: 'expérience immersive en intérieur' }, { title: 'Musée national de Tokyo', why: 'à Ueno, parfait sous la pluie' }], lang: 'fr' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { padding: '24px 28px', maxWidth: '560px' }
const brand = { fontSize: '12px', letterSpacing: '3px', color: '#06b6d4', fontWeight: 'bold' as const, margin: '0 0 8px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#0f1629', margin: '0 0 12px' }
const text = { fontSize: '14px', color: '#475569', lineHeight: '1.5' }
const sub = { fontSize: '14px', color: '#0f1629', fontWeight: 'bold' as const, margin: '16px 0 4px' }
const box = { backgroundColor: '#f1f5f9', borderRadius: '12px', padding: '8px 16px', margin: '8px 0 16px' }
const item = { fontSize: '14px', color: '#0f1629', margin: '6px 0' }
const button = { backgroundColor: '#7c3aed', color: '#ffffff', fontSize: '14px', borderRadius: '10px', padding: '12px 20px', textDecoration: 'none' }
