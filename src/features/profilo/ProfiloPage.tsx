import { useNavigate } from 'react-router-dom'
import {
  UserCog, BarChart3, Trophy, HelpCircle, Info, ChevronRight, Clock, Bell,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import { useProfilo }   from '@/hooks/useProfilo'
import { useAuth }      from '@/hooks/useAuth'

// ============================================================
// ProfiloPage — hub con le funzionalità della persona.
// Il vecchio contenuto (nome/email/logout/elimina account) vive
// ora in ImpostazioniAccountPage, raggiungibile da qui.
// ============================================================

interface VoceHub {
  id: string
  label: string
  descrizione: string
  icon: LucideIcon
  path?: string   // assente = non ancora disponibile
}

const VOCI: VoceHub[] = [
  {
    id: 'impostazioni',
    label: 'Impostazioni account',
    descrizione: 'Foto, nome, bio e sicurezza',
    icon: UserCog,
    path: '/profilo/impostazioni',
  },
  {
    id: 'statistiche',
    label: 'Le tue statistiche',
    descrizione: 'Viaggi, ricordi e paesi visitati',
    icon: BarChart3,
    path: '/profilo/statistiche',
  },
  {
    id: 'notifiche',
    label: 'Notifiche',
    descrizione: 'Promemoria per le tue prenotazioni',
    icon: Bell,
    path: '/profilo/notifiche',
  },
  {
    id: 'traguardi',
    label: 'I tuoi traguardi',
    descrizione: 'Badge e obiettivi raggiunti',
    icon: Trophy,
  },
  {
    id: 'aiuto',
    label: 'Aiuto e supporto',
    descrizione: 'Domande frequenti, contatti',
    icon: HelpCircle,
  },
  {
    id: 'info',
    label: 'Informazioni su Roamly',
    descrizione: 'Versione app e crediti',
    icon: Info,
  },
]

export function ProfiloPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: profilo, isLoading } = useProfilo()

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        <PageHeader title="Profilo" />

        <div className="flex-1 px-5 flex flex-col gap-6">

          {/* Riepilogo persona */}
          <div className="flex items-center gap-3 py-2">
            <Avatar
              url={profilo?.avatar_url}
              displayName={profilo?.display_name}
              isLoading={isLoading}
            />
            <div className="min-w-0">
              {isLoading ? (
                <div className="h-5 w-32 bg-roamly-g6 rounded animate-pulse" />
              ) : (
                <p className="font-lora text-lg font-semibold text-roamly-g0 truncate">
                  {profilo?.display_name ?? 'Utente Roamly'}
                </p>
              )}
              <p className="font-dm-sans text-sm text-roamly-text/40 truncate">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Menu */}
          <div className="flex flex-col gap-2.5 pb-8">
            {VOCI.map((voce) => {
              const disponibile = !!voce.path
              const Icon = voce.icon

              return (
                <button
                  key={voce.id}
                  disabled={!disponibile}
                  onClick={() => disponibile && navigate(voce.path!)}
                  className={`
                    flex items-center gap-3.5 p-4
                    bg-white rounded-2xl shadow-roamly
                    text-left w-full
                    transition-all duration-150
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-roamly-g3
                    ${disponibile
                      ? 'active:scale-[0.98] hover:shadow-roamly-lg'
                      : 'opacity-60'
                    }
                  `}
                >
                  <div className="w-11 h-11 rounded-xl bg-roamly-g6 flex items-center justify-center shrink-0 text-roamly-g2">
                    <Icon size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-dm-sans text-sm font-semibold text-roamly-g0">
                      {voce.label}
                    </p>
                    <p className="font-dm-sans text-xs text-roamly-text/45 truncate">
                      {voce.descrizione}
                    </p>
                  </div>

                  {disponibile ? (
                    <ChevronRight size={18} className="text-roamly-text/25 shrink-0" />
                  ) : (
                    <span className="
                      flex items-center gap-1 shrink-0
                      px-2.5 py-1 rounded-full bg-roamly-g7
                      font-dm-sans text-[10px] font-medium text-roamly-text/40
                    ">
                      <Clock size={10} />
                      Presto
                    </span>
                  )}
                </button>
              )
            })}
          </div>

        </div>

      </div>
      </AnimatedPage>
      <BottomNav />
    </PageLayout>
  )
}

// ------------------------------------------------------------
// Avatar — foto profilo o iniziali come fallback
// ------------------------------------------------------------

function Avatar({
  url,
  displayName,
  isLoading,
}: {
  url: string | null | undefined
  displayName: string | null | undefined
  isLoading: boolean
}) {
  const initials = displayName
    ? displayName.trim().split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (isLoading) {
    return <div className="w-14 h-14 rounded-full bg-roamly-g6 animate-pulse shrink-0" />
  }

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className="w-14 h-14 rounded-full object-cover shadow-roamly shrink-0"
      />
    )
  }

  return (
    <div className="
      w-14 h-14 rounded-full shrink-0
      bg-roamly-g0
      flex items-center justify-center
      shadow-roamly
    ">
      <span className="font-lora text-lg font-semibold text-white">
        {initials}
      </span>
    </div>
  )
}
