import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Vitest globals are off in this repo, so RTL's auto-cleanup never registers.
afterEach(cleanup)
