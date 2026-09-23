import { isRateLimitedError, isUnauthorizedError } from '../../../app/apiError'

// chatActionError – message mapper for chat send failures. 401 never logs
// out here — callers show the session message only, like PostComposer.
export function chatActionErrorMessage(error: unknown): string {
  if (isUnauthorizedError(error)) return 'Session expired, please login again'
  if (isRateLimitedError(error)) return 'Too many requests — slow down and try again shortly'
  return 'Message failed to send'
}
