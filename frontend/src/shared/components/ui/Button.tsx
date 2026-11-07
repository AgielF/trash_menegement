interface ButtonProps {
  label: string
  onClick?: () => void
  type?: 'button' | 'submit'
  variant?: 'primary' | 'pill-green'
  disabled?: boolean
  loading?: boolean
  className?: string
}

/**
 * Tombol aksi. `variant="primary"`: pita teal penuh (login/register, referensi).
 * `variant="pill-green"`: pil hijau kecil (contoh "MULAI AMBIL SAMPAH", referensi Beranda).
 */
export function Button({
  label,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps): React.ReactElement {
  const isPill = variant === 'pill-green'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${
        isPill
          ? 'rounded-full bg-card-green px-6 py-2.5 text-center text-xs font-bold tracking-widest text-white uppercase shadow-sm transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-brand/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60'
          : 'w-full rounded-lg bg-action py-3.5 text-center text-lg font-semibold text-neutral-900 shadow-sm transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-action/70 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-60'
      } ${className}`}
    >
      {loading ? 'Memproses…' : label}
    </button>
  )
}
