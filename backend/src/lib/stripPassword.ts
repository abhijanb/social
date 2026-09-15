// Drops the password hash from a user row before it leaves the server.
// Shared by every feature that returns users (auth, user, friendship).
export function stripPassword<T extends { password: string }>(
  user: T,
): Omit<T, "password"> {
  const { password: _password, ...safe } = user;
  return safe;
}
