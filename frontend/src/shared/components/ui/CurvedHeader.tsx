import type { ReactNode } from 'react'

/** Header hijau melengkung bawah — komponen UI shared (arak konsisten referensi Figma). */
export function CurvedHeader({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <header className="relative z-0 rounded-b-[2.5rem] bg-brand px-5 pt-4 pb-10 text-white">
      {children}
    </header>
  )
}
