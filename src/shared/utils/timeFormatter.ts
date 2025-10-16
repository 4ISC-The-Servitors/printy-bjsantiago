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
 * Returns a relative time label with comprehensive granularity, falling back to formatted date.
 * Examples: "Just now", "1 min ago", "12 mins ago", "1 hr ago", "3 hrs ago", "2 days ago", "1 week ago", "3 weeks ago".
 * For dates beyond 30 days, returns formatted date string.
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
    
    // Minutes
    if (diffMin <= 0) return 'Just now';
    if (diffMin === 1) return '1 min ago';
    if (diffMin < 60) return `${diffMin} mins ago`;
    
    // Hours
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr === 1) return '1 hr ago';
    if (diffHr < 24) return `${diffHr} hrs ago`;
    
    // Days
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    // Weeks
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks === 1) return '1 week ago';
    if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
    
    // Beyond 30 days (approximately 4.3 weeks), return formatted date
    const date = new Date(ts);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}
