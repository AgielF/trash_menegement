/**
 * Placeholder ilustrasi/profil (blok abu-abu, persegi panjang) — dipakai
 * sementara sambil menunggu ekspor aset dari Figma. Tanpa pihak ketiga
 * (dilarang memuat gambar dari domain luar demi CSP ketat).
 */
export function PlaceholderIllustration({
  label = 'Ilustrasi (menunggu aset Figma)',
  rounded = true,
}: {
  label?: string
  rounded?: boolean
}): React.ReactElement {
  return (
    <div
      role="img"
      aria-label={label}
      className={`mx-auto grid w-full place-items-center bg-neutral-200 text-center ${rounded ? 'rounded-2xl' : ''} aspect-[4/3]`}
    >
      <span className="px-6 text-xs text-neutral-500">{label}</span>
    </div>
  )
}

/** Avatar profil bulat placeholder dengan siluet orang. */
export function PlaceholderAvatar({ size = 'h-10 w-10' }: { size?: string }): React.ReactElement {
  return (
    <span
      role="img"
      aria-label="Foto profil (menunggu aset Figma)"
      className={`grid ${size} shrink-0 place-items-center rounded-full bg-white/25`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="9" r="3.5" />
        <path d="M5.5 19a6.5 6.5 0 0 1 13 0v1h-13z" />
      </svg>
    </span>
  )
}
