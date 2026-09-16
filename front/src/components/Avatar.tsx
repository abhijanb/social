import { resolveImageUrl } from '../features/posts/resolvePostImage'

// Avatar – shared Instagram-style profile pic with initial-letter fallback.
// Shows the uploaded image when avatarUrl resolves, otherwise the first
// letter of username. object-cover keeps non-square uploads cropped.
export default function Avatar({
  username,
  avatarUrl,
  size = 'md',
  className = '',
}: {
  username: string
  avatarUrl: string | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}) {
  const src = resolveImageUrl(avatarUrl)
  const sizes = {
    xs: 'h-6 w-6 text-[11px]',
    sm: 'h-8 w-8 text-xs',
    md: 'h-9 w-9 text-sm',
    lg: 'h-14 w-14 text-base',
    xl: 'h-20 w-20 text-2xl',
  } as const
  const fallback = (username || '?').charAt(0).toUpperCase()
  if (src) {
    return (
      <img
        src={src}
        alt={`${username}'s avatar`}
        loading="lazy"
        className={`shrink-0 rounded-full bg-gray-100 object-cover dark:bg-zinc-800 ${sizes[size]} ${className}`}
      />
    )
  }
  return (
    <div
      aria-label={`${username}'s avatar`}
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-[#aa3bff] font-semibold text-white ${sizes[size]} ${className}`}
    >
      {fallback}
    </div>
  )
}
