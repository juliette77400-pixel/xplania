---
name: i18n internationalization
description: react-i18next setup with FR/EN switcher, locales in src/i18n/locales/, persisted in localStorage as xplania-lang
type: feature
---
- Library: react-i18next + i18next-browser-languagedetector
- Init file: src/i18n/index.ts (imported in main.tsx)
- Locales: src/i18n/locales/{fr,en}.json — keep keys in sync between files
- Default lang: FR (fallback). Detection order: localStorage → navigator
- Switcher component: src/components/shared/LanguageSwitcher.tsx (Globe icon + flag + lang code, dropdown FR/EN)
- Use `useTranslation()` hook in components: `const { t } = useTranslation()`
- For HTML in strings (e.g. <strong>), use `<Trans>` component with `components` prop
- Number/date formatting: use `i18n.language.startsWith("fr") ? "fr-FR" : "en-US"`
- Vague 1 done: Navbar, Hero, Features, HowItWorks, Benefits, Beta, Dashboard, Footer, WaitlistDialog, FeedbackDialog, OnboardingDialog
- Vagues à venir: dashboard pages + 3 guides, then Carnet/Suivi/Mood/Discover, then Auth/Profil/Offres + Edge Functions AI prompts (pass `locale` from client)
