import { z } from 'zod'

/**
 * Skema form + kontrak respons /auth/login dan /auth/register, sesuai
 * docs/recon-backend.md (DILARANG menebak field).
 */

export const sessionUserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string(),
  status: z.string(),
  roles: z.array(z.string()),
})

export const loginSchema = z.object({
  email: z.email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Nama lengkap wajib diisi'),
    email: z.email('Email tidak valid'),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    confirmPassword: z.string().min(6, 'Konfirmasi password wajib diisi'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi password tidak sama',
  })

export const loginResponseSchema = z.object({
  access_token: z.string().min(1),
  user: sessionUserSchema,
})

export const registerResponseSchema = z.object({ message: z.string() })

export type LoginResponse = z.infer<typeof loginResponseSchema>
export type RegisterResponse = z.infer<typeof registerResponseSchema>
export type SessionUser = LoginResponse['user']
