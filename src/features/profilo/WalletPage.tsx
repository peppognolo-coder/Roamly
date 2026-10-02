import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, FileText, X } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useDocumentiWallet } from '@/hooks/useWallet'
import { useViaggio } from '@/hooks/useViaggi'
import { CATEGORIA_DOCUMENTO_OPTIONS } from '@/types'
import type { CategoriaDocumento, DocumentoWalletConUrl } from '@/types'

// ============================================================
// WalletPage — /profilo/wallet
//
// Lista a "mazzo di carte" in stile Apple Wallet: ogni documento è
// una card colorata per categoria, impilata sulla precedente — se
// ne vede solo la striscia superiore, tranne l'ultima (in cima al
// mazzo) che resta interamente visibile. Si tocca una card per
// aprire la schermata di dettaglio (DocumentoWalletDetailPage),
// dove vivono anteprima file, download ed eliminazione — qui nella
// lista niente azioni, solo il tocco.
//
// Filtro per categoria (pill, client-side) e filtro opzionale per
// viaggio via query param ?viaggioId= (arrivo da PianificaHub →
// "Documenti").
//
// Un documento è sempre privato al proprietario — anche quando è
// collegato a un viaggio condiviso, vedi la nota in
// supabase-migration-wallet.sql.
// ============================================================

const formatDataBreve = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })

// Ogni card ha altezza fissa — garantisce che la sovrapposizione
// (vedi WalletCard) resti precisa indipendentemente dal contenuto.
// PEEK_PX è quanto resta visibile della card quando è coperta dalla
// successiva; solo l'ultima del mazzo è scoperta per intero.
const CARD_HEIGHT_PX = 84
const PEEK_PX = 60

