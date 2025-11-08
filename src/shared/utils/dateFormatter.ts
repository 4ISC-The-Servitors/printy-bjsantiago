/**
 * Formats a timestamp or Date into "Month D, YYYY" (e.g., May 2, 2025)
 */
export function formatShortDate(input: number | string | Date): string {
  try {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Formats a timestamp or Date for desktop view: "October 12, 2024"
 */
export function formatOrderDateDesktop(input: number | string | Date): string {
  try {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Formats a timestamp or Date for tablet view: "Oct 12, 2024"
 */
export function formatOrderDateTablet(input: number | string | Date): string {
  try {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Formats a timestamp or Date for mobile view: "Oct 12"
 */
export function formatOrderDateMobile(input: number | string | Date): string {
  try {
    const d = input instanceof Date ? input : new Date(input);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

/**
 * Formats a timestamp or Date for desktop view with time: "Oct 26, 2025 • 11:36 PM"
 */
export function formatDateWithTimeDesktop(
  input: number | string | Date
): string {
  try {
    const d = input instanceof Date ? input : new Date(input);
    const date = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const time = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${date} • ${time}`;
  } catch {
    return '';
  }
}

/**
 * Formats a timestamp or Date for tablet view with time: "Oct 26, 2025 • 11:36 PM"
 */
export function formatDateWithTimeTablet(
  input: number | string | Date
): string {
  try {
    const d = input instanceof Date ? input : new Date(input);
    const date = d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const time = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${date} • ${time}`;
  } catch {
    return '';
  }
}

/**
 * Formats a timestamp or Date for mobile view with time: "Oct 26 • 11:36 PM"
 */
export function formatDateWithTimeMobile(
  input: number | string | Date
): string {
  try {
    const d = input instanceof Date ? input : new Date(input);
    const date = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const time = d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${date} • ${time}`;
  } catch {
    return '';
  }
}
