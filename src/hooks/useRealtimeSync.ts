import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// ============================================================
// ROAMLY — useRealtimeSync
// Sottoscrive i cambi Postgres (insert/update/delete) su una
// tabella, filtrati per un valore di colonna (tipicamente
// viaggio_id), e invalida le query React Query indicate quando
// qualcosa cambia — così un collaboratore vede in automatico
// quello che aggiunge/modifica un altro membro dello stesso
// viaggio, senza ricaricare manualmente.
//
// Approccio "invalidazione", non "merge manuale del payload":
// più semplice e robusto — un fetch in più per ogni cambio, ma
// zero rischio di cache disallineata o duplicati.
//
// Richiede che la tabella sia stata aggiunta alla pubblicazione
// supabase_realtime (vedi supabase-migration-collaborazione-m5.sql).
// ============================================================

export function useRealtimeSync(
  table: string,
  filterColumn: string,
  filterValue: string | undefined,
  queryKeysToInvalidate: readonly QueryKey[]
) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!filterValue) return

    const channel = supabase
      .channel(`realtime:${table}:${filterColumn}:${filterValue}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        () => {
          queryKeysToInvalidate.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key })
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filterColumn, filterValue])
}
