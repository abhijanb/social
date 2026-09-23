import { isRateLimitedError, isUnauthorizedError } from '../../../app/apiError'

// notificationActionError – message mapper for notification action failures
// (mark read / mark all read / delete). 401 never logs out here — callers
// show the session message only, like PostComposer.
export function notificationActionErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) return 'Session expired, please login again'
  if (isRateLimitedError(error)) return 'Too many requests — slow down and try again shortly'
  return 'Action failed, please try again'
}
