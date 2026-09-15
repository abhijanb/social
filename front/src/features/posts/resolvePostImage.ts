// resolvePostImage – turns a stored "/uploads/…" path into a fetchable absolute URL.
export function resolvePostImage(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl
  const base = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000'
  return `${base}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
}
