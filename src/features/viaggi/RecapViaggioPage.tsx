import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, Share2, BookOpen, ChevronRight, Wallet } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { ShareCardRecap } from './ShareCardRecap'
import { useViaggio } from '@/hooks/useViaggi'
import { useCoversByViaggio } from '@/hooks/useFoto'
import { useRicordi } from '@/hooks/useRicordi'
import { useRecapViaggio } from '@/hooks/useRecap'
import { calcolaDurataViaggio } from '@/lib/viaggi-utils'
import { buildRacconto } from '@/lib/racconto-utils'
import { formatDataGiorno } from '@/lib/diario-utils'
import type { CapitoloRacconto } from '@/lib/racconto-utils'

// ============================================================
// RecapViaggioPage — /viaggi/:id/recap
// Riepilogo "il tuo viaggio in numeri" per un viaggio concluso —
// copertina scura editoriale + griglia numeri + narrativa breve +
// capitoli del racconto in anteprima + ricordo più apprezzato.
// Riusa buildRacconto (già scritto per l'esperienza immersiva
// RaccontoViaggio) solo per raggruppare i ricordi per giorno —
// nessuna nuova query pesante, i dati sono già in cache.
// Riusa ShareCardViaggio (già esistente) per l'export immagine.
// ============================================================

const formatEuro = (n: number) =>
  n.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })

const CAPITOLO_GRADIENT: Record<string, string> = {
  felice:       'linear-gradient(135deg,#FDE68A,#FEF3C7 55%,#FFFBEB)',
  meravigliato: 'linear-gradient(135deg,#FBCFE8,#FCE7F3 55%,#FDF2F8)',
  sereno:       'linear-gradient(135deg,#A3DAEC,#DFF3FA 55%,#F0FAFD)',
  entusiasta:   'linear-gradient(135deg,#FFE4DC,#FFEDE7 55%,#FFF7F4)',
  ispirato:     'linear-gradient(135deg,#DDD6FE,#EDE9FE 55%,#F5F3FF)',
}

// Estratto breve da mostrare sotto il titolo del capitolo —
// preferisce il testo del primo ricordo, altrimenti il conteggio
// o il luogo, senza mai inventare contenuto.
function estrattoCapitolo(capitolo: CapitoloRacconto): string {
  const primo = capitolo.ricordi[0]?.ricordo
  if (primo?.testo) {
    return primo.testo.length > 70 ? `${primo.testo.slice(0, 70).trim()}…` : primo.testo
  }
  if (capitolo.ricordi.length > 1) {
    return `${capitolo.ricordi.length} ricordi di questo giorno`
  }
  return primo?.luogo || 'Un giorno di viaggio'
}

// Paragrafo narrativo breve — solo dati reali, nessuna invenzione.
function buildNarrativa(
  destinazione: string | null | undefined,
  durataGiorni: number | null,
  numRicordi: number,
  ricordoTopTitolo?: string,
): string | null {
  if (!durataGiorni && numRicordi === 0) return null
  const luogo = destinazione ? ` a ${destinazione}` : ''
  const giorniTxt = durataGiorni
    ? `${durataGiorni} ${durataGiorni === 1 ? 'giorno' : 'giorni'}`
    : 'Questo viaggio'
  const ricordiTxt = numRicordi > 0
    ? `, ${numRicordi} ${numRicordi === 1 ? 'ricordo da rileggere' : 'ricordi da rileggere'}`
    : ''
  const topTxt = ricordoTopTitolo
    ? `, e un momento — «${ricordoTopTitolo}» — che ti porti dietro più degli altri.`
    : '.'
  return `${giorniTxt}${luogo}${ricordiTxt}${topTxt}`
}

