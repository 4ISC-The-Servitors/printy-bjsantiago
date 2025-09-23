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


