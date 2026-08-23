import { useViaggi, useViaggioAttivo } from '@/hooks/useViaggi'
import { calcolaGiorniAlPartenza }     from '@/lib/viaggi-utils'
import type { ViaggioConStato }        from '@/types'

// ============================================================
// ROAMLY — usePianifica
// Orchestratore della schermata Pianifica.
// Deriva tutto da useViaggi() già in cache — nessuna query aggiuntiva.
// ============================================================

export function usePianifica() {
  const { data: viaggi, isLoading } = useViaggi()
  const { viaggio: viaggioAttivo }  = useViaggioAttivo()

  // Filtra e ordina i viaggi pianificati: data_inizio ASC (più vicino prima)
  const viaggiPianificati: ViaggioConStato[] = viaggi
    ? viaggi
        .filter((v) => v.stato_effettivo === 'pianificato')
        .sort((a, b) => (a.data_inizio ?? '').localeCompare(b.data_inizio ?? ''))
    : []

  // Il prossimo viaggio è il primo pianificato (già ordinato)
  const prossimoViaggio = viaggiPianificati[0] ?? null

  // Giorni al prossimo viaggio
  const giorniAlPartenza = prossimoViaggio?.data_inizio
    ? calcolaGiorniAlPartenza(prossimoViaggio.data_inizio)
    : null

  return {
    viaggiPianificati,
    prossimoViaggio,
    giorniAlPartenza,
    viaggioAttivo,
    isLoading,
  }
}
