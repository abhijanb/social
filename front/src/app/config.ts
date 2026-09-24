import { env } from './env'

// Single source of truth for the backend origin (REST + sockets + uploads).
// Validated + trailing-slash-free via env.ts so `${base}/chat` never doubles.
export function getApiBaseUrl(): string {
  return env.VITE_API_URL
}
