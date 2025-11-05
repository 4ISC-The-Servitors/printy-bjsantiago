/**
 * Utility functions for formatting currency and prices
 */

/**
 * Formats a price input into a standardized format with peso sign and commas
 * Supports various input formats: 30000, 30,000, ₱30,000
 *
 * @param input - The price input string
 * @returns Formatted price string with peso sign (e.g., ₱30,000)
 */
export function formatPriceInput(input: string): string {
  // Keep digits and a single decimal point; strip peso, commas, spaces
  let cleanInput = input.replace(/[₱,\s]/g, '');

  // Allow only first decimal point
  const firstDot = cleanInput.indexOf('.');
  const endsWithDot = cleanInput.endsWith('.') && firstDot === cleanInput.length - 1;
  if (firstDot !== -1) {
    // Remove any additional dots
    cleanInput =
      cleanInput.substring(0, firstDot + 1) +
      cleanInput
        .substring(firstDot + 1)
        .replace(/\./g, '');
  }

  const number = parseFloat(cleanInput);
  if (isNaN(number)) {
    return input; // Return original if not a valid number
  }

  // Determine decimal places from input (up to 2)
  let decimals = 0;
  if (firstDot !== -1) {
    const decimalPart = cleanInput.substring(firstDot + 1);
    decimals = Math.min(2, decimalPart.length);
  }

  const formatted = number.toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: 2,
  });
  // Preserve trailing decimal point while user is typing
  return `₱${formatted}${endsWithDot ? '.' : ''}`;
}

/**
 * Extracts the numeric value from a formatted price string
 *
 * @param formattedPrice - The formatted price string (e.g., ₱30,000)
 * @returns The numeric value (e.g., 30000)
 */
export function extractNumericValue(formattedPrice: string): number {
  const cleanInput = formattedPrice.replace(/[₱,\s,]/g, '');
  const n = parseFloat(cleanInput);
  return isNaN(n) ? 0 : n;
}

/**
 * Validates if a string is a valid price format
 *
 * @param input - The input string to validate
 * @returns True if the input is a valid price format
 */
export function isValidPriceInput(input: string): boolean {
  const formatted = formatPriceInput(input);
  return formatted.includes('₱') && /[\d,]/.test(formatted);
}

/**
 * Formats a price with the Peso symbol and locale-specific number formatting
 *
 * @param amount - The numeric amount
 * @param locale - The locale for formatting (default: 'en-PH')
 * @returns Formatted string prefixed with the Peso sign (e.g., ₱30,000.50)
 */
export function formatCurrency(amount: number, locale: string = 'en-PH'): string {
  try {
    // Show up to 2 decimals; do not force .00 for whole numbers
    const hasCents = Math.round(amount * 100) % 100 !== 0;
    const formatted = amount.toLocaleString(locale, {
      minimumFractionDigits: hasCents ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return `₱${formatted}`;
  } catch (error) {
    return `₱${amount.toLocaleString('en-PH')}`;
  }
}
