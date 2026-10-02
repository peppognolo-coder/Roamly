import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { X, Download, Trash2, FileText } from 'lucide-react'
import { useDocumentoWallet, useDeleteDocumento } from '@/hooks/useWallet'
import { useViaggio } from '@/hooks/useViaggi'
import { CATEGORIA_DOCUMENTO_OPTIONS } from '@/types'

// ============================================================
// DocumentoWalletDetailPage — /profilo/wallet/:documentoId
//
// Schermata di dettaglio in stile Apple Wallet: sfondo scuro,
// card bianca con header per categoria/data, e il file caricato
// mostrato il più grande possibile (immagine a piena larghezza, o
// PDF incorporato).
//
// NOTA onestà dei dati: qui non estraiamo né generiamo nessun dato
// strutturato (volo, posto, gate...) — quelli esisterebbero solo se
// inventati. Se il file caricato è lo screenshot di una carta
// d'imbarco con già il suo QR/barcode, è quello screenshot che si
// vede qui, mostrato semplicemente a piena dimensione — non un QR
// generato da noi. Il V1 resta file + metadati essenziali (nome,
// categoria, viaggio collegato, data), non un parser di biglietti.
// ============================================================

export function DocumentoWalletDetailPage() {
  const { documentoId } = useParams<{ documentoId: string }>()
  const navigate = useNavigate()

  const { documento, isLoading, isError } = useDocumentoWallet(documentoId)
  const { data: viaggio } = useViaggio(documento?.viaggio_id ?? undefined)
  const { deleteDocumento, isLoading: isDeleting } = useDeleteDocumento(documento?.viaggio_id ?? undefined)

  const [confermaElimina, setConfermaElimina] = useState(false)

  function handleEliminaConfirm() {
    if (!documento) return
    deleteDocumento(documento, { onSuccess: () => navigate(-1) })
  }

  const opt = documento ? CATEGORIA_DOCUMENTO_OPTIONS.find((o) => o.value === documento.categoria) : undefined
  const [colA, colB] = opt?.gradiente ?? ['#9AA5AD', '#6B747B']
  const isImmagine = documento?.mime_type.startsWith('image/') ?? false

  const formatData = (iso: string) =>
    new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 bg-[#0C0C0C] flex flex-col overflow-y-auto">

      {/* Barra superiore */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2 shrink-0">
        <button
          onClick={() => navigate(-1)}
          aria-label="Chiudi"
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors duration-150"
        >
          <X size={16} />
        </button>

        {documento && (
          <div className="flex items-center gap-2">
            <a
              href={documento.signedUrl}
              download
              target="_blank"
              rel="noreferrer"
              aria-label="Scarica documento"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors duration-150"
            >
              <Download size={15} />
            </a>
            <button
              onClick={() => setConfermaElimina(true)}
              aria-label="Elimina documento"
              className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-red-500/80 transition-colors duration-150"
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center px-5 pb-10 pt-4">
        {isLoading ? (
          <div className="w-full max-w-[380px] h-[420px] rounded-[28px] bg-white/5 animate-pulse" />
        ) : isError || !documento ? (
          <div className="w-full max-w-[380px] flex flex-col items-center gap-3 py-16 text-center">
            <FileText size={28} className="text-white/30" />
            <p className="font-dm-sans text-sm text-white/50">
              Documento non trovato, o non più disponibile.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-[380px] bg-white rounded-[28px] shadow-2xl overflow-hidden">

            {/* Header colorato per categoria */}
            <div
              className="px-5 pt-5 pb-6 flex items-center justify-between"
              style={{ background: `linear-gradient(135deg, ${colA} 0%, ${colB} 100%)` }}
            >
              <span className="font-dm-sans text-xs font-semibold uppercase tracking-wider text-white/85">
                {opt?.emoji} {opt?.label}
              </span>
              <span className="font-dm-sans text-xs text-white/70">
                {formatData(documento.created_at)}
              </span>
            </div>

            <div className="px-5 pt-4 pb-5 flex flex-col gap-3">
              <h1 className="font-lora text-lg font-semibold text-roamly-g0 leading-snug">
                {documento.nome}
              </h1>

              {viaggio && (
                <span className="self-start px-2.5 py-1 rounded-full bg-roamly-g7 font-dm-sans text-[11px] font-medium text-roamly-g1">
                  {viaggio.nome}
                </span>
              )}

              {/* File — immagine a piena larghezza, o PDF incorporato */}
              <div className="mt-1 rounded-2xl overflow-hidden bg-roamly-g7">
                {isImmagine ? (
                  <img src={documento.signedUrl} alt={documento.nome} className="w-full h-auto block" />
                ) : (
                  <>
                    <iframe
                      src={documento.signedUrl}
                      title={documento.nome}
                      className="w-full h-[480px] block border-0"
                    />
                    <div className="p-3 text-center">
                      <a
                        href={documento.signedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-dm-sans text-xs font-medium text-roamly-g1 underline underline-offset-2"
                      >
                        Apri il PDF a schermo intero
                      </a>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conferma eliminazione */}
      {confermaElimina && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfermaElimina(false)} />
          <div className="relative w-full max-w-[430px] bg-white rounded-t-3xl p-5 flex flex-col gap-3">
            <p className="font-dm-sans text-sm font-medium text-roamly-g0">
              Eliminare "{documento?.nome}"? L'azione non può essere annullata.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfermaElimina(false)}
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
    </div>
  )
}
