import type { z } from 'zod'
import { request } from '@/shared/api/http'
import { loginResponseSchema, registerResponseSchema } from './schemas'
import type { LoginResponse, RegisterResponse, loginSchema, registerSchema } from './schemas'

export async function postLogin(body: z.infer<typeof loginSchema>): Promise<LoginResponse> {
  return request({ method: 'POST', url: '/auth/login', data: body }, loginResponseSchema)
}

export async function postRegister(
  body: z.infer<typeof registerSchema>,
): Promise<RegisterResponse> {
  return request({ method: 'POST', url: '/auth/register', data: body }, registerResponseSchema)
}
