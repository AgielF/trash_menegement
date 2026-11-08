import type { ReactElement } from 'react'

export interface FormFieldProps {
  label: string
  name: string
  value: string | number
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string | null
  min?: string | number
  max?: string | number
  step?: string | number
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'email' | 'search' | 'tel' | 'url'
  className?: string
  inputClassName?: string
}

/**
 * Standard FormField component combining Label, Input, and Error message.
 */
export function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  disabled = false,
  error = null,
  min,
  max,
  step,
  autoComplete,
  inputMode,
  className = '',
  inputClassName = '',
}: FormFieldProps): ReactElement {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={name} className="px-4 text-xs font-semibold text-neutral-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        autoComplete={autoComplete}
        inputMode={inputMode}
        onChange={(event) => {
          onChange(event.target.value)
        }}
        aria-invalid={error !== null}
        aria-describedby={error !== null ? `${name}-error` : undefined}
        className={`h-11 w-full rounded-full border bg-white px-5 text-sm text-neutral-800 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-action disabled:cursor-not-allowed disabled:opacity-60 ${
          error !== null ? 'border-status-kasbon' : 'border-neutral-200'
        } ${inputClassName}`}
      />
      {error !== null ? (
        <p id={`${name}-error`} role="alert" className="px-4 text-xs text-status-kasbon">
          {error}
        </p>
      ) : null}
    </div>
  )
}
