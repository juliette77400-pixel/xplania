# Xplania

Xplania est un copilote de voyage intelligent qui accompagne le voyageur avant, pendant et après son séjour.

## Dépôt et synchronisation

- Dépôt GitHub : https://github.com/juliette77400-pixel/xplania
- Branche principale : `main`
- Gestionnaire de dépendances : Bun
- Backend : Supabase, projet `alhhvpqtskymltokcgov`
- Interface : React, TypeScript, Vite, Tailwind CSS et shadcn/ui

Le projet Lovable doit être connecté à ce dépôt GitHub et à la branche `main`. Un push sur `main` rend les changements récupérables par Lovable. Les fichiers `.lovable/`, `supabase/`, `bun.lock` et la configuration Vite doivent rester versionnés.

## Installation locale

Prérequis : Bun 1.3.14 ou Node.js 20 minimum.

```sh
git clone https://github.com/juliette77400-pixel/xplania.git
cd xplania
cp .env.example .env
bun install --frozen-lockfile
bun run dev
```

## Variables d'environnement

Variables publiques utilisées par Vite :

| Variable | Usage |
| --- | --- |
| `VITE_SUPABASE_PROJECT_ID` | Identifiant du projet Supabase |
| `VITE_SUPABASE_URL` | URL publique Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique destinée au navigateur |

Copier `.env.example` vers `.env`, puis renseigner les valeurs locales. Le fichier `.env` ne doit jamais être commité.

Secrets attendus par certaines Edge Functions Supabase :

- `LOVABLE_API_KEY`
- `OPENWEATHER_API_KEY`
- `RESEND_API_KEY`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`
- `UNSPLASH_ACCESS_KEY`

Ces secrets doivent être configurés dans Lovable Cloud ou Supabase Secrets. Ils ne doivent jamais être placés dans `.env.example`, dans une variable `VITE_*` ou dans Git.

## Vérifications

```sh
bun run build
bun run test
bun run lint
```

## Déploiement

1. Valider les vérifications locales.
2. Pousser la branche `main` sur GitHub.
3. Vérifier dans Lovable que le dépôt et la branche `main` sont sélectionnés.
4. Laisser Lovable récupérer le commit, puis utiliser **Share → Publish**.

Les migrations et fonctions Supabase sont conservées dans `supabase/`. Toute modification de schéma doit être ajoutée sous forme de migration versionnée.
