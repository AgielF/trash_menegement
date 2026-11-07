import { useState } from 'react'
import { registerSchema } from './schemas'
import { postRegister } from './api'
import { ApiError } from '@/shared/api/http'
import { Button } from '@/shared/components/ui/Button'
import { TextField } from '@/shared/components/ui/TextField'
import { AuthShell } from './AuthShell'
import { PlaceholderIllustration } from '@/shared/components/ui/Placeholder'

/** Layar Registrasi — mengikuti UI reference/Registration.png. */
export function RegisterPage(): React.ReactElement {
  const [values, setValues] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function update(field: keyof typeof values, value: string): void {
    setValues((previous) => ({ ...previous, [field]: value }))
  }

  async function submit(): Promise<void> {
    setFormError(null)
    setFormError(null)
    setSuccessMessage(null)
    const parsed = registerSchema.safeParse(values)
    if (!parsed.success) {
      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form')
        errors[key] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    setFieldErrors({})
    setLoading(true)
    try {
      const response = await postRegister(parsed.data)
      setSuccessMessage(response.message)
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Terjadi galat tak terduga. Coba lagi.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell variant="register">
      <PlaceholderIllustration label="Ilustrasi petugas (menunggu aset Figma)" />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
        className="mt-4 flex flex-col gap-3"
        noValidate
      >
        <TextField
          name="fullName"
          label="Enter your full name"
          value={values.fullName}
          onChange={(value) => {
            update('fullName', value)
          }}
          error={fieldErrors.fullName ?? null}
        />
        <TextField
          name="email"
          label="Enter your Email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(value) => {
            update('email', value)
          }}
          error={fieldErrors.email ?? null}
        />
        <TextField
          name="password"
          label="Enter Password"
          type="password"
          autoComplete="new-password"
          value={values.password}
          onChange={(value) => {
            update('password', value)
          }}
          error={fieldErrors.password ?? null}
        />
        <TextField
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          value={values.confirmPassword}
          onChange={(value) => {
            update('confirmPassword', value)
          }}
          error={fieldErrors.confirmPassword ?? null}
        />
        {formError !== null ? (
          <p role="alert" className="text-center text-sm text-status-kasbon">
            {formError}
          </p>
        ) : null}
        {successMessage !== null ? (
          <p role="status" className="text-center text-sm text-status-lunas">
            {successMessage} Silakan Sign In setelah admin menyetujui.
          </p>
        ) : null}
        <Button label="Register" type="submit" loading={loading} className="mt-4" />
      </form>
      <p className="mt-6 text-center text-sm font-medium text-neutral-900">
        Already have an account ?{' '}
        <a href="#/login" className="text-purple-link">
          Sign In
        </a>
      </p>
    </AuthShell>
  )
}
