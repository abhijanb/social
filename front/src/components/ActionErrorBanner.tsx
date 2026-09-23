// ActionErrorBanner – shared banner for mutation failures (accept, send,
// save, …). Takes the raw RTK `unknown` error plus a domain message mapper
// and renders nothing when there is no error. Domain copy lives with the
// mapper in the feature; layout spacing comes from the caller via className.
export default function ActionErrorBanner({
  error,
  getMessage,
  className,
}: {
  error?: unknown
  getMessage: (error: unknown) => string
  className?: string
}) {
  if (!error) return null
  return <p className={className ?? 'text-sm text-red-600 dark:text-red-400'}>{getMessage(error)}</p>
}
