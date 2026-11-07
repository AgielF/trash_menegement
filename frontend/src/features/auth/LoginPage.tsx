import { useState } from 'react'
import illustration from '@/assets/images/ilust_register.png'
import { Button } from '@/shared/components/ui/Button'
import { TextField } from '@/shared/components/ui/TextField'
import { ApiError } from '@/shared/api/http'
import { useAuthStore } from './store'
import { postLogin } from './api'
import { loginSchema } from './schemas'
import { AuthShell } from './AuthShell'
import { navigate } from '@/shared/lib/router'

/**
 * Layar Login — mengikuti UI_reference/LoginScreen.png:
 * blob hijau di sisi kiri-atas, judul, ilustrasi, dua input pil,
 * tautan "Forget password ?", tombol teal, tautan "Sign Up".
 */
export function LoginPage(): React.ReactElement {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const setSession = useAuthStore((s) => s.setSession)

  async function submit(): Promise<void> {
    setFormError(null)
    const parsed = loginSchema.safeParse({ email, password })
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
      const response = await postLogin(parsed.data)
      setSession(response.access_token, response.user)
      navigate('/')
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Terjadi galat tak terduga. Coba lagi.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell variant="login">
      <h1 className="text-center text-2xl font-bold text-neutral-900">Welcome back</h1>
      {/* Aset ilustrasi: keputusan desain — pakai ilust_register.png (task user 7 Nov). */}
      <img
        src={illustration}
        alt=""
        aria-hidden="true"
        className="mx-auto h-44 w-auto select-none"
        draggable={false}
      />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
        className="mt-6 flex flex-col gap-5"
        noValidate
      >
        <TextField
          name="email"
          label="Enter your Email"
          placeholder="Enter your Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(value) => {
            setEmail(value)
          }}
          error={fieldErrors.email ?? null}
        />
        <TextField
          name="password"
          label="Enter Password"
          placeholder="Enter Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(value) => {
            setPassword(value)
          }}
          error={fieldErrors.password ?? null}
        />
        {formError !== null ? (
          <p role="alert" className="text-center text-sm text-status-kasbon">
            {formError}
          </p>
        ) : null}
        <div className="text-center">
          {/* Layar lupa password belum ada dalam scope/referensi — tombol memancing panduan. */}
          <button
            type="button"
            className="text-sm text-purple-link"
            title="Fitur lupa password belum tersedia — hubungi admin."
            onClick={() => {
              setFormError('Fitur lupa password belum tersedia — hubungi admin.')
            }}
          >
            Forget password ?
          </button>
        </div>
        <Button label="Login" type="submit" loading={loading} />
      </form>
      <p className="text-center text-sm font-medium text-neutral-900">
        Don't have an account ?{' '}
        <a href="#/register" className="text-purple-link">
          Sign Up
        </a>
      </p>
    </AuthShell>
  )
}
