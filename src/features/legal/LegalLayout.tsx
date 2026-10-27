import { ChevronLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useIndietro } from '@/hooks/useIndietro'
import { ULTIMO_AGGIORNAMENTO } from '@/lib/legal'

// ============================================================
// LegalLayout — cornice delle pagine legali (/privacy, /termini).
// Pubbliche: si aprono anche senza login (l'app store e il footer
// del login le linkano). Niente barra di navigazione.
// ============================================================

export function LegalLayout({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  const { user } = useAuth()
  const indietro = useIndietro(user ? '/profilo' : '/login')

  return (
    <div className="min-h-screen bg-roamly-bg flex justify-center">
      <div className="w-full max-w-[430px] px-5 pt-14 pb-16">
        <button
          onClick={indietro}
          aria-label="Indietro"
          className="w-9 h-9 -ml-1 mb-3 rounded-full flex items-center justify-center text-roamly-g0 active:scale-95 transition-transform"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="font-lora text-2xl font-semibold text-roamly-g0">{titolo}</h1>
        <p className="font-dm-sans text-xs text-roamly-muted mt-1 mb-6">
          Ultimo aggiornamento: {ULTIMO_AGGIORNAMENTO}
        </p>
        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </div>
  )
}

export function Sezione({ titolo, children }: { titolo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="font-dm-sans text-base font-semibold text-roamly-g0">{titolo}</h2>
      <div className="font-dm-sans text-sm leading-relaxed text-roamly-text/80 flex flex-col gap-2">
        {children}
      </div>
    </section>
  )
}

export function Elenco({ voci }: { voci: string[] }) {
  return (
    <ul className="list-disc pl-5 flex flex-col gap-1">
      {voci.map((v) => <li key={v}>{v}</li>)}
    </ul>
  )
}
