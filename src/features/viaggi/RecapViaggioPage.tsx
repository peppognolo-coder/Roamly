import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Sparkles, NotebookPen, Camera, Wallet, Heart, Share2 } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { ViaggioCoverIcon } from '@/components/ui/ViaggioCoverIcon'
import { ShareCardRecap } from './ShareCardRecap'
import { useViaggio } from '@/hooks/useViaggi'
import { useCoversByViaggio } from '@/hooks/useFoto'
import { useRecapViaggio } from '@/hooks/useRecap'
import { calcolaDurataViaggio, formatDataViaggio } from '@/lib/viaggi-utils'

// ============================================================
// RecapViaggioPage — /viaggi/:id/recap
// Riepilogo "il tuo viaggio in numeri" per un viaggio concluso.
// Riusa ShareCardViaggio (già esistente) per l'export immagine —
// qui il valore aggiunto è la vista ricca in-app: budget e
// ricordo più apprezzato, che nella share card non ci stanno.
// ============================================================

const formatEuro = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

export function RecapViaggioPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: viaggio, isLoading: isLoadingViaggio } = useViaggio(viaggioId)
  const { data: coversMap } = useCoversByViaggio(viaggioId)
  const { data: recap, isLoading: isLoadingRecap } = useRecapViaggio(viaggioId)
  const [showShare, setShowShare] = useState(false)

  const coverUrl = recap?.ricordoTop ? coversMap?.get(recap.ricordoTop.id) ?? null : null

  const isLoading = isLoadingViaggio || isLoadingRecap
  const durataGiorni = viaggio ? calcolaDurataViaggio(viaggio.data_inizio, viaggio.data_fine) : null

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Il tuo recap" variant="withBack" />

        {isLoading || !viaggio ? (
          <div className="flex-1 px-5 flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white rounded-2xl shadow-roamly animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="flex-1 px-5 pb-8 flex flex-col gap-6">

            {/* Intestazione viaggio */}
            <div className="flex flex-col items-center text-center gap-2 py-4">
              <ViaggioCoverIcon value={viaggio.cover_emoji} size={56} />
              <h1 className="font-lora text-2xl font-semibold text-roamly-g0">
                {viaggio.nome}
              </h1>
              <p className="font-dm-sans text-sm text-roamly-text/50">
                {formatDataViaggio(viaggio.data_inizio, viaggio.data_fine)}
              </p>
            </div>

            {/* Griglia numeri */}
            <div className="grid grid-cols-2 gap-3">
              <NumeroTile
                icon={Sparkles}
                valore={durataGiorni ?? '—'}
                etichetta={durataGiorni === 1 ? 'giorno' : 'giorni'}
              />
              <NumeroTile
                icon={NotebookPen}
                valore={recap?.numRicordi ?? 0}
                etichetta={recap?.numRicordi === 1 ? 'ricordo scritto' : 'ricordi scritti'}
              />
              <NumeroTile
                icon={Camera}
                valore={recap?.numFoto ?? 0}
                etichetta="foto scattate"
              />
              <NumeroTile
                icon={Wallet}
                valore={formatEuro(recap?.speseTotali ?? 0)}
                etichetta="spesi in totale"
                small
              />
            </div>

            {/* Ricordo più apprezzato */}
            {recap?.ricordoTop && (
              <button
                onClick={() => navigate(`/ricordi/${recap.ricordoTop!.id}`)}
                className="
                  flex items-center gap-3 p-4
                  bg-white rounded-2xl shadow-roamly text-left
                  active:scale-[0.98] hover:shadow-roamly-lg
                  transition-all duration-150
                "
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                  <Heart size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-dm-sans text-xs text-roamly-text/45">
                    Il ricordo più apprezzato
                  </p>
                  <p className="font-dm-sans text-sm font-medium text-roamly-g0 truncate">
                    {recap.ricordoTop.titolo}
                  </p>
                </div>
              </button>
            )}

            {/* Condividi */}
            <button
              onClick={() => setShowShare(true)}
              className="
                flex items-center justify-center gap-2 p-3.5
                bg-roamly-g0 rounded-2xl
                hover:opacity-90 active:scale-[0.98]
                transition-all duration-150
              "
            >
              <Share2 size={16} className="text-white" />
              <span className="font-dm-sans text-sm font-semibold text-white">
                Condividi il tuo viaggio
              </span>
            </button>

          </div>
        )}
      </div>
      </AnimatedPage>

      {showShare && viaggio && (
        <ShareCardRecap
          viaggio={viaggio}
          coverUrl={coverUrl}
          numRicordi={recap?.numRicordi ?? 0}
          numFoto={recap?.numFoto ?? 0}
          ricordoTopTitolo={recap?.ricordoTop?.titolo}
          onClose={() => setShowShare(false)}
        />
      )}
    </PageLayout>
  )
}

function NumeroTile({
  icon: Icon,
  valore,
  etichetta,
  small = false,
}: {
  icon: typeof Sparkles
  valore: string | number
  etichetta: string
  small?: boolean
}) {
  return (
    <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl shadow-roamly">
      <div className="w-9 h-9 rounded-xl bg-roamly-g7 flex items-center justify-center text-roamly-g2">
        <Icon size={16} />
      </div>
      <div>
        <p className={`font-dm-mono font-semibold text-roamly-g0 ${small ? 'text-lg' : 'text-2xl'}`}>
          {valore}
        </p>
        <p className="font-dm-sans text-xs text-roamly-text/45 leading-snug">
          {etichetta}
        </p>
      </div>
    </div>
  )
}
