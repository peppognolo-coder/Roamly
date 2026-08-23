// ============================================================
// GiornoLabel — intestazione giorno nella timeline
// DM Sans, uppercase, tracking ampio, colore neutro
// ============================================================

interface GiornoLabelProps {
  dataFormattata: string   // es. 'MARTEDÌ 14 GIUGNO 2025'
}

export function GiornoLabel({ dataFormattata }: GiornoLabelProps) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="
        font-dm-sans text-[10px] font-semibold
        tracking-widest uppercase
        text-roamly-text/35
        shrink-0
      ">
        {dataFormattata}
      </span>
      <div className="flex-1 h-px bg-roamly-g6" />
    </div>
  )
}
