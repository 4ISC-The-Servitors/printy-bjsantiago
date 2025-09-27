/**
 * Formats a timestamp or Date into a short time like 08:03 PM (no seconds).
 */
export function formatShortTime(input: number | string | Date): string {
  try {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

/**
 * Returns a relative time label with minute/hour granularity, falling back to short time.
 * Examples: "Just now", "1 min ago", "12 mins ago", "1 hr ago", "3 hrs ago".
 */
export function formatRelativeTimeLabel(
  input: number | string | Date,
  now: number = Date.now()
): string {
  try {
    const ts =
      input instanceof Date ? input.getTime() : new Date(input).getTime();
    const diffMs = Math.max(0, now - ts);
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin <= 0) return 'Just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} mins ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr === 1) return '1 hr ago';
    if (diffHr < 24) return `${diffHr} hrs ago`;
    return formatShortTime(ts);
  } catch {
    return '';
  }
}
