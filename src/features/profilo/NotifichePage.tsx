import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { BottomNav }    from '@/components/layout/BottomNav'
import { useNotifiche } from '@/hooks/useNotifiche'
import { formatTempoRelativo, aspettoNotifica } from '@/lib/notifiche-utils'
import type { Notifica } from '@/types'

// ============================================================
// NotifichePage — /profilo/feed
// Feed notifiche (schermata "Notifiche" del mockup). Alimentato da:
//   - promemoria prenotazioni (Edge Function invia-notifiche-prenotazioni)
//   - nuovo membro in un viaggio (trigger DB)
// Sola lettura + "segna lette" — nessuna creazione dal client.
// ============================================================

export function NotifichePage() {
  const navigate = useNavigate()
  const { notifiche, nonLette, isLoading, segnaLetta, segnaTutteLette } = useNotifiche()

  function handleOpen(n: Notifica) {
    if (!n.letta) segnaLetta(n.id)
    if (n.link) navigate(n.link)
  }

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        <div className="px-5 pt-14 pb-3.5 flex items-end justify-between">
          <h1 className="font-lora text-h1 text-roamly-g0">Notifiche</h1>
          {nonLette > 0 && (
            <button
              onClick={() => segnaTutteLette()}
              className="font-dm-sans text-[11.5px] font-medium text-roamly-g1 px-1 py-1"
            >
              Segna lette
            </button>
          )}
        </div>

        <div className="flex-1 px-5 pb-24 flex flex-col gap-2.5">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-[74px] bg-white rounded-2xl shadow-roamly animate-pulse" />
            ))
          ) : notifiche.length === 0 ? (
            <div className="
              flex flex-col items-center gap-3 py-14 px-8 text-center
              rounded-[18px] border border-dashed border-roamly-g5 bg-roamly-g7
            ">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-roamly flex items-center justify-center">
                <Bell size={22} className="text-roamly-g3" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-lora text-base font-semibold text-roamly-g0">
                  Nessuna notifica
                </p>
                <p className="font-dm-sans text-sm text-roamly-text/50 leading-relaxed max-w-[240px]">
                  I promemoria delle prenotazioni e gli aggiornamenti sui tuoi viaggi arrivano qui.
                </p>
              </div>
            </div>
          ) : (
            notifiche.map((n) => (
              <NotificaCard key={n.id} notifica={n} onOpen={() => handleOpen(n)} />
            ))
          )}
        </div>

      </div>
      </AnimatedPage>
      <BottomNav />
    </PageLayout>
  )
}

// ------------------------------------------------------------
// NotificaCard
// ------------------------------------------------------------

function NotificaCard({ notifica, onOpen }: { notifica: Notifica; onOpen: () => void }) {
  const { glifo: glifoDefault, tono } = aspettoNotifica(notifica.tipo)
  const glifo = notifica.glifo || glifoDefault
  const nuova = !notifica.letta

  return (
    <button
      onClick={onOpen}
      className={`
        flex items-start gap-3 p-3.5 rounded-2xl text-left
        transition-all duration-150 active:scale-[0.99]
        ${nuova
          ? 'bg-white shadow-roamly border border-roamly-g5/70'
          : 'bg-white/60 shadow-roamly border border-transparent'
        }
      `}
    >
      <span
        className={`
          shrink-0 w-[38px] h-[38px] rounded-xl
          flex items-center justify-center
          font-dm-mono text-[13px] font-medium
          ${tono === 'coral' ? 'bg-[#FFE4DC] text-roamly-coral-dark' : 'bg-roamly-g6 text-roamly-g1'}
        `}
      >
        {glifo}
      </span>

      <div className="flex-1 min-w-0">
        <p className="font-dm-sans text-[13px] font-medium text-roamly-g0">
          {notifica.titolo}
        </p>
        <p className="font-dm-sans text-[11.5px] text-roamly-text/50 leading-relaxed mt-0.5">
          {notifica.testo}
        </p>
        <p className="font-dm-mono text-[9.5px] text-roamly-text/30 mt-1.5">
          {formatTempoRelativo(notifica.created_at)}
        </p>
      </div>

      {nuova && (
        <span className="shrink-0 w-[7px] h-[7px] rounded-full bg-roamly-coral mt-1" />
      )}
    </button>
  )
}
