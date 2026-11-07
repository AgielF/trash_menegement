interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'email' | 'password' | 'search'
  placeholder?: string
  name: string
  required?: boolean
  disabled?: boolean
  /** Pertanyaan aksesibilitas: label terlihat di layar bisa memenuhi referensi. */
  showLabel?: boolean
  error?: string | null
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'email'
}

/** Input pil putih penuh sesuai referensi login/registrasi. */
export function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  name,
  required = false,
  disabled = false,
  showLabel = false,
  error = null,
  autoComplete,
  inputMode,
}: TextFieldProps): React.ReactElement {
  return (
    <div className="w-full">
      {showLabel ? (
        <label htmlFor={name} className="mb-1 block px-5 text-xs font-medium text-neutral-700">
          {label}
        </label>
      ) : null}
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder ?? label}
        autoComplete={autoComplete}
        inputMode={inputMode}
        required={required}
        onChange={(e) => {
          onChange(e.target.value)
        }}
        aria-invalid={error !== null}
        aria-describedby={error !== null ? `${name}-error` : undefined}
        className={`h-10 w-full rounded-full border border-neutral-200 bg-white px-5 text-sm text-neutral-800 shadow-sm outline-none placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-action disabled:opacity-60 ${
          error !== null ? 'border-status-kasbon' : ''
        }`}
      />
      {error !== null ? (
        <p id={`${name}-error`} role="alert" className="mt-1 px-5 text-xs text-status-kasbon">
          {error}
        </p>
      ) : null}
    </div>
  )
}