export function WalletPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const viaggioIdFiltro = searchParams.get('viaggioId') ?? undefined

  const { data: viaggioFiltro } = useViaggio(viaggioIdFiltro)
  const { documenti, isLoading } = useDocumentiWallet(viaggioIdFiltro)

  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaDocumento | null>(null)

  const documentiFiltrati = useMemo(
    () => categoriaFiltro ? documenti.filter((d) => d.categoria === categoriaFiltro) : documenti,
    [documenti, categoriaFiltro]
  )

  const nuovoDocumentoHref = viaggioIdFiltro
    ? `/profilo/wallet/nuovo?viaggioId=${viaggioIdFiltro}`
    : '/profilo/wallet/nuovo'

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader
          title="Wallet"
          subtitle={viaggioFiltro ? `Documenti di ${viaggioFiltro.nome}` : 'Documenti personali, sempre con te'}
          variant="withBack"
        />

        <div className="flex-1 px-5 pb-28 flex flex-col gap-4">

          {viaggioIdFiltro && (
            <button
              onClick={() => navigate('/profilo/wallet')}
              className="
                self-start flex items-center gap-1.5 px-3 py-1.5 rounded-full
                bg-roamly-g7 font-dm-sans text-xs font-medium text-roamly-g2
                hover:bg-roamly-g6 transition-colors duration-150
              "
            >
              <X size={12} />
              Rimuovi filtro viaggio
            </button>
          )}

          {/* Filtro categoria */}
          {!isLoading && documenti.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
              <FiltroPill
                attivo={categoriaFiltro === null}
                onClick={() => setCategoriaFiltro(null)}
                label="Tutti"
              />
              {CATEGORIA_DOCUMENTO_OPTIONS.map((opt) => (
                <FiltroPill
                  key={opt.value}
                  attivo={categoriaFiltro === opt.value}
                  onClick={() => setCategoriaFiltro(opt.value)}
                  label={`${opt.emoji} ${opt.label}`}
                />
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white rounded-2xl shadow-roamly animate-pulse" />
              ))}
            </div>
          ) : documenti.length === 0 ? (
            <div className="
              flex flex-col items-center gap-3 py-12 px-8 text-center
              rounded-[18px] border border-dashed border-roamly-g5 bg-roamly-g7
            ">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-roamly flex items-center justify-center">
                <FileText size={24} className="text-roamly-g3" />
              </div>
              <div className="flex flex-col gap-1.5">
                <p className="font-lora text-base font-semibold text-roamly-g0">
                  Ancora nessun documento
                </p>
                <p className="font-dm-sans text-sm text-roamly-text/50 leading-relaxed max-w-[240px]">
                  Carta d'imbarco, documento d'identità, assicurazione — tienili qui, sempre a portata di mano.
                </p>
              </div>
            </div>
          ) : documentiFiltrati.length === 0 ? (
            <p className="font-dm-sans text-sm text-roamly-text/40 text-center py-8">
              Nessun documento in questa categoria.
            </p>
          ) : (
            // pt extra in cima: la prima card del mazzo è quella più in
            // fondo (z-index più basso) — lo spazio evita che la striscia
            // della card successiva "tagli" visivamente la prima.
            <div className="flex flex-col pt-1">
              {documentiFiltrati.map((doc, i) => (
                <WalletCard
                  key={doc.id}
                  doc={doc}
                  index={i}
                  onClick={() => navigate(`/profilo/wallet/${doc.id}`)}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Aggiungi documento — CTA fissa in fondo */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-mobile px-5 pt-3 pb-6 bg-gradient-to-t from-roamly-bg via-roamly-bg to-transparent">
        <button
          onClick={() => navigate(nuovoDocumentoHref)}
          className="
            w-full flex items-center justify-center gap-2 h-[50px]
            bg-roamly-coral rounded-full
            shadow-[0_8px_24px_-6px_rgba(229,86,58,0.5)]
            hover:bg-roamly-coral-dark active:scale-[0.98]
            transition-all duration-150
          "
        >
          <Plus size={16} className="text-white" />
          <span className="font-dm-sans text-sm font-semibold text-white">
            Nuovo documento
          </span>
        </button>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}

// ------------------------------------------------------------
// FiltroPill
// ------------------------------------------------------------

function FiltroPill({ attivo, onClick, label }: { attivo: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        shrink-0 px-3.5 py-2 rounded-full
        font-dm-sans text-xs font-medium whitespace-nowrap
        border transition-all duration-150
        ${attivo
          ? 'bg-roamly-g0 border-roamly-g0 text-white'
          : 'bg-white border-roamly-g5 text-roamly-text/60 hover:border-roamly-g4'
        }
      `}
    >
      {label}
    </button>
  )
}

// ------------------------------------------------------------
// WalletCard — una "tessera" del mazzo, colorata per categoria.
// Tutte si sovrappongono (margin-top negativo + z-index crescente)
// lasciando solo PEEK_PX di striscia visibile, tranne l'ultima
// (in cima al mazzo) che resta aperta per intero.
// ------------------------------------------------------------

function WalletCard({
  doc,
  index,
  onClick,
}: {
  doc: DocumentoWalletConUrl
  index: number
  onClick: () => void
}) {
  const opt = CATEGORIA_DOCUMENTO_OPTIONS.find((o) => o.value === doc.categoria)
  const [colA, colB] = opt?.gradiente ?? ['#9AA5AD', '#6B747B']

  return (
    <button
      onClick={onClick}
      style={{
        height: CARD_HEIGHT_PX,
        marginTop: index === 0 ? 0 : -(CARD_HEIGHT_PX - PEEK_PX),
        zIndex: index + 1,
        background: `linear-gradient(135deg, ${colA} 0%, ${colB} 100%)`,
      }}
      className="
        relative text-left shrink-0
        rounded-[22px] shadow-lg shadow-black/15
        px-4 flex items-center
        active:scale-[0.99] transition-transform duration-150
      "
    >
      <div className="flex items-center gap-2.5 w-full min-w-0">
        <span className="text-xl leading-none shrink-0">{opt?.emoji ?? '📎'}</span>
        <div className="flex-1 min-w-0">
          <p className="font-dm-sans text-sm font-semibold text-white truncate">
            {doc.nome}
          </p>
          <p className="font-dm-sans text-[11px] text-white/70 mt-0.5 truncate">
            {[opt?.label, formatDataBreve(doc.created_at)].filter(Boolean).join(' · ')}
          </p>
        </div>
      </div>
    </button>
  )
}
