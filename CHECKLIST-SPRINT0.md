# Roamly — Checklist di Validazione Sprint 0

Da eseguire integralmente prima di dichiarare Sprint 0 completato
e prima di iniziare Sprint 1.
Ogni punto deve essere verificato manualmente.

---

## 1. Setup Locale

- [ ] `npm install` completa senza errori né warning critici
- [ ] `npm run build` completa senza errori TypeScript
- [ ] `npm run dev` avvia il server su `localhost:5173` senza errori in console
- [ ] Nessun errore rosso in console del browser all'avvio
- [ ] Le variabili `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` sono in `.env.local`
- [ ] Il file `.env.local` NON è committato su GitHub (verificare `.gitignore`)

---

## 2. Design System

- [ ] Il font **Lora** è caricato e visibile nei titoli (es. "Home", "Diario")
- [ ] Il font **DM Sans** è caricato e visibile nel corpo testo
- [ ] Il font **DM Mono** è caricato (verificabile in `ViaggioDetailPage` — mostra l'UUID)
- [ ] Il background dell'app è `#FAFAF7` (roamly-bg), non bianco puro
- [ ] Il colore testo è `#1C2B27` (roamly-text)
- [ ] I colori Tailwind personalizzati funzionano (es. `bg-roamly-g0` sul FAB è `#04342C`)

---

## 3. Navigazione

- [ ] La **BottomNav** è visibile su tutte le schermate protette
- [ ] La BottomNav è fissa in basso e non scorre con il contenuto
- [ ] Il link **Home** (`/`) è attivo sulla schermata Home
- [ ] Il link **Diario** (`/diario`) naviga correttamente
- [ ] Il link **Pianifica** (`/pianifica`) naviga correttamente
- [ ] Il link **Profilo** (`/profilo`) naviga correttamente
- [ ] L'active state della nav mostra il colore `roamly-g1` sulla voce corrente
- [ ] Le voci inattive hanno opacità ridotta (non stesso colore dell'attiva)
- [ ] Il **FAB** è visibile al centro della BottomNav, leggermente elevato
- [ ] Il FAB naviga a `/nuovo-ricordo` al tap
- [ ] Il `max-width: 430px` è rispettato — su desktop il contenuto è centrato

---

## 4. Route e Protezione

- [ ] Accedere a `/` senza sessione reindirizza a `/login`
- [ ] Accedere a `/diario` senza sessione reindirizza a `/login`
- [ ] Accedere a `/nuovo-ricordo` senza sessione reindirizza a `/login`
- [ ] Accedere a `/pianifica` senza sessione reindirizza a `/login`
- [ ] Accedere a `/profilo` senza sessione reindirizza a `/login`
- [ ] Accedere a `/viaggi` senza sessione reindirizza a `/login`
- [ ] Accedere a `/viaggi/test-uuid` senza sessione reindirizza a `/login`
- [ ] La route `/login` è accessibile senza sessione e mostra `AuthPage`
- [ ] Durante il caricamento della sessione (`isLoading: true`) appare lo spinner — non un redirect prematuro

---

## 5. Supabase

- [ ] Il progetto Supabase è stato creato
- [ ] `supabase-schema-v1.sql` è stato eseguito integralmente nell'SQL Editor
- [ ] Nessun errore nell'esecuzione dello schema SQL
- [ ] Le tabelle esistono: `profili`, `viaggi`, `ricordi`, `checklist_items`, `badges`, `user_badges`, `wallet`, `budget_voci`, `attivita`, `shared_content`
- [ ] RLS è **abilitata** su: `profili`, `viaggi`, `ricordi`, `checklist_items`, `badges`, `user_badges`, `budget_voci`, `wallet`
- [ ] Il trigger `on_auth_user_created` esiste in **Database → Functions**
- [ ] Il constraint `mood_check` esiste sulla tabella `ricordi`
- [ ] Il constraint `stato_check` esiste sulla tabella `viaggi`
- [ ] Il constraint `date_check` esiste sulla tabella `viaggi`
- [ ] Il bucket `ricordi-foto` esiste in Storage (privato)
- [ ] Il bucket `profili-avatar` esiste in Storage (pubblico in lettura)
- [ ] Google OAuth è abilitato in **Authentication → Providers**
- [ ] Il redirect URL di Netlify è configurato in **Authentication → URL Configuration**
- [ ] Il client Supabase si connette senza errori (nessun 401/403 in console)

---

## 6. React Query Devtools

- [ ] In `localhost:5173` appare il pulsante React Query Devtools (angolo in basso a sinistra)
- [ ] I Devtools si aprono al click senza errori
- [ ] In `npm run build` i Devtools NON compaiono nel bundle di produzione
  - Verifica: `grep -r "ReactQueryDevtools" dist/` → deve essere vuoto

---

## 7. TypeScript

- [ ] `npm run build` non produce errori TypeScript
- [ ] Nessun `any` esplicito nei file di Sprint 0
- [ ] I path alias (`@/`) funzionano: nessun errore di import non risolto
- [ ] Il file `src/types/index.ts` esporta correttamente:
  - [ ] `Mood` (union type, 5 valori)
  - [ ] `StatoViaggio` (union type, 3 valori)
  - [ ] `TipoRicordo` (union type, 3 valori)
  - [ ] `Profilo`
  - [ ] `Viaggio`, `ViaggioConStato`, `NuovoViaggio`, `ModificaViaggio`
  - [ ] `Ricordo`, `NuovoRicordo`, `ModificaRicordo`
  - [ ] `ChecklistItem`, `NuovoChecklistItem`
  - [ ] `Badge`, `UserBadge`
  - [ ] `StatisticheUtente`
  - [ ] `MoodOption`, `MOOD_OPTIONS`

---

## 8. Query Keys

- [ ] Il file `src/lib/queryKeys.ts` è presente
- [ ] `queryKeys.profilo.detail(id)` restituisce un array con 2 elementi
- [ ] `queryKeys.viaggi.all` è `['viaggi']`
- [ ] `queryKeys.ricordi.byViaggio(id)` include il `viaggioId`
- [ ] `queryKeys.statistiche.utente(id)` include lo `userId`
- [ ] Tutte le sezioni MVP sono coperte: profilo, viaggi, ricordi, checklist, statistiche, badges

---

## 9. GitHub e Netlify

- [ ] Il repository GitHub esiste ed è privato
- [ ] Il push iniziale su `main` è stato eseguito
- [ ] Il file `.env.local` NON appare nel repository remoto
- [ ] Netlify è connesso al repository GitHub
- [ ] Le variabili d'ambiente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` sono configurate su Netlify
- [ ] Il primo deploy su Netlify è andato a buon fine (build verde)
- [ ] L'URL Netlify carica l'app senza errori
- [ ] Un secondo push su `main` trigghera automaticamente un nuovo deploy
- [ ] `netlify.toml` è presente e il redirect SPA funziona:
  - Accedere direttamente a `https://tuo-sito.netlify.app/diario` non restituisce 404

---

## 10. Struttura File

- [ ] La struttura `src/` rispetta l'architettura concordata
- [ ] Nessuna chiamata diretta a `supabase` fuori da `src/lib/supabase.ts` nei file di Sprint 0
- [ ] `src/services/` esiste come cartella (vuota — sarà popolata da Sprint 1)
- [ ] `src/app/App.tsx` contiene solo la configurazione dei provider — nessuna logica di business

---

## 11. Verifica Mobile (opzionale ma consigliata)

- [ ] Aprire l'URL Netlify su iPhone — layout non supera 430px
- [ ] La BottomNav non viene coperta dalla home bar di iOS (safe area)
- [ ] Il FAB è facilmente cliccabile con il pollice
- [ ] I font sono leggibili su schermo mobile
- [ ] Nessun elemento fuoriesce orizzontalmente (no scroll orizzontale)

---

## Risultato

| Sezione | Stato |
|---|---|
| 1. Setup Locale | ⏳ |
| 2. Design System | ⏳ |
| 3. Navigazione | ⏳ |
| 4. Route e Protezione | ⏳ |
| 5. Supabase | ⏳ |
| 6. React Query Devtools | ⏳ |
| 7. TypeScript | ⏳ |
| 8. Query Keys | ⏳ |
| 9. GitHub e Netlify | ⏳ |
| 10. Struttura File | ⏳ |
| 11. Verifica Mobile | ⏳ |

**Sprint 0 può essere dichiarato completato solo quando tutte le sezioni sono ✅.**
