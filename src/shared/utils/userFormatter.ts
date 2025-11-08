/**
 * Utility functions for formatting user information
 */

interface UserInfo {
  first_name?: string | null;
  last_name?: string | null;
}

/**
 * Formats user name from user info object
 * Returns formatted full name or 'Unknown' as fallback
 */
export function formatUserName(user?: UserInfo | null): string {
  if (!user) return 'Unknown';

  const firstName = user.first_name?.trim() || '';
  const lastName = user.last_name?.trim() || '';
  const fullName = `${firstName} ${lastName}`.trim();

  return fullName || 'Unknown';
}
