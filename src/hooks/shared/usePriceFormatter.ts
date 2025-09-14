import { useCallback } from 'react';
import {
  formatPriceInput,
  isValidPriceInput,
  extractNumericValue,
  formatCurrency,
} from '../../utils/shared';

/**
 * Hook for price formatting functionality
 * Provides utilities for formatting, validating, and extracting price values
 */
export const usePriceFormatter = () => {
  /**
   * Formats a price input into a standardized format with peso sign and commas
   */
  const formatPriceValue = useCallback((input: string): string => {
    return formatPriceInput(input);
  }, []);

  /**
   * Validates if a string is a valid price format
   */
  const validatePrice = useCallback((input: string): boolean => {
    return isValidPriceInput(input);
  }, []);

  /**
   * Extracts the numeric value from a formatted price string
   */
  const getNumericValue = useCallback((formattedPrice: string): number => {
    return extractNumericValue(formattedPrice);
  }, []);

  /**
   * Formats a numeric amount as currency
   */
  const formatAsCurrency = useCallback(
    (
      amount: number,
      currency: string = 'PHP',
      locale: string = 'en-PH'
    ): string => {
      return formatCurrency(amount, currency, locale);
    },
    []
  );

  /**
   * Creates a price input handler that formats the value as the user types
   */
  const createPriceInputHandler = useCallback(
    (onChange: (formattedValue: string, numericValue: number) => void) => {
      return (inputValue: string) => {
        const formatted = formatPriceInput(inputValue);
        const numeric = extractNumericValue(formatted);

        if (isValidPriceInput(inputValue)) {
          onChange(formatted, numeric);
        }
      };
    },
    []
  );

  return {
    formatPrice: formatPriceValue,
    isValidPrice: validatePrice,
    getNumericValue,
    formatAsCurrency,
    createPriceInputHandler,
  };
};

export default usePriceFormatter;
