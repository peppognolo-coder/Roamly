import { create } from 'zustand'

// ============================================================
// ROAMLY — Toast Store
// Stato globale per i toast. Sopravvive alle navigazioni React Router.
// I timer di auto-dismiss vivono nello store — nessun setTimeout
// in componenti che potrebbero smontarsi.
// ============================================================

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id:      string
  message: string
  type:    ToastType
}

interface ToastState {
  toasts: Toast[]
  addToast: (message: string, type: ToastType, duration?: number) => void
  removeToast: (id: string) => void
}

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 3000,
  error:   5000,
  info:    3000,
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (message, type, duration) => {
    const id = crypto.randomUUID()
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }))

    const ms = duration ?? DEFAULT_DURATION[type]
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, ms)
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
