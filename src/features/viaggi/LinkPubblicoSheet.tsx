import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Globe, Copy, Check, Share2, Eye, EyeOff, RefreshCw, X, ExternalLink } from 'lucide-react'
import { MoodIcon } from '@/components/ui/MoodIcon'
import { useCondivisione, useCondivisioneAzioni } from '@/hooks/useCondivisione'
import { useRicordi } from '@/hooks/useRicordi'
import { useToast } from '@/hooks/useToast'
import { urlPubblico } from '@/services/condivisioneService'

// ============================================================
// LinkPubblicoSheet — il proprietario attiva/disattiva la pagina
// pubblica del viaggio con un unico interruttore e può nascondere
// singoli ricordi. Fuori dal link: budget, documenti, prenotazioni,
// note e nomi dei compagni (non sono mai nel payload pubblico).
// ============================================================

interface Props {
  viaggioId: string
  nomeViaggio: string
  onClose: () => void
}

export function LinkPubblicoSheet({ viaggioId, nomeViaggio, onClose }: Props) {
  const { showSuccess } = useToast()
  const { data: cond, isLoading } = useCondivisione(viaggioId)
  const { data: ricordi = [] } = useRicordi(viaggioId)
  const { attiva, disattiva, rigenera, nascondi } = useCondivisioneAzioni(viaggioId)
  const [copiato, setCopiato] = useState(false)
  const [confermaRigenera, setConfermaRigenera] = useState(false)

  const attivo = !!cond?.attivo
  const link = cond ? urlPubblico(cond.token) : ''
  const nascosti = ricordi.filter((r) => r.nascosto_pubblico).length
  const lavora = attiva.isPending || disattiva.isPending || rigenera.isPending

  async function copia() {
    try {
      await navigator.clipboard.writeText(link)
      setCopiato(true)
      window.setTimeout(() => setCopiato(false), 2000)
    } catch { showSuccess('Copia il link a mano') }
  }

  async function condividi() {
    const testo = `Guarda il mio viaggio "${nomeViaggio}" su Roamly`
    try {
      if (navigator.share) await navigator.share({ title: nomeViaggio, text: testo, url: link })
      else await copia()
    } catch { /* annullato dall'utente */ }
  }

  return (
    <AnimatePresence>
      <motion.div key="bd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
      <motion.div key="panel" initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <div className="w-full max-w-[430px] bg-roamly-bg rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-roamly-g5 rounded-full" /></div>

          <div className="flex items-center justify-between px-5 pt-2 pb-3">
            <h2 className="font-lora text-xl font-semibold text-roamly-g0">Pagina pubblica</h2>
            <button onClick={onClose} aria-label="Chiudi"
              className="w-9 h-9 rounded-full bg-roamly-g6 flex items-center justify-center text-roamly-g1"><X size={18} /></button>
          </div>

          <div className="px-5 pb-8 flex flex-col gap-5">
            {/* Interruttore unico */}
            <button
              type="button" role="switch" aria-checked={attivo}
              disabled={isLoading || lavora}
              onClick={() => (attivo ? disattiva.mutate() : attiva.mutate())}
              className="flex items-center gap-3 p-4 rounded-2xl bg-white border border-roamly-g5 text-left disabled:opacity-60"
            >
              <div className="w-10 h-10 rounded-xl bg-roamly-g6 flex items-center justify-center shrink-0">
                <Globe size={18} className="text-roamly-g1" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-dm-sans text-sm font-semibold text-roamly-text">Mostra tutto il viaggio</p>
                <p className="font-dm-sans text-xs text-roamly-muted">
                  {attivo ? 'Chiunque abbia il link può vederlo, senza account.' : 'Ora è privato: lo vedi solo tu e chi invitato.'}
                </p>
              </div>
              <span className={`w-12 h-7 rounded-full p-0.5 transition-colors shrink-0 ${attivo ? 'bg-roamly-coral' : 'bg-roamly-g5'}`}>
                <span className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${attivo ? 'translate-x-5' : ''}`} />
              </span>
            </button>

            {attivo && cond && (
              <>
                {/* Link */}
                <div className="flex flex-col gap-2">
                  <div className="h-12 px-4 rounded-2xl bg-white border border-roamly-g5 flex items-center">
                    <span className="font-dm-mono text-xs text-roamly-ink-soft truncate">{link.replace(/^https?:\/\//, '')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={condividi}
                      className="h-12 rounded-2xl bg-roamly-coral text-white font-dm-sans font-semibold text-sm shadow-roamly-coral
                        inline-flex items-center justify-center gap-2 active:scale-[0.98]">
                      <Share2 size={16} /> Condividi
                    </button>
                    <button onClick={copia}
                      className="h-12 rounded-2xl bg-white border border-roamly-g5 text-roamly-ink font-dm-sans font-medium text-sm
                        inline-flex items-center justify-center gap-2 active:scale-[0.98]">
                      {copiato ? <Check size={16} /> : <Copy size={16} />} {copiato ? 'Copiato' : 'Copia link'}
                    </button>
                  </div>
                  <a href={link} target="_blank" rel="noreferrer"
                    className="self-start inline-flex items-center gap-1 font-dm-sans text-xs text-roamly-g2 font-medium">
                    <ExternalLink size={12} /> Guarda come lo vedono gli altri
                  </a>
                </div>

                {/* Ricordi */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-roamly-ink-soft">Cosa si vede</h3>
                    <span className="font-dm-sans text-xs text-roamly-muted">
                      {nascosti === 0 ? 'Tutti i ricordi' : `${nascosti} nascost${nascosti === 1 ? 'o' : 'i'}`}
                    </span>
                  </div>
                  {ricordi.length === 0 ? (
                    <p className="font-dm-sans text-sm text-roamly-muted">Non ci sono ancora ricordi.</p>
                  ) : (
                    <div className="bg-white rounded-2xl border border-roamly-g5 divide-y divide-roamly-g6">
                      {ricordi.map((r) => {
                        const puoi = true // proprietario: il database verifica comunque i permessi
                        return (
                          <div key={r.id} className="flex items-center gap-3 px-3.5 py-2.5">
                            <MoodIcon mood={r.mood} size={28} />
                            <span className={`flex-1 min-w-0 font-dm-sans text-sm truncate ${r.nascosto_pubblico ? 'text-roamly-muted line-through' : 'text-roamly-text'}`}>
                              {r.titolo}
                            </span>
                            <button
                              type="button" disabled={!puoi || nascondi.isPending}
                              onClick={() => nascondi.mutate({ ricordoId: r.id, nascosto: !r.nascosto_pubblico })}
                              aria-label={r.nascosto_pubblico ? `Mostra ${r.titolo}` : `Nascondi ${r.titolo}`}
                              className="w-9 h-9 rounded-full flex items-center justify-center text-roamly-g2 disabled:opacity-40"
                            >
                              {r.nascosto_pubblico ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <p className="font-dm-sans text-[11px] text-roamly-muted leading-relaxed">
                    Non compaiono mai: budget, documenti, prenotazioni, note e i nomi dei compagni.
                  </p>
                </div>

                {/* Nuovo indirizzo */}
                <div className="pt-1">
                  {confermaRigenera ? (
                    <div className="flex flex-col gap-2 p-3 rounded-2xl bg-white border border-roamly-g5">
                      <p className="font-dm-sans text-xs text-roamly-ink-soft">Il link attuale smetterà di funzionare. Continuare?</p>
                      <div className="flex gap-2">
                        <button onClick={() => setConfermaRigenera(false)} className="flex-1 h-10 rounded-xl bg-roamly-g6 font-dm-sans text-sm text-roamly-g1">Annulla</button>
                        <button onClick={() => { rigenera.mutate(); setConfermaRigenera(false) }}
                          className="flex-1 h-10 rounded-xl bg-roamly-g0 font-dm-sans text-sm text-white">Nuovo link</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setConfermaRigenera(true)}
                      className="inline-flex items-center gap-1.5 font-dm-sans text-xs text-roamly-muted">
                      <RefreshCw size={12} /> Crea un nuovo indirizzo (invalida quello vecchio)
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
