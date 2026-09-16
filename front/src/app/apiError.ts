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
