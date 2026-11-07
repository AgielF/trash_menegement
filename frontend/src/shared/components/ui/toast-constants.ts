import { useContext, createContext, type Dispatch, type SetStateAction } from 'react'

export interface ToastMessage {
  id: number
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
}

export interface ToastContextType {
  showToast: (message: string, type?: ToastMessage['type']) => void
}

export const ToastContext = createContext<ToastContextType | null>(null)

export const TYPE_CLASSES: Record<ToastMessage['type'], string> = {
  success: 'bg-status-lunas text-white',
  error: 'bg-status-kasbon text-white',
  info: 'bg-brand text-white',
  warning: 'bg-status-sebagian text-white',
}

export const TYPE_ICONS: Record<ToastMessage['type'], string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
}

let toastId = 0
let globalSetToasts: Dispatch<SetStateAction<ToastMessage[]>> | null = null

export function registerGlobalToastSetter(
  setter: Dispatch<SetStateAction<ToastMessage[]>> | null,
): void {
  globalSetToasts = setter
}

export function createToastMessage(
  message: string,
  type: ToastMessage['type'] = 'info',
): ToastMessage {
  return { id: ++toastId, message, type }
}

function showGlobalToast(message: string, type: ToastMessage['type'] = 'info'): void {
  const setter = globalSetToasts
  if (setter === null) return

  const toastMessage = createToastMessage(message, type)
  setter((prev: ToastMessage[]) => [...prev, toastMessage])
  setTimeout(() => {
    const currentSetter = globalSetToasts
    if (currentSetter !== null) {
      currentSetter((prev: ToastMessage[]) =>
        prev.filter((toastItem) => toastItem.id !== toastMessage.id),
      )
    }
  }, 4000)
}

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext)
  if (ctx !== null) return ctx
  // Fallback: use global setter if context not available
  return {
    showToast: showGlobalToast,
  }
}

/** Programmatic toast (beyond hooks). */
export function toast(message: string, type: ToastMessage['type'] = 'info'): void {
  showGlobalToast(message, type)
}
