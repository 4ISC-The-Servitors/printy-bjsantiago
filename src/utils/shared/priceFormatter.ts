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
  // Remove any existing peso signs, commas, and whitespace
  let cleanInput = input.replace(/[₱,\s]/g, '');

  // Check if it's a valid number
  const number = parseFloat(cleanInput);
  if (isNaN(number)) {
    return input; // Return original if not a valid number
  }

  // Format with commas and add peso sign
  const formatted = number.toLocaleString('en-PH');
  return `₱${formatted}`;
}

/**
 * Extracts the numeric value from a formatted price string
 *
 * @param formattedPrice - The formatted price string (e.g., ₱30,000)
 * @returns The numeric value (e.g., 30000)
 */
export function extractNumericValue(formattedPrice: string): number {
  const cleanInput = formattedPrice.replace(/[₱,\s]/g, '');
  return parseFloat(cleanInput) || 0;
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
 * Formats a price with currency symbol and locale-specific formatting
 *
 * @param amount - The numeric amount
 * @param currency - The currency code (default: 'PHP')
 * @param locale - The locale for formatting (default: 'en-PH')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'PHP',
  locale: string = 'en-PH'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback to simple formatting if Intl is not available
    return `₱${amount.toLocaleString('en-PH')}`;
  }
}
