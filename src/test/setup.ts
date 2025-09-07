import '@testing-library/jest-dom'

// Mock IndexedDB for testing
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
}

Object.defineProperty(window, 'indexedDB', {
  value: mockIndexedDB,
  writable: true,
})

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}
