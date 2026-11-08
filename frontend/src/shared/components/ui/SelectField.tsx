import type { ReactElement, ReactNode } from 'react'

export interface SelectFieldProps {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  required?: boolean
  disabled?: boolean
  error?: string | null
  className?: string
  selectClassName?: string
}

/**
 * Standard SelectField component combining Label, Select dropdown, and Error message.
 */
export function SelectField({
  label,
  name,
  value,
  onChange,
  children,
  required = false,
  disabled = false,
  error = null,
  className = '',
  selectClassName = '',
}: SelectFieldProps): ReactElement {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className="px-4 text-xs font-semibold text-neutral-700">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        aria-invalid={error !== null}
        aria-describedby={error !== null ? `${name}-error` : undefined}
        className={`h-11 w-full rounded-full border bg-white px-5 text-sm text-neutral-800 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-60 ${
          error !== null ? 'border-status-kasbon' : 'border-neutral-200'
        } ${selectClassName}`}
      >
        {children}
      </select>
      {error !== null ? (
        <p id={`${name}-error`} role="alert" className="px-4 text-xs text-status-kasbon">
          {error}
        </p>
      ) : null}
    </div>
  )
}
