/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

type Lang = 'fr' | 'en'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
  lang?: Lang
}

const copy = (lang: Lang, siteName: string) =>
  lang === 'fr'
    ? {
        preview: `Réinitialise ton mot de passe pour ${siteName}`,
        h1: 'Nouveau mot de passe',
        body: `Nous avons reçu une demande de réinitialisation de ton mot de passe pour ${siteName}. Clique sur le bouton ci-dessous pour en choisir un nouveau.`,
        button: 'Choisir un nouveau mot de passe',
        footer: "Si tu n'as pas fait cette demande, tu peux ignorer cet email : ton mot de passe ne sera pas modifié.",
      }
    : {
        preview: `Reset your password for ${siteName}`,
        h1: 'Reset your password',
        body: `We received a request to reset your password for ${siteName}. Click the button below to choose a new password.`,
        button: 'Reset Password',
        footer: "If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.",
      }

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
  lang = 'fr',
}: RecoveryEmailProps) => {
  const t = copy(lang, siteName)
  return (
    <Html lang={lang} dir="ltr">
      <Head>
        <style>{darkModeCss}</style>
      </Head>
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{t.h1}</Heading>
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

export default RecoveryEmail

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
