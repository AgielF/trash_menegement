import logo from '@/assets/images/logo_bersihku.png'

/**
 * Logo resmi petugas dari Figma (src/assets/images/logo_bersihku.png).
 * PNG sudah memuat teks "BERSHIKU — Petugas Lingkungan".
 */
export function Logo({ className = 'h-12 w-auto' }: { className?: string }): React.ReactElement {
  return (
    <img
      src={logo}
      alt="LOGO BERSHIKU — Petugas Lingkungan"
      className={`select-none ${className}`}
      draggable={false}
    />
  )
}