export function RecapViaggioPage() {
  const { id: viaggioId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: viaggio, isLoading: isLoadingViaggio } = useViaggio(viaggioId)
  const { data: coversMap } = useCoversByViaggio(viaggioId)
  const { data: ricordi = [], isLoading: isLoadingRicordi } = useRicordi(viaggioId)
  const { data: recap, isLoading: isLoadingRecap } = useRecapViaggio(viaggioId)
  const [showShare, setShowShare] = useState(false)

  const coverUrl = recap?.ricordoTop ? coversMap?.get(recap.ricordoTop.id) ?? null : null

  const isLoading = isLoadingViaggio || isLoadingRecap || isLoadingRicordi
  const durataGiorni = viaggio ? calcolaDurataViaggio(viaggio.data_inizio, viaggio.data_fine) : null

  const dati = useMemo(
    () => (viaggio ? buildRacconto(viaggio, ricordi, coversMap, undefined) : null),
    [viaggio, ricordi, coversMap]
  )

  const narrativa = viaggio
    ? buildNarrativa(viaggio.destinazione, durataGiorni, recap?.numRicordi ?? 0, recap?.ricordoTop?.titolo)
    : null

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">

        {isLoading || !viaggio ? (
          <div className="flex flex-col gap-4">
            <div className="h-[250px] bg-roamly-g6 animate-pulse" />
            <div className="px-5 flex flex-col gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl shadow-roamly animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Copertina scura — eyebrow + nome viaggio */}
            <div
              className="relative h-[250px] shrink-0 overflow-hidden"
              style={{ background: 'linear-gradient(160deg,#0C2A3D,#123F58 50%,#0B6F99)' }}
            >
              <div
                className="absolute inset-0"
                style={{ backgroundImage: 'repeating-linear-gradient(115deg, rgba(255,255,255,.06) 0 2px, transparent 2px 12px)' }}
              />
              <button
                onClick={() => navigate(-1)}
                aria-label="Indietro"
                className="
                  absolute left-[18px] top-[52px] w-[38px] h-[38px] rounded-full
                  bg-white/15 backdrop-blur-sm text-white
                  flex items-center justify-center
                  hover:bg-white/25 transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
                "
              >
                <ArrowLeft size={16} />
              </button>
              <div className="absolute left-5 right-5 bottom-5">
                <p className="font-dm-mono text-[9px] font-medium uppercase tracking-[0.18em] text-roamly-g5/85">
                  Il tuo racconto{durataGiorni ? ` · ${durataGiorni} ${durataGiorni === 1 ? 'giorno' : 'giorni'}` : ''}
                </p>
                <h1 className="font-lora text-[28px] leading-[1.15] font-semibold text-white mt-2">
                  {viaggio.nome}
                </h1>
              </div>
            </div>

            <div className="flex-1 px-5 pt-[18px] pb-8 flex flex-col gap-4">

              {/* Griglia numeri */}
              <div className="grid grid-cols-2 gap-2.5">
                <NumeroTile valore={durataGiorni ?? '—'} etichetta={durataGiorni === 1 ? 'giorno' : 'giorni'} />
                <NumeroTile
                  valore={recap?.numRicordi ?? 0}
                  etichetta={recap?.numRicordi === 1 ? 'ricordo scritto' : 'ricordi scritti'}
                />
                <NumeroTile valore={recap?.numFoto ?? 0} etichetta="foto scattate" />
                <NumeroTile valore={formatEuro(recap?.speseTotali ?? 0)} etichetta="spesi in totale" />
              </div>

              {/* Narrativa breve */}
              {narrativa && (
                <p
                  className="font-lora text-[15px] leading-[1.7] text-roamly-text/70"
                  style={{ textWrap: 'pretty' }}
                >
                  {narrativa}
                </p>
              )}

              {/* Capitoli — anteprima del racconto giorno per giorno */}
              {dati && dati.capitoli.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {dati.capitoli.map((capitolo) => {
                    const primo = capitolo.ricordi[0]?.ricordo
                    const mood = primo?.mood ?? 'sereno'
                    return (
                      <button
                        key={capitolo.data}
                        onClick={() => primo && navigate(`/ricordi/${primo.id}`)}
                        disabled={!primo}
                        className="
                          flex items-center gap-3 p-3.5
                          bg-white rounded-2xl shadow-roamly text-left
                          active:scale-[0.98] hover:shadow-roamly-lg
                          transition-all duration-150
                        "
                      >
                        <span
                          className="shrink-0 w-[52px] h-[52px] rounded-[13px]"
                          style={{ background: CAPITOLO_GRADIENT[mood] ?? CAPITOLO_GRADIENT.sereno }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-dm-mono text-[9px] font-medium uppercase tracking-[0.12em] text-roamly-text/30 truncate">
                            {formatDataGiorno(capitolo.data)}
                          </p>
                          <p className="font-lora text-sm font-semibold text-roamly-g0 mt-1.5 truncate">
                            {primo?.titolo ?? 'Ricordo'}
                          </p>
                          <p className="font-dm-sans text-[11.5px] text-roamly-text/45 mt-1 truncate">
                            {estrattoCapitolo(capitolo)}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

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
                  <div className="w-10 h-10 rounded-xl bg-[#FFE4DC] flex items-center justify-center text-roamly-coral-dark shrink-0">
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

              {/* Rileggi il racconto completo — l'esperienza editoriale
                  immersiva (RaccontoViaggio) non è più un tab di dettaglio
                  viaggio: si raggiunge solo da qui. */}
              <button
                onClick={() => navigate(`/viaggi/${viaggioId}/racconto`)}
                className="
                  flex items-center gap-3 p-4
                  bg-white rounded-2xl shadow-roamly text-left
                  active:scale-[0.98] hover:shadow-roamly-lg
                  transition-all duration-150
                "
              >
                <div className="w-10 h-10 rounded-xl bg-roamly-g7 flex items-center justify-center text-roamly-g2 shrink-0">
                  <BookOpen size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-dm-sans text-sm font-medium text-roamly-g0">
                    Rileggi il racconto completo
                  </p>
                  <p className="font-dm-sans text-xs text-roamly-text/45">
                    L'esperienza immersiva, capitolo per capitolo
                  </p>
                </div>
                <ChevronRight size={18} className="text-roamly-text/30 shrink-0" />
              </button>

              {/* Condividi + Spese */}
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowShare(true)}
                  className="
                    flex-1 flex items-center justify-center gap-2 h-[50px]
                    bg-roamly-g0 rounded-full
                    hover:bg-roamly-g1 active:scale-[0.98]
                    transition-all duration-150
                  "
                >
                  <Share2 size={15} className="text-white" />
                  <span className="font-dm-sans text-sm font-semibold text-white">
                    Condividi il racconto
                  </span>
                </button>
                <button
                  onClick={() => navigate(`/viaggi/${viaggioId}/budget`)}
                  className="
                    shrink-0 flex items-center gap-1.5 h-[50px] px-5
                    border border-roamly-g5 bg-roamly-g7 rounded-full
                    hover:bg-roamly-g6 active:scale-[0.98]
                    transition-all duration-150
                  "
                >
                  <Wallet size={14} className="text-roamly-g1" />
                  <span className="font-dm-sans text-sm font-medium text-roamly-g1">
                    Spese
                  </span>
                </button>
              </div>

            </div>
          </>
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
  valore,
  etichetta,
}: {
  valore: string | number
  etichetta: string
}) {
  return (
    <div className="p-[15px] rounded-2xl bg-white shadow-roamly">
      <p className="font-dm-mono text-[22px] font-semibold text-roamly-g0 leading-none">
        {valore}
      </p>
      <p className="font-dm-sans text-[11.5px] leading-snug text-roamly-text/45 mt-1.5">
        {etichetta}
      </p>
    </div>
  )
}
