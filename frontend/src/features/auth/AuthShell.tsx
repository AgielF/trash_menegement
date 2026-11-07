/**
 * Bingkai layar login/registrasi mengikuti referensi:
 * blob hijau di sudut kiri-atas (ekor membulat ke bawah/kanan),
 * latar permukaan terang. `variant="register"` = blob lebih tinggi dengan
 * kartu ilustrasi seperti Registration.png.
 */
import type { ReactNode } from 'react'

interface AuthShellProps {
  children: ReactNode
  variant: 'login' | 'register'
}

export function AuthShell({ children, variant }: AuthShellProps): React.ReactElement {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-surface font-sans">
      <div
        aria-hidden="true"
        className={`absolute top-0 left-0 bg-brand ${variant === 'register' ? 'h-44 w-2/5 rounded-br-[70%]' : 'h-28 w-1/3 rounded-br-[80%]'}`}
      />
      <div
        className={`relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 ${variant === 'register' ? 'pt-40' : 'pt-36'} pb-8`}
      >
        {children}
      </div>
    </div>
  )
}
