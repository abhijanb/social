// Single source of truth for the backend origin (REST + sockets + uploads).
// Same expression the five call sites duplicated; no slash normalization.
export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'
}
