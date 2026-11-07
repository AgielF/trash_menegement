import { useState, type ReactNode, useCallback, useEffect } from 'react'
import type { ToastMessage } from './toast-constants'
import {
  createToastMessage,
  registerGlobalToastSetter,
  ToastContext,
  TYPE_CLASSES,
  TYPE_ICONS,
} from './toast-constants'

export function ToastProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    registerGlobalToastSetter(setToasts)
    return () => {
      registerGlobalToastSetter(null)
    }
  }, [])

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
      const toastMessage = createToastMessage(message, type)
      setToasts((prev: ToastMessage[]) => [...prev, toastMessage])
      setTimeout(() => {
        setToasts((prev: ToastMessage[]) =>
          prev.filter((toastItem) => toastItem.id !== toastMessage.id),
        )
      }, 4000)
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="fixed bottom-20 left-0 right-0 z-30 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-lg ${TYPE_CLASSES[t.type]}`}
            role="status"
          >
            <span aria-hidden="true">{TYPE_ICONS[t.type]}</span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
