import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Trash2, ExternalLink, FileText, X } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { useDocumentiWallet, useDeleteDocumento } from '@/hooks/useWallet'
import { useViaggio } from '@/hooks/useViaggi'
import { CATEGORIA_DOCUMENTO_OPTIONS } from '@/types'
import type { CategoriaDocumento, DocumentoWalletConUrl } from '@/types'

// ============================================================
// WalletPage — /profilo/wallet
//
// Lista globale dei documenti personali, con filtro per categoria
// (pill, client-side) e filtro opzionale per viaggio via query
// param ?viaggioId= (arrivo da PianificaHub → "Documenti").
//
// Un documento è sempre privato al proprietario — anche quando è
// collegato a un viaggio condiviso, vedi la nota in
// supabase-migration-wallet.sql.
// ============================================================

const formatDataBreve = (iso: string) =>
  new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })

export function WalletPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const viaggioIdFiltro = searchParams.get('viaggioId') ?? undefined

  const { data: viaggioFiltro } = useViaggio(viaggioIdFiltro)
  const { documenti, isLoading } = useDocumentiWallet(viaggioIdFiltro)
  const { deleteDocumento, isLoading: isDeleting } = useDeleteDocumento(viaggioIdFiltro)

  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaDocumento | null>(null)
  const [daEliminare, setDaEliminare] = useState<DocumentoWalletConUrl | null>(null)

  const documentiFiltrati = useMemo(
    () => categoriaFiltro ? documenti.filter((d) => d.categoria === categoriaFiltro) : documenti,
    [documenti, categoriaFiltro]
  )

  function handleEliminaConfirm() {
    if (!daEliminare) return
    deleteDocumento(daEliminare)
    setDaEliminare(null)
  }

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
          ) : (
            <div className="flex flex-col gap-2">
              {documentiFiltrati.map((doc) => (
                <DocumentoRow
                  key={doc.id}
                  doc={doc}
                  onElimina={() => setDaEliminare(doc)}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Conferma eliminazione */}
      {daEliminare && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDaEliminare(null)}
          />
          <div className="relative w-full max-w-[430px] bg-roamly-bg rounded-t-3xl p-5 flex flex-col gap-3">
            <p className="font-dm-sans text-sm font-medium text-roamly-g0">
              Eliminare "{daEliminare.nome}"? L'azione non può essere annullata.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDaEliminare(null)}
                className="flex-1 h-11 rounded-2xl bg-roamly-g7 font-dm-sans text-sm font-medium text-roamly-g0"
              >
                Annulla
              </button>
              <button
                onClick={handleEliminaConfirm}
                disabled={isDeleting}
                className="flex-1 h-11 rounded-2xl bg-red-500 hover:bg-red-600 font-dm-sans text-sm font-medium text-white disabled:opacity-60"
              >
                Elimina
              </button>
            </div>
          </div>
        </div>
      )}

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
// DocumentoRow
// ------------------------------------------------------------

function DocumentoRow({ doc, onElimina }: { doc: DocumentoWalletConUrl; onElimina: () => void }) {
  const opt = CATEGORIA_DOCUMENTO_OPTIONS.find((o) => o.value === doc.categoria)

  return (
    <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl shadow-roamly">
      <div className="w-11 h-11 rounded-xl bg-roamly-g6 flex items-center justify-center shrink-0 overflow-hidden">
        {doc.thumbnailSignedUrl ? (
          <img src={doc.thumbnailSignedUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-lg">{opt?.emoji ?? '📎'}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-dm-sans text-sm font-medium text-roamly-g0 truncate">
          {doc.nome}
        </p>
        <p className="font-dm-sans text-xs text-roamly-g2 mt-0.5 truncate">
          {[opt?.label, formatDataBreve(doc.created_at)].filter(Boolean).join(' · ')}
        </p>
      </div>

      <a
        href={doc.signedUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Apri documento"
        className="
          w-9 h-9 rounded-full bg-roamly-g7 flex items-center justify-center shrink-0
          hover:bg-roamly-g6 transition-colors duration-150
        "
      >
        <ExternalLink size={14} className="text-roamly-g2" />
      </a>

      <button
        onClick={onElimina}
        aria-label="Elimina documento"
        className="
          w-9 h-9 rounded-full bg-roamly-g7 flex items-center justify-center shrink-0
          hover:bg-red-50 hover:text-red-500 text-roamly-g2
          transition-colors duration-150
        "
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
