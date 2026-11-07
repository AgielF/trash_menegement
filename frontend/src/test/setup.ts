import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './server'

// Handler MSW aktif untuk semua test supaya kontrak API tidak menyimpang.
// Handler kosong saat Iris 1; request tak tertangani langsung error agar kontrak salah terlihat.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
})
afterAll(() => {
  server.close()
})
