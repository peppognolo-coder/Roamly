import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { PageLayout }   from '@/components/layout/PageLayout'
import { PageHeader }   from '@/components/layout/PageHeader'
import { AnimatedPage } from '@/components/layout/AnimatedPage'
import { Input }  from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useUploadDocumento } from '@/hooks/useWallet'
import { useViaggi } from '@/hooks/useViaggi'
import { CATEGORIA_DOCUMENTO_OPTIONS, CAMPI_DETTAGLIO_WALLET } from '@/types'
import type { CategoriaDocumento } from '@/types'

// ============================================================
// NuovoDocumentoWalletPage — /profilo/wallet/nuovo
//
// Form a un solo passo: file (immagine o PDF) + nome + categoria
// + viaggio collegato (opzionale). Niente wizard multi-step come
// Prenotazione — qui i campi sono pochi e indipendenti tra loro.
//
// V1: nessuna modifica dei metadati dopo il caricamento — per
// cambiare categoria/viaggio di un documento bisogna eliminarlo
// e ricaricarlo. Scelta deliberata per tenere lo scope minimo:
// il caso d'uso principale è "carica e conserva", non "archivia
// e riorganizza di continuo".
// ============================================================

const ACCEPT = 'image/jpeg,image/png,image/webp,application/pdf'
const MAX_SIZE_BYTES = 15 * 1024 * 1024 // 15 MB — allineato al bucket

export function NuovoDocumentoWalletPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const viaggioIdPreselezionato = searchParams.get('viaggioId')

  const { data: viaggi = [] } = useViaggi()
  const { uploadDocumento, isLoading, error } = useUploadDocumento()

  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState<CategoriaDocumento>('carta_imbarco')
  const [viaggioId, setViaggioId] = useState<string | null>(viaggioIdPreselezionato)
  const [dettaglioValues, setDettaglioValues] = useState<Record<string, string>>({})
  const inputRef = useRef<HTMLInputElement>(null)

  const campiDettaglio = CAMPI_DETTAGLIO_WALLET[categoria]

  function handleCategoriaChange(nuova: CategoriaDocumento) {
    setCategoria(nuova)
    // Cambiare categoria cambia l'insieme dei campi — ripulisce i
    // valori per non lasciare chiavi "orfane" di una categoria diversa.
    setDettaglioValues({})
  }

  function handleDettaglioChange(key: string, value: string) {
    setDettaglioValues((prev) => ({ ...prev, [key]: value }))
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return

    if (f.size > MAX_SIZE_BYTES) {
      setFileError('Il file supera i 15 MB consentiti.')
      return
    }
    setFileError(null)
    setFile(f)
    // Precompila il nome dal file, se non ancora scritto a mano
    if (!nome) setNome(f.name.replace(/\.[^.]+$/, ''))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !nome.trim()) return

    // Solo i campi effettivamente compilati — niente chiavi vuote in DB
    const dettaglioCompilato = Object.fromEntries(
      Object.entries(dettaglioValues).filter(([, v]) => v.trim().length > 0)
    )
    const dettaglio = Object.keys(dettaglioCompilato).length > 0 ? dettaglioCompilato : null

    uploadDocumento(
      { file, payload: { categoria, nome: nome.trim(), viaggio_id: viaggioId, dettaglio } },
      { onSuccess: () => navigate(viaggioId ? `/profilo/wallet?viaggioId=${viaggioId}` : '/profilo/wallet') }
    )
  }

  const canSubmit = !!file && nome.trim().length > 0 && !isLoading

  return (
    <PageLayout>
      <AnimatedPage>
      <div className="flex flex-col min-h-screen">
        <PageHeader title="Nuovo documento" variant="withBack" />

        <form onSubmit={handleSubmit} className="flex-1 px-5 pb-8 flex flex-col gap-5">

          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="font-dm-sans text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* File */}
          <div className="flex flex-col gap-2">
            <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
              File
            </label>
            <div
              onClick={() => !isLoading && inputRef.current?.click()}
              className={`
                flex flex-col items-center justify-center gap-2 py-7
                rounded-2xl border-2 border-dashed
                transition-all duration-150
                ${isLoading
                  ? 'border-roamly-g4 bg-roamly-g7 cursor-wait'
                  : 'border-roamly-g5 bg-roamly-g7 cursor-pointer hover:border-roamly-g3 hover:bg-roamly-g6 active:scale-[0.99]'
                }
              `}
            >
              <FileText size={22} className="text-roamly-text/30" />
              <p className="font-dm-sans text-xs text-roamly-text/40 text-center px-6">
                {file ? file.name : 'Tocca per scegliere un file'}
              </p>
              <p className="font-dm-sans text-[10px] text-roamly-text/25">
                JPEG · PNG · WebP · PDF — max 15 MB
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleFileChange}
              className="hidden"
              disabled={isLoading}
            />
            {fileError && (
              <p className="font-dm-sans text-xs text-red-500">{fileError}</p>
            )}
          </div>

          {/* Nome */}
          <Input
            label="Nome"
            placeholder="Es. Carta d'imbarco FR1234"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={80}
          />

          {/* Categoria */}
          <div className="flex flex-col gap-2">
            <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
              Categoria
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIA_DOCUMENTO_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleCategoriaChange(opt.value)}
                  className={`
                    px-3.5 py-2 rounded-full
                    font-dm-sans text-sm font-medium
                    border transition-all duration-150
                    ${categoria === opt.value
                      ? 'bg-roamly-g0 border-roamly-g0 text-white'
                      : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/60 hover:border-roamly-g4'
                    }
                  `}
                >
                  {opt.emoji} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Campi specifici per categoria — opzionali, scritti a mano.
              Alimentano il "pass" nella schermata di dettaglio; il file
              caricato resta comunque visibile per intero (vedi nota in
              DocumentoWalletDetailPage). 'altro' non ha campi. */}
          {campiDettaglio.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
                Dettagli <span className="text-roamly-text/35 font-normal">(opzionali)</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {campiDettaglio.map((campo) => (
                  <Input
                    key={campo.key}
                    label={campo.label}
                    type={campo.type === 'date' ? 'date' : 'text'}
                    value={dettaglioValues[campo.key] ?? ''}
                    onChange={(e) => handleDettaglioChange(campo.key, e.target.value)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Viaggio collegato — opzionale */}
          {viaggi.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="font-dm-sans text-sm font-medium text-roamly-text/70">
                Collega a un viaggio <span className="text-roamly-text/35 font-normal">(opzionale)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setViaggioId(null)}
                  className={`
                    px-3.5 py-2 rounded-full
                    font-dm-sans text-sm font-medium
                    border transition-all duration-150
                    ${viaggioId === null
                      ? 'bg-roamly-g0 border-roamly-g0 text-white'
                      : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/60 hover:border-roamly-g4'
                    }
                  `}
                >
                  Nessuno — personale
                </button>
                {viaggi.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setViaggioId(v.id)}
                    className={`
                      px-3.5 py-2 rounded-full
                      font-dm-sans text-sm font-medium
                      border transition-all duration-150
                      ${viaggioId === v.id
                        ? 'bg-roamly-g0 border-roamly-g0 text-white'
                        : 'bg-roamly-g7 border-roamly-g6 text-roamly-text/60 hover:border-roamly-g4'
                      }
                    `}
                  >
                    {v.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button type="submit" fullWidth isLoading={isLoading} disabled={!canSubmit}>
            Carica documento
          </Button>
        </form>
      </div>
      </AnimatedPage>
    </PageLayout>
  )
}
