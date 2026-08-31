import { useParams } from 'react-router-dom'
import { useState } from 'react'
import { Crown, UserPlus, LogOut, X } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { Button }       from '@/components/ui/Button'
import { useAuth }      from '@/hooks/useAuth'
import { useViaggio }   from '@/hooks/useViaggi'
import { useMioRuolo, useMembriViaggio, useRimuoviMembro } from '@/hooks/useMembri'
import { useInvitoLink } from '@/hooks/useInviti'
import type { MembroConProfilo } from '@/services/membriService'

// ============================================================
// MembriPage — /viaggi/:id/membri
// Chi c'è nel viaggio. Il proprietario può rimuovere collaboratori
// e invitarne altri; chiunque può uscire dal viaggio (tranne
// l'ultimo proprietario, che deve prima passare la mano o eliminare
// il viaggio — non gestito qui, solo lettura + rimozione singola).
// ============================================================

function formatData(iso: string): string {
  return new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })
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
  const { rimuovi, isLoading: isRimuovendo } = useRimuoviMembro(viaggioId ?? '')
  const { condividi: condividiInvito, isLoading: isInvitando } = useInvitoLink(viaggioId ?? '', viaggio?.nome ?? '')

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
        <PageHeader title="Membri" subtitle={viaggio?.nome} variant="withBack" />

        <div className="flex-1 px-5 pb-8 flex flex-col gap-5">

          {sonoProprietario && (
            <Button
              variant="ghost"
              onClick={condividiInvito}
              isLoading={isInvitando}
              fullWidth
              className="border border-dashed border-roamly-g5 text-roamly-g2"
            >
              <UserPlus size={16} className="mr-1.5" />
              Invita altre persone
            </Button>
          )}

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
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-roamly"
                  >
                    {m.avatar_url ? (
                      <img src={m.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-roamly-g0 flex items-center justify-center shrink-0">
                        <span className="font-lora text-sm font-semibold text-white">
                          {iniziali(m.display_name)}
                        </span>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <p className="font-dm-sans text-sm font-medium text-roamly-g0 truncate">
                        {m.display_name ?? 'Utente Roamly'}{sonoIo && ' (tu)'}
                      </p>
                      <p className="font-dm-sans text-xs text-roamly-text/40">
                        Da {formatData(m.joined_at)}
                      </p>
                    </div>

                    {m.ruolo === 'proprietario' ? (
                      <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-roamly-g6 shrink-0">
                        <Crown size={11} className="text-roamly-g2" />
                        <span className="font-dm-sans text-[10px] font-medium text-roamly-g2">
                          Proprietario
                        </span>
                      </span>
                    ) : sonoProprietario ? (
                      <button
                        onClick={() => setConfermaRimozione(m)}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-roamly-text/30 hover:bg-red-50 hover:text-red-500 shrink-0"
                        aria-label="Rimuovi"
                      >
                        <X size={15} />
                      </button>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}

          {/* Esci dal viaggio — chiunque, tranne il flusso di rimozione altrui */}
          {!confermaUscita ? (
            <button
              onClick={() => setConfermaUscita(true)}
              className="flex items-center justify-center gap-1.5 py-3 mt-2 font-dm-sans text-sm text-red-500/70 hover:text-red-500"
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
              <p className="font-dm-sans text-sm text-roamly-text/50">
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
