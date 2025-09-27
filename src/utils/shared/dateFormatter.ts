/**
 * Formats a timestamp or Date into "Month D, YYYY" (e.g., May 2, 2025)
 */
export function formatLongDate(input: number | string | Date): string {
  try {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
