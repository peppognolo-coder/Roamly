import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Check, Copy, LogOut, X } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { Button }       from '@/components/ui/Button'
import { useAuth }      from '@/hooks/useAuth'
import { useViaggio }   from '@/hooks/useViaggi'
import { useMioRuolo, useMembriViaggio, useRimuoviMembro } from '@/hooks/useMembri'
import { useInvitoCard } from '@/hooks/useInviti'
import { useRealtimeSync } from '@/hooks/useRealtimeSync'
import { queryKeys } from '@/lib/queryKeys'
import { coloreIniziale } from '@/lib/avatar-utils'
import type { MembroConProfilo } from '@/services/membriService'

// ============================================================
// MembriPage — /viaggi/:id/membri ("Chi c'è" nel mockup)
// Chi c'è nel viaggio. Il proprietario può rimuovere collaboratori
// e invitarne altri con un link condivisibile (valido 7 giorni, non
// a uso singolo — non c'è tracciamento di inviti per email/persona);
// chiunque può uscire dal viaggio (tranne l'ultimo proprietario, che
// deve prima passare la mano o eliminare il viaggio — non gestito
// qui, solo lettura + rimozione singola).
// ============================================================

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
}

function iniziali(nome: string | null): string {
  if (!nome) return '?'
  return nome.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export function MembriPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: viaggio } = useViaggio(viaggioId)
  const { data: mioRuolo } = useMioRuolo(viaggioId)
  const { data: membri = [], isLoading } = useMembriViaggio(viaggioId)

  useRealtimeSync('viaggio_membri', 'viaggio_id', viaggioId, [queryKeys.membri.byViaggio(viaggioId ?? '')])
  const { rimuovi, isLoading: isRimuovendo } = useRimuoviMembro(viaggioId ?? '')
  const { url: linkInvito, copia: copiaLink, copiato, isLoading: isCaricandoLink } = useInvitoCard(viaggioId ?? '')

  const [confermaRimozione, setConfermaRimozione] = useState<MembroConProfilo | null>(null)
  const [confermaUscita, setConfermaUscita] = useState(false)

  const sonoProprietario = mioRuolo === 'proprietario'

  function handleConfermaRimozione() {
    if (!confermaRimozione) return
    rimuovi(confermaRimozione.user_id)
    setConfermaRimozione(null)
  }

  function handleConfermaUscita() {
    if (!user) return
    rimuovi(user.id, true)
    setConfermaUscita(false)
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Chi c'è" eyebrow={viaggio?.nome} variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-3.5">

          {/* Membri */}
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-white rounded-2xl shadow-roamly animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {membri.map((m) => {
                const sonoIo = m.user_id === user?.id
                const nome = m.display_name ?? 'Utente Roamly'
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3.5 p-3.5 bg-white rounded-2xl shadow-roamly"
                  >
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-[42px] h-[42px] rounded-full object-cover shrink-0" />
                    ) : (
                      <div
                        className="w-[42px] h-[42px] rounded-full flex items-center justify-center shrink-0"
                        style={{ background: coloreIniziale(nome) }}
                      >
                        <span className="font-lora text-sm font-semibold text-white">
                          {iniziali(m.display_name)}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-dm-sans text-[13.5px] font-medium text-roamly-g0 truncate">
                        {sonoIo ? `${nome} (tu)` : nome}
                      </p>
                      <p className="font-dm-sans text-[11px] text-roamly-g2 mt-0.5">
                        Dal {formatData(m.joined_at)}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 px-2.5 py-1 rounded-full font-dm-sans text-[10px] font-medium ${
                        m.ruolo === 'proprietario'
                          ? 'bg-roamly-g6 text-roamly-g1'
                          : 'bg-roamly-text/5 text-roamly-text/45'
                      }`}
                    >
                      {m.ruolo === 'proprietario' ? 'Proprietario' : 'Collabora'}
                    </span>

                    {sonoProprietario && m.ruolo !== 'proprietario' && (
                      <button
                        onClick={() => setConfermaRimozione(m)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-roamly-text/25 hover:bg-red-50 hover:text-red-500 shrink-0"
                        aria-label="Rimuovi"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Invita chi manca */}
          {sonoProprietario && (
            <div className="p-4 rounded-[18px] border border-dashed border-roamly-g5 bg-roamly-g7">
              <p className="font-lora text-sm font-semibold text-roamly-g0">
                Invita chi manca
              </p>
              <p className="font-dm-sans text-[11.5px] text-roamly-g2 leading-relaxed mt-1.5 mb-3">
                Il link resta valido 7 giorni. Chi entra può aggiungere tappe, spese e ricordi.
              </p>
              <div className="flex items-center gap-2">
                <span className="flex-1 min-w-0 px-3.5 py-2.5 rounded-xl bg-white border border-roamly-g5/90 font-dm-mono text-[11px] text-roamly-g2 truncate">
                  {isCaricandoLink ? 'Genero il link…' : linkInvito?.replace(/^https?:\/\//, '')}
                </span>
                <button
                  onClick={copiaLink}
                  disabled={isCaricandoLink}
                  className={`
                    shrink-0 flex items-center gap-1.5 h-10 px-4 rounded-xl
                    font-dm-sans text-xs font-medium
                    transition-all duration-150 disabled:opacity-50
                    ${copiato ? 'bg-roamly-g6 text-roamly-g1' : 'bg-roamly-g0 text-white hover:bg-roamly-g1'}
                  `}
                >
                  {copiato ? <Check size={13} /> : <Copy size={13} />}
                  {copiato ? 'Copiato' : 'Copia'}
                </button>
              </div>
            </div>
          )}

          {/* Esci dal viaggio — chiunque, tranne il flusso di rimozione altrui */}
          {!confermaUscita ? (
            <button
              onClick={() => setConfermaUscita(true)}
              className="flex items-center justify-center gap-1.5 py-3 mt-1 font-dm-sans text-sm text-red-500/70 hover:text-red-500"
            >
              <LogOut size={14} />
              Esci dal viaggio
            </button>
          ) : (
            <div className="flex flex-col gap-2 bg-red-50 rounded-2xl p-4">
              <p className="font-dm-sans text-sm font-medium text-red-600">
                {sonoProprietario && membri.length > 1
                  ? 'Uscendo, la proprietà passerà automaticamente al collaboratore più anziano.'
                  : 'Sei sicuro di voler uscire da questo viaggio?'}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setConfermaUscita(false)} className="flex-1">
                  Annulla
                </Button>
                <Button
                  onClick={handleConfermaUscita}
                  isLoading={isRimuovendo}
                  className="flex-1 !bg-red-500 hover:!bg-red-600"
                >
                  Esci
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Conferma rimozione di un collaboratore */}
        {confermaRimozione && (
          <div className="fixed inset-0 bg-roamly-g0/40 backdrop-blur-sm z-50 flex items-center justify-center px-6">
            <div className="w-full max-w-mobile bg-white rounded-3xl p-6 flex flex-col gap-3">
              <p className="font-lora text-base font-semibold text-roamly-g0">
                Rimuovere {confermaRimozione.display_name ?? 'questo membro'}?
              </p>
              <p className="font-dm-sans text-sm text-roamly-g2">
                Non avrà più accesso al viaggio. I contenuti che ha già aggiunto resteranno.
              </p>
              <div className="flex gap-2 mt-2">
                <Button variant="ghost" onClick={() => setConfermaRimozione(null)} className="flex-1">
                  Annulla
                </Button>
                <Button
                  onClick={handleConfermaRimozione}
                  isLoading={isRimuovendo}
                  className="flex-1 !bg-red-500 hover:!bg-red-600"
                >
                  Rimuovi
                </Button>
              </div>
            </div>
          </div>
        )}

      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
