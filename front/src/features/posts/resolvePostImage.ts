// resolveImageUrl – turns a stored "/uploads/…" path into a fetchable absolute URL.
import { getApiBaseUrl } from '../../app/config'

export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  const base = getApiBaseUrl()
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

// resolvePostImage – legacy alias kept for backwards-compat imports.
export const resolvePostImage = resolveImageUrl
