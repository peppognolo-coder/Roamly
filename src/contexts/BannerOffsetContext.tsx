import { createContext, useContext, useState, useCallback } from 'react'

// ============================================================
// BannerOffsetContext — clearance extra per i banner flottanti
//
// OfflineBanner e InstallBanner sono `fixed` sopra la BottomNav
// (rispettivamente bottom-[80px] e bottom-[88px]) e vivono fuori
// dall'albero delle route, quindi ogni pagina li ignora: la
// PageLayout riserva solo lo spazio per la BottomNav (pb-24).
// Quando uno dei due banner compare, finisce sopra l'ultimo
// contenuto reale della pagina invece che sotto — es. l'ultima
// riga di una lista, o una card in fondo.
//
// I due banner sono mutuamente esclusivi (InstallBanner non si
// mostra mai offline), quindi un solo valore condiviso basta:
// ciascuno lo imposta alla propria altezza quando è visibile e
// lo azzera quando sparisce. PageLayout aggiunge questo valore
// al proprio padding-bottom.
// ============================================================

interface BannerOffsetContextValue {
  extraOffset: number
  setExtraOffset: (px: number) => void
}

const BannerOffsetContext = createContext<BannerOffsetContextValue>({
  extraOffset: 0,
  setExtraOffset: () => {},
})

export function BannerOffsetProvider({ children }: { children: React.ReactNode }) {
  const [extraOffset, setExtraOffsetState] = useState(0)
  const setExtraOffset = useCallback((px: number) => setExtraOffsetState(px), [])

  return (
    <BannerOffsetContext.Provider value={{ extraOffset, setExtraOffset }}>
      {children}
    </BannerOffsetContext.Provider>
  )
}

export function useBannerOffset() {
  return useContext(BannerOffsetContext)
}
