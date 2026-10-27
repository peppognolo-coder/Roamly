import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Share2, Globe, Wallet, BookOpen, Loader2 } from 'lucide-react'
import { PageLayout } from '@/components/layout/PageLayout'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { RaccontoViaggio } from './RaccontoViaggio'
import { ShareCardRecap } from './ShareCardRecap'
import { LinkPubblicoSheet } from './LinkPubblicoSheet'
import { useMioRuolo } from '@/hooks/useMembri'
import { useRecapViaggio } from '@/hooks/useRecap'
import { useViaggio, useStatisticheViaggio } from '@/hooks/useViaggi'
import { useRicordi } from '@/hooks/useRicordi'
import { useCoversByViaggio, useCoverViaggio, useFotoCountByViaggio } from '@/hooks/useFoto'

// ============================================================
// RaccontoPage — /viaggi/:id/racconto
// Esperienza editoriale immersiva (RaccontoViaggio), non più un
// tab di ViaggioDetailPage. È la tappa finale del percorso
// post-viaggio (Wrapped → Racconto): in fondo ci sono Condividi,
// Link pubblico e Spese, che prima stavano nel vecchio Riepilogo.
// ============================================================

export function RaccontoPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [showShare, setShowShare] = useState(false)
  const [mostraLink, setMostraLink] = useState(false)
  const [libroPerc, setLibroPerc] = useState<number | null>(null)
  const [libroErrore, setLibroErrore] = useState(false)

  async function scaricaLibro() {
    if (!viaggioId || libroPerc !== null) return
    setLibroErrore(false); setLibroPerc(0)
    try {
      const { scaricaLibroViaggio } = await import('@/services/libroService')
      await scaricaLibroViaggio(viaggioId, setLibroPerc)
    } catch (e) {
      console.error(e); setLibroErrore(true)
    } finally {
      setLibroPerc(null)
    }
  }
  const { data: mioRuolo } = useMioRuolo(viaggioId)
  const { data: recap } = useRecapViaggio(viaggioId)

  const { data: viaggio, isLoading: isLoadingViaggio } = useViaggio(viaggioId)
  const { data: stats } = useStatisticheViaggio(viaggioId)
  const { data: ricordi = [], isLoading: isLoadingRicordi } = useRicordi(viaggioId)
  const { data: coversMap }   = useCoversByViaggio(viaggioId)
  const { data: coverViaggio } = useCoverViaggio(viaggioId)
  const coverCondivisione = recap?.ricordoTop ? coversMap?.get(recap.ricordoTop.id) ?? null : null
  const { data: fotoCount }    = useFotoCountByViaggio(viaggioId)

  const isLoading = isLoadingViaggio || isLoadingRicordi

  if (isLoading || !viaggio) {
    return (
      <PageLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <AnimatedPage>
        <RaccontoViaggio
          viaggioId={viaggioId ?? ''}
          viaggio={viaggio}
          ricordi={ricordi}
          coversMap={coversMap}
          fotoCount={fotoCount}
          coverViaggio={coverViaggio}
          numRicordi={stats?.ricordi ?? 0}
          isLoading={isLoadingRicordi}
        />

        {/* Azioni finali: condividere e rivedere le spese */}
        {ricordi.length > 0 && (
          <div className="px-6 pb-16 -mt-4 flex flex-col gap-2.5">
            <button
              onClick={() => setShowShare(true)}
              className="h-[50px] rounded-full bg-roamly-g0 text-white
                inline-flex items-center justify-center gap-2
                font-dm-sans text-sm font-semibold
                active:scale-[0.98] transition-transform"
            >
              <Share2 size={15} /> Condividi il racconto
            </button>
            <button
              onClick={scaricaLibro}
              disabled={libroPerc !== null}
              className="h-[46px] rounded-full border border-roamly-g5 bg-roamly-g7 text-roamly-g2
                inline-flex items-center justify-center gap-1.5
                font-dm-sans text-sm font-medium active:scale-[0.98] transition-transform disabled:opacity-80"
            >
              {libroPerc !== null
                ? <><Loader2 size={14} className="animate-spin" /> Preparo il libro… {libroPerc}%</>
                : <><BookOpen size={14} /> Scarica il libro (PDF)</>}
            </button>
            {libroErrore && (
              <p className="text-center font-dm-sans text-xs text-red-500">
                Non sono riuscito a creare il libro. Riprova tra poco.
              </p>
            )}
            <div className={`grid gap-2.5 ${mioRuolo === 'proprietario' ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {mioRuolo === 'proprietario' && (
                <button
                  onClick={() => setMostraLink(true)}
                  className="h-[46px] rounded-full border border-roamly-g5 bg-roamly-g7 text-roamly-g2
                    inline-flex items-center justify-center gap-1.5
                    font-dm-sans text-sm font-medium active:scale-[0.98] transition-transform"
                >
                  <Globe size={14} /> Link pubblico
                </button>
              )}
              <button
                onClick={() => navigate(`/viaggi/${viaggioId}/budget`)}
                className="h-[46px] rounded-full border border-roamly-g5 bg-roamly-g7 text-roamly-g2
                  inline-flex items-center justify-center gap-1.5
                  font-dm-sans text-sm font-medium active:scale-[0.98] transition-transform"
              >
                <Wallet size={14} /> Spese
              </button>
            </div>
          </div>
        )}
      </AnimatedPage>

      {showShare && (
        <ShareCardRecap
          viaggio={viaggio}
          coverUrl={coverCondivisione}
          numRicordi={recap?.numRicordi ?? 0}
          numFoto={recap?.numFoto ?? 0}
          ricordoTopTitolo={recap?.ricordoTop?.titolo}
          onClose={() => setShowShare(false)}
        />
      )}
      {mostraLink && viaggioId && (
        <LinkPubblicoSheet viaggioId={viaggioId} nomeViaggio={viaggio.nome} onClose={() => setMostraLink(false)} />
      )}
    </PageLayout>
  )
}
