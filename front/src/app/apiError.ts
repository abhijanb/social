// Shared HTTP status helpers – single source of truth for RTK Query
// error checks (migrated from 11 duplicated copies across pages/hooks).
export function isUnauthorizedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 401
}

export function isNotFoundError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 404
}

export function isForbiddenError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 403
}

// 429 from express-rate-limit (Retry-After header set server-side).
// Unlike 401 this never logs out — callers keep last good data and
// show a "slow down" message instead.
export function isRateLimitedError(error: unknown): boolean {
  return !!error && typeof error === 'object' && 'status' in error && (error as { status: number }).status === 429
}
