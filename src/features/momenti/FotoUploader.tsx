import { useRef } from 'react'

// ============================================================
// FotoUploader — area tap/drag per selezionare e caricare foto
// Accetta: JPEG, PNG, WebP
// Supporta selezione singola e multipla (attributo multiple).
// ============================================================

interface FotoUploaderProps {
  onFiles:   (files: File[]) => void   // array — supporta selezione multipla
  isLoading: boolean
  progress:  number
  error?:    string | null
  disabled?: boolean
  multiple?: boolean
  // Testo alternativo quando usato nel form di creazione (pre-salvataggio)
  label?: string
}

const ACCEPT = 'image/jpeg,image/png,image/webp'

export function FotoUploader({
  onFiles,
  isLoading,
  progress,
  error,
  disabled  = false,
  multiple  = true,
  label,
}: FotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (files && files.length > 0) {
      onFiles(Array.from(files))
    }
    e.target.value = ''
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      onFiles(Array.from(files))
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  const labelText = label ?? (multiple ? 'Tocca per aggiungere foto' : 'Tocca per aggiungere una foto')

  return (
    <div className="flex flex-col gap-2">

      {/* Area drop / tap */}
      <div
        onClick={() => !disabled && !isLoading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`
          flex flex-col items-center justify-center gap-2
          h-24 rounded-2xl border-2 border-dashed
          transition-all duration-150
          ${isLoading
            ? 'border-roamly-g4 bg-roamly-g7 cursor-wait'
            : disabled
            ? 'border-roamly-g5 bg-roamly-g7 cursor-not-allowed opacity-50'
            : 'border-roamly-g5 bg-roamly-g7 cursor-pointer hover:border-roamly-g3 hover:bg-roamly-g6 active:scale-[0.99]'
          }
        `}
      >
        {isLoading ? (
          <div className="flex flex-col items-center gap-1.5 w-full px-6">
            <div className="w-5 h-5 rounded-full border-2 border-roamly-g3 border-t-transparent animate-spin" />
            <div className="w-full h-1.5 bg-roamly-g6 rounded-full overflow-hidden">
              <div
                className="h-full bg-roamly-g3 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="font-dm-mono text-[10px] text-roamly-text/40">
              {progress}%
            </span>
          </div>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
              className="text-roamly-text/30">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p className="font-dm-sans text-xs text-roamly-text/40 text-center">
              {labelText}
            </p>
            <p className="font-dm-sans text-[10px] text-roamly-text/25">
              JPEG · PNG · WebP{multiple ? ' · selezione multipla' : ''}
            </p>
          </>
        )}
      </div>

      {/* Input nascosto */}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled || isLoading}
      />

      {/* Errore */}
      {error && (
        <p className="font-dm-sans text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}
