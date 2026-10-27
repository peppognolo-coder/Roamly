// ============================================================
// PageSkeleton — fallback di Suspense mentre si scarica il chunk di
// una pagina lazy. Riproduce la sagoma tipica (header + card) al posto
// del cerchio che gira, così il passaggio al contenuto reale non
// "salta". Niente BottomNav: la barra la monta ogni pagina da sé.
// ============================================================

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-roamly-bg flex justify-center">
      <div
        role="status"
        aria-label="Caricamento"
        className="w-full max-w-[430px] px-5 pt-14 flex flex-col gap-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-roamly-g6 animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-2.5 w-1/4 rounded bg-roamly-g6 animate-pulse" />
            <div className="h-6 w-1/2 rounded bg-roamly-g6 animate-pulse" />
          </div>
        </div>
        <div className="h-36 rounded-2xl bg-roamly-g6 animate-pulse" />
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-roamly-g6 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  )
}
