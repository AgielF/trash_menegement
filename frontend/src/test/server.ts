import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Handler diisi bertahap per iris; satu sumber kontrak palsu untuk semua test.
export const server = setupServer(...handlers)
