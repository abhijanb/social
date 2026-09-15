// resolveImageUrl – turns a stored "/uploads/…" path into a fetchable absolute URL.
export function resolveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

// resolvePostImage – legacy alias kept for backwards-compat imports.
export const resolvePostImage = resolveImageUrl
