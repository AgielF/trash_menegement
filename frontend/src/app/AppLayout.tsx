import type { ReactNode } from 'react'
import { BottomNavigation } from './BottomNavigation'

/**
 * Kerangka aplikasi: konten di atas, bottom navigation menempel di bawah.
 * Header melengkung dirender tiap halaman (Beranda/Daftar Rumah punya isi berbeda),
 * sedangkan bentuk lengkung hijau dibagi lewat utilitas CSS berikut.
 */
export function AppLayout({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <div className="flex min-h-dvh flex-col bg-surface font-sans">
      <main className="min-h-0 flex-1">{children}</main>
      <BottomNavigation />
    </div>
  )
}

/** Header hijau melengkung bawah — slot isi dibebaskan ke halaman. */
export function CurvedHeader({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <header className="relative z-0 rounded-b-[2.5rem] bg-brand px-5 pt-4 pb-10 text-white">
      {children}
    </header>
  )
}
