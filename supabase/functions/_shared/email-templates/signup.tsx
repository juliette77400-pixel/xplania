/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

type Lang = 'fr' | 'en'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
  lang?: Lang
}

const copy = (lang: Lang, siteName: string, recipient: string, siteUrl: string) =>
  lang === 'fr'
    ? {
        preview: `Confirme ton adresse email pour ${siteName}`,
        h1: 'Confirme ton adresse email',
        intro: (
          <>
            Merci de t&apos;être inscrit·e à{' '}
            <Link href={siteUrl} style={link}>
              <strong>{siteName}</strong>
            </Link>{' '}
            !
          </>
        ),
        body: (
          <>
            Confirme ton adresse email (
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>
            ) en cliquant sur le bouton ci-dessous :
          </>
        ),
        button: 'Confirmer mon email',
        footer: "Si tu n'as pas créé de compte, tu peux ignorer cet email sans risque.",
      }
    : {
        preview: `Confirm your email for ${siteName}`,
        h1: 'Confirm your email',
        intro: (
          <>
            Thanks for signing up for{' '}
            <strong>{siteName}</strong>!
          </>
        ),
        body: (
          <>
            Please confirm your email address (
            <Link href={`mailto:${recipient}`} style={link}>
              {recipient}
            </Link>
            ) by clicking the button below:
          </>
        ),
        button: 'Verify Email',
        footer: "If you didn't create an account, you can safely ignore this email.",
      }

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
  lang = 'fr',
}: SignupEmailProps) => {
  const t = copy(lang, siteName, recipient, siteUrl)
  return (
    <Html lang={lang} dir="ltr">
      <Head>
        <style>{darkModeCss}</style>
      </Head>
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{t.h1}</Heading>
          <Text style={text}>{t.intro}</Text>
          <Text style={text}>{t.body}</Text>
          <Button className="dm-btn" style={button} href={confirmationUrl}>
            {t.button}
          </Button>
          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#000000',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: '#000000',
  color: '#ffffff',
  fontSize: '14px',
  border: '1px solid #000000',
  borderRadius: '8px',
  padding: '12px 20px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
  }
  [data-ogsc] .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
  [data-ogsb] .dm-btn { background-color: #ffffff !important; color: #000000 !important; }
`
