import { supabase } from '@/lib/supabase'
import { STORAGE_BUCKETS } from '@/types'

// ============================================================
// esportaDatiService — copia dei dati dell'utente (GDPR, portabilità).
//
// Legge, con le stesse regole di accesso dell'app (RLS), tutto ciò che
// l'utente può vedere nelle tabelle di Roamly e lo restituisce come un
// unico oggetto JSON. Le foto e i documenti non vengono incorporati:
// per ciascuno si include un link di download valido 7 giorni.
// Se una tabella non si legge, l'esportazione continua e l'errore è
// indicato nel file (`errori`), così non si perde il resto.
// ============================================================

const LINK_VALIDITA_SECONDI = 60 * 60 * 24 * 7

// Tabelle dell'utente / dei suoi viaggi, nell'ordine in cui compaiono nel file.
const TABELLE = [
  'profili', 'viaggi', 'viaggio_membri', 'ricordi', 'foto', 'tappe_viaggio',
  'tappe_nascoste', 'note_viaggio', 'checklist_items', 'budget_voci',
  'budget_pagamenti', 'attivita', 'luoghi_salvati', 'documenti_wallet',
  'wallet', 'reazioni_ricordo', 'user_badges', 'transazioni_crediti',
] as const

type Riga = Record<string, unknown>

async function linkFile(bucket: string, righe: Riga[]): Promise<void> {
  await Promise.all(
    righe.map(async (r) => {
      const path = typeof r.path === 'string' ? r.path : null
      if (!path) return
      const { data } = await supabase.storage.from(bucket).createSignedUrl(path, LINK_VALIDITA_SECONDI)
      if (data?.signedUrl) r.link_download = data.signedUrl
    }),
  )
}

export async function esportaDatiUtente(userId: string, email: string | undefined) {
  const dati: Record<string, Riga[]> = {}
  const errori: Record<string, string> = {}

  for (const tabella of TABELLE) {
    const { data, error } = await supabase.from(tabella).select('*')
    if (error) errori[tabella] = error.message
    else dati[tabella] = (data ?? []) as Riga[]
  }

  if (dati.foto) await linkFile(STORAGE_BUCKETS.FOTO_RICORDI, dati.foto)
  if (dati.documenti_wallet) await linkFile(STORAGE_BUCKETS.DOCUMENTI_WALLET, dati.documenti_wallet)

  return {
    app: 'Roamly',
    esportato_il: new Date().toISOString(),
    utente: { id: userId, email: email ?? null },
    nota: `I link "link_download" di foto e documenti restano validi 7 giorni. Gli stessi dati sono sempre scaricabili dall'app.`,
    dati,
    ...(Object.keys(errori).length ? { errori } : {}),
  }
}

// Scarica l'oggetto come file .json dal browser.
export function scaricaJson(nomeFile: string, contenuto: unknown): void {
  const blob = new Blob([JSON.stringify(contenuto, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nomeFile
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
