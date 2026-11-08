import type { ReactElement } from 'react'
import { Search } from 'lucide-react'

export interface SearchFieldProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
  className?: string
  id?: string
  name?: string
}

/**
 * Standard SearchField component with magnifying glass icon.
 */
export function SearchField({
  value,
  onChange,
  placeholder = 'CARI...',
  ariaLabel = 'Cari',
  className = '',
  id,
  name,
}: SearchFieldProps): ReactElement {
  return (
    <div
      className={`flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-action ${className}`}
    >
      <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-neutral-400" />
      <input
        id={id}
        name={name}
        type="search"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:font-medium placeholder:text-neutral-400"
      />
    </div>
  )
}
