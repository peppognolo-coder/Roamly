# Roamly

**Conserva ogni viaggio. Rivivilo quando vuoi.**

Premium Travel Memory Book — PWA React + TypeScript + Supabase

---

## Setup Sprint 0

### 1. Clona e installa

```bash
git clone https://github.com/tuo-username/roamly.git
cd roamly
npm install
```

### 2. Configura le variabili d'ambiente

```bash
cp .env.example .env.local
```

Inserisci in `.env.local`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Configura Supabase

1. Crea un progetto su [supabase.com](https://supabase.com)
2. Vai su **SQL Editor** ed esegui integralmente `supabase-schema-v1.sql`
3. Vai su **Authentication → Providers** e abilita Google OAuth
4. Aggiungi il redirect URL: `https://tuo-sito.netlify.app`
5. Vai su **Storage** e crea i bucket:
   - `ricordi-foto` (privato)
   - `profili-avatar` (pubblico)

### 4. Avvia in locale

```bash
npm run dev
```

### 5. Deploy su Netlify

1. Connetti il repo GitHub a Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Aggiungi le variabili d'ambiente su Netlify

---

## Stack

| Layer | Tecnologia |
|---|---|
| UI | React 18 + TypeScript |
| Stile | Tailwind CSS |
| Routing | React Router v6 |
| Stato server | TanStack Query v5 |
| Stato client | Zustand |
| Form | React Hook Form + Zod |
| Animazioni | Framer Motion |
| Backend | Supabase (Auth + DB + Storage) |
| PWA | vite-plugin-pwa + Workbox |
| Deploy | Netlify |

---

## Struttura

```
src/
├── app/          # Router, provider, App root
├── components/   # UI primitivi (Button, Card, Input, Layout)
├── features/     # Schermate per feature (auth, home, viaggi...)
├── hooks/        # Hook globali (useAuth)
├── lib/          # Supabase client, utility functions
├── services/     # Chiamate a Supabase (mai nei componenti)
├── store/        # Zustand stores
├── styles/       # CSS globale, design tokens
└── types/        # TypeScript types condivisi
```

---

## Sprint Plan

| Sprint | Feature | Stato |
|---|---|---|
| S0 | Fondamenta | ✅ Completato |
| S1 | Auth + Profilo | ⏳ Prossimo |
| S2 | Viaggi | — |
| S3 | Momenti | — |
| S4 | Diario | — |
| S5 | Home | — |
| S6 | Pianifica | — |
| S7 | Profilo completo | — |
| S8 | PWA + Polish | — |
