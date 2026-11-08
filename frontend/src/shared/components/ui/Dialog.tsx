import type { ReactElement, ReactNode } from 'react'

export interface DialogProps {
  title: string
  subtitle?: string
  error?: string | null
  onClose: () => void
  children: ReactNode
  className?: string
}

/**
 * Komponen modal standar (dengan overlay background gelap dan animasi).
 * Mengikuti pedoman aksesibilitas WAI-ARIA modal dialog.
 */
export function Dialog({
  title,
  subtitle,
  error = null,
  onClose,
  children,
  className = '',
}: DialogProps): ReactElement {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 animate-dialog-fade sm:items-center"
    >
      {/* Latar klik-tutup: button penuh agar patuh a11y (bisa difokus & Enter). */}
      <button
        type="button"
        aria-label="Tutup dialog"
        className="absolute inset-0 h-full w-full cursor-default border-none bg-transparent"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl animate-dialog-slide ${className}`}
      >
        <h2 className="text-base font-bold text-neutral-900">{title}</h2>
        {subtitle !== undefined && subtitle !== '' ? (
          <p className="mt-0.5 text-xs text-neutral-600">{subtitle}</p>
        ) : null}
        {error !== null && error !== '' ? (
          <p role="alert" className="mt-2 text-xs text-status-kasbon">
            {error}
          </p>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}
