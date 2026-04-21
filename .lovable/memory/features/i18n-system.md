---
name: i18n internationalization
description: react-i18next FR/EN switcher, locales in src/i18n/locales/, persisted in localStorage as xplania-lang. NO Google Translate.
type: feature
---
- Library: react-i18next + i18next-browser-languagedetector
- Init file: src/i18n/index.ts (imported in main.tsx)
- Locales: src/i18n/locales/{fr,en}.json — keep keys in sync between files
- Default lang: FR (fallback). Detection order: localStorage → navigator
- Switcher component: src/components/shared/LanguageSwitcher.tsx (Globe icon + flag + lang code, dropdown FR/EN ONLY)
- Google Translate has been REMOVED — unreliable, broke layouts. Use only native i18n.
- Use `useTranslation()` hook in components: `const { t } = useTranslation()`
- For HTML in strings (e.g. <strong>), use `<Trans>` component with `components` prop and indexed placeholders like <1></1>
- Number/date/currency formatting: use `i18n.language.startsWith("fr") ? "fr-FR" : "en-US"` + Intl APIs
- Translated so far: Navbar, Hero, Features, HowItWorks, Benefits, Beta, Dashboard, Footer, WaitlistDialog, FeedbackDialog, OnboardingDialog, Auth, ResetPassword, Profil, Offres, NotFound, Index, ModuleNavbar, QuotaBanner, UpgradeDialog
- Still to translate (next waves): Carnet, Suivi, Mood, Discover, Explore pages + budget/valise/visa/discover/mood/tracking/journal/explore subcomponents
- AI Edge Functions accept `locale` param: travel-recommendations, visa-info, mood-recommend, journal-story
