import { useToastStore } from '@/store/toastStore'

// ============================================================
// useToast — API pubblica per i toast
// Usata nei hook CRUD per feedback positivo dopo ogni mutation.
// Gli errori critici continuano ad essere mostrati inline nei form —
// i toast non duplicano messaggi di errore già visibili.
// ============================================================

export function useToast() {
  const { addToast } = useToastStore()

  return {
    showSuccess: (message: string) => addToast(message, 'success'),
    showError:   (message: string, duration?: number) => addToast(message, 'error', duration),
    showInfo:    (message: string) => addToast(message, 'info'),
  }
}
