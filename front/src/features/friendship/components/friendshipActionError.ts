import { isRateLimitedError, isUnauthorizedError } from '../../../app/apiError'

// friendshipActionError – single message mapper for friendship mutation
// failures (accept / cancel / decline / send). 401 never logs out here —
// callers show the session message only, like PostComposer.
export function friendshipActionErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) return 'Session expired, please login again'
  if (isRateLimitedError(error)) return 'Too many requests — slow down and try again shortly'
  return 'Request failed, please try again'
}
