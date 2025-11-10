/**
 * Utility functions for validating and formatting various form inputs.
 * Designed for use across the PRINTY platform (Sign-Up, Profile, Checkout forms)
 */

/* --------------------------------------------------
 * ✅ NAME VALIDATION & FORMATTING
 * -------------------------------------------------- */

/**
 * Unicode ranges for letters including:
 * - Basic Latin letters (A-Z, a-z)
 * - Extended Latin with accents (À-ÿ, including ñ/Ñ)
 * - Common accented characters used in Filipino/Spanish names
 * Allows spaces but no numbers, apostrophes, hyphens, or other special characters
 */
const NAME_REGEX = /^[A-Za-zÀ-ÿ\u00C0-\u017F\s]+$/;

/**
 * Checks if a first name is valid.
 * - Allows letters (including accented characters like ñ, Ñ)
 * - Allows spaces (for names like "John Michael LeBron")
 * - No numbers or special characters
 * - Max 50 characters
 * - Must follow proper noun format (each word starts with capital letter)
 */
export function isValidFirstName(firstName: string): boolean {
  const trimmed = firstName.trim();
  if (!trimmed || trimmed.length === 0) return false;
  if (trimmed.length > 50) return false;
  if (trimmed.length < 2) return false;
  if (!NAME_REGEX.test(trimmed)) return false;
  // Check proper noun format (each word starts with capital letter)
  if (!isProperNounFormat(trimmed)) return false;
  return true;
}

/**
 * Checks if a last name is valid.
 * - Allows letters (including accented characters like ñ, Ñ)
 * - Allows spaces (for names like "Delos Santos")
 * - No numbers or special characters
 * - Max 50 characters
 * - Must follow proper noun format (each word starts with capital letter)
 */
export function isValidLastName(lastName: string): boolean {
  const trimmed = lastName.trim();
  if (!trimmed || trimmed.length === 0) return false;
  if (trimmed.length > 50) return false;
  if (trimmed.length < 2) return false;
  if (!NAME_REGEX.test(trimmed)) return false;
  // Check proper noun format (each word starts with capital letter)
  if (!isProperNounFormat(trimmed)) return false;
  return true;
}

/**
 * Legacy function for backward compatibility.
 * Uses firstName validation rules.
 * @deprecated Use isValidFirstName() or isValidLastName() instead
 */
export function isValidName(name: string): boolean {
  return isValidFirstName(name);
}

/**
 * Maximum length for first and last name fields
 */
const MAX_NAME_LENGTH = 50;

/**
 * Checks if text follows proper noun capitalization rules.
 * Each word must start with an uppercase letter.
 * Examples: "John Michael" ✓, "Delos Santos" ✓, "john" ✗, "John michael" ✗
 */
export function isProperNounFormat(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Split by spaces and check each word
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);

  // For names, all words should start with letters (after formatNameInput)
  // So we require at least one word and all letter-words must be capitalized
  let hasLetterWord = false;

  for (const word of words) {
    const firstChar = word.charAt(0);
    if (/[A-Za-zÀ-ÿ\u00C0-\u017F]/.test(firstChar)) {
      hasLetterWord = true;
      // If it starts with a letter, it must be uppercase
      if (!/[A-ZÀ-ÖØ-Þ]/.test(firstChar)) {
        return false;
      }
    }
  }

  // Names should have at least one word with letters
  return hasLetterWord;
}

/**
 * Checks if address text follows proper noun capitalization rules.
 * Words that start with letters must be capitalized, but numbers and special characters are allowed.
 * Examples: "123 Main Street" ✓, "Building 5-A" ✓, "main street" ✗
 */
export function isAddressProperNounFormat(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Split by spaces and check each word
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);

  // At least one word must start with a letter (to ensure it's not all numbers/special chars)
  let hasLetterWord = false;

  for (const word of words) {
    const firstChar = word.charAt(0);
    if (/[A-Za-zÀ-ÿ\u00C0-\u017F]/.test(firstChar)) {
      hasLetterWord = true;
      // If it starts with a letter, it must be uppercase
      if (!/[A-ZÀ-ÖØ-Þ]/.test(firstChar)) {
        return false;
      }
    }
  }

  // If there are no letter words, it's invalid (addresses should have at least one word with letters)
  return hasLetterWord;
}

/**
 * Checks if building number/name follows proper format.
 * - Allows pure numbers (e.g., "123")
 * - Allows numbers with special characters (e.g., "123-A", "5-B")
 * - If words contain letters, they must start with a capital letter
 * - Does NOT require at least one letter word (unlike isAddressProperNounFormat)
 * Examples: "123" ✓, "123-A" ✓, "Building 5-A" ✓, "building 5-A" ✗
 */
export function isBuildingNumberFormat(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;

  // Split by spaces and check each word
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);

  // Check each word - if it starts with a letter, it must be uppercase
  for (const word of words) {
    const firstChar = word.charAt(0);
    if (/[A-Za-zÀ-ÿ\u00C0-\u017F]/.test(firstChar)) {
      // If it starts with a letter, it must be uppercase
      if (!/[A-ZÀ-ÖØ-Þ]/.test(firstChar)) {
        return false;
      }
    }
  }

  // Pure numbers, numbers with special chars, or properly capitalized letter words are all valid
  return true;
}

/**
 * Formats text to proper noun format (capitalizes first letter of each word).
 * Useful for formatting names and addresses on blur or submit.
 *
 * Examples:
 * - "john michael" → "John Michael"
 * - "delos santos" → "Delos Santos"
 * - "MAIN STREET" → "Main Street"
 * - "123 main street" → "123 Main Street"
 * - "building 5-a" → "Building 5-A"
 */
export function formatToProperNoun(text: string): string {
  if (!text) return '';

  const trimmed = text.trim();
  if (!trimmed) return '';

  return trimmed
    .split(/\s+/)
    .map(word => {
      if (!word) return '';

      // Find the first letter in the word (skip numbers/special chars at start)
      let firstLetterIndex = -1;
      for (let i = 0; i < word.length; i++) {
        if (/[A-Za-zÀ-ÿ\u00C0-\u017F]/.test(word[i])) {
          firstLetterIndex = i;
          break;
        }
      }

      // If no letter found, return word as is (e.g., "123", "-")
      if (firstLetterIndex === -1) {
        return word;
      }

      // Capitalize first letter, lowercase the rest of the letters
      // But preserve numbers and special characters
      const beforeLetter = word.slice(0, firstLetterIndex);
      const firstLetter = word[firstLetterIndex].toUpperCase();
      const afterLetter = word.slice(firstLetterIndex + 1);

      // Lowercase only the letters after the first letter
      const afterLetterLowercased = afterLetter
        .split('')
        .map(char => {
          if (/[A-Za-zÀ-ÿ\u00C0-\u017F]/.test(char)) {
            return char.toLowerCase();
          }
          return char;
        })
        .join('');

      return beforeLetter + firstLetter + afterLetterLowercased;
    })
    .filter(word => word.length > 0)
    .join(' ');
}

/**
 * Formats a name input — removes invalid characters and preserves spaces.
 * Removes numbers and special characters (except spaces).
 * Allows spaces in the middle of names (e.g., "John Michael LeBron", "Delos Santos").
 * Limits input to MAX_NAME_LENGTH (50) characters to prevent exceeding validation limits.
 *
 * Note: This function only removes invalid characters and normalizes spacing.
 * It does NOT trim or aggressively capitalize to avoid interfering with user typing.
 * Validation will check for proper noun format, and formatting can be applied on blur/submit.
 */
export function formatNameInput(input: string): string {
  if (!input) return '';

  // Remove all characters except letters (including accented) and spaces
  let cleaned = input.replace(/[^A-Za-zÀ-ÿ\u00C0-\u017F\s]/g, '');
  // Normalize multiple consecutive spaces to single space (but preserve single spaces)
  cleaned = cleaned.replace(/\s{2,}/g, ' ');
  // Limit to max length to prevent exceeding validation limits
  cleaned = cleaned.slice(0, MAX_NAME_LENGTH);

  // Don't trim - allow spaces at the beginning/end while user is typing
  // The validation will check for proper format, and we can trim on blur/submit if needed
  return cleaned;
}

/**
 * Returns a real-time validation message for a first name.
 * Empty string means valid.
 */
export function getFirstNameValidationMessage(firstName: string): string {
  const trimmed = firstName.trim();
  if (!trimmed) return 'First name cannot be empty.';
  if (trimmed.length < 2)
    return 'First name must be at least 2 characters long.';
  if (trimmed.length > 50) return 'First name cannot exceed 50 characters.';
  if (!NAME_REGEX.test(trimmed)) {
    if (/[0-9]/.test(trimmed)) return 'First name cannot contain numbers.';
    if (/[^A-Za-zÀ-ÿ\u00C0-\u017F\s]/.test(trimmed))
      return 'First name can only contain letters and spaces.';
    return 'First name is invalid.';
  }
  // Check proper noun format
  if (!isProperNounFormat(trimmed)) {
    return 'First name must start with a capital letter (e.g., "John Michael").';
  }
  if (!isValidFirstName(trimmed)) {
    return 'First name is invalid.';
  }
  return '';
}

/**
 * Returns a real-time validation message for a last name.
 * Empty string means valid.
 */
export function getLastNameValidationMessage(lastName: string): string {
  const trimmed = lastName.trim();
  if (!trimmed) return 'Last name cannot be empty.';
  if (trimmed.length < 2)
    return 'Last name must be at least 2 characters long.';
  if (trimmed.length > 50) return 'Last name cannot exceed 50 characters.';
  if (!NAME_REGEX.test(trimmed)) {
    if (/[0-9]/.test(trimmed)) return 'Last name cannot contain numbers.';
    if (/[^A-Za-zÀ-ÿ\u00C0-\u017F\s]/.test(trimmed))
      return 'Last name can only contain letters and spaces.';
    return 'Last name is invalid.';
  }
  // Check proper noun format
  if (!isProperNounFormat(trimmed)) {
    return 'Last name must start with a capital letter (e.g., "Delos Santos").';
  }
  if (!isValidLastName(trimmed)) {
    return 'Last name is invalid.';
  }
  return '';
}

/**
 * Legacy function for backward compatibility.
 * Uses firstName validation message.
 * @deprecated Use getFirstNameValidationMessage() or getLastNameValidationMessage() instead
 */
export function getNameValidationMessage(name: string): string {
  return getFirstNameValidationMessage(name);
}

/* --------------------------------------------------
 * ✅ EMAIL VALIDATION
 * -------------------------------------------------- */

/**
 * Maximum length for email addresses (RFC 5321)
 */
const MAX_EMAIL_LENGTH = 254;

/**
 * Validates email format following industry standards.
 * Checks:
 * - Basic format (local@domain)
 * - No spaces
 * - Valid characters
 * - Domain has valid TLD
 * - No consecutive dots
 * - Appropriate length
 */
export function isValidEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed) return false;

  // Check length (RFC 5321: max 254 characters)
  if (trimmed.length > MAX_EMAIL_LENGTH) return false;

  // Check for spaces
  if (/\s/.test(trimmed)) return false;

  // Check for @ symbol
  const atIndex = trimmed.indexOf('@');
  if (atIndex === -1 || atIndex === 0) return false;

  // Check for only one @ symbol
  if (trimmed.indexOf('@', atIndex + 1) !== -1) return false;

  // Split into local and domain parts
  const localPart = trimmed.substring(0, atIndex);
  const domainPart = trimmed.substring(atIndex + 1);

  // Validate local part (before @)
  // - Cannot be empty
  // - Max 64 characters (RFC 5321)
  // - Cannot start or end with dot
  // - Cannot have consecutive dots
  if (!localPart || localPart.length > 64) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.includes('..')) return false;

  // Validate domain part (after @)
  // - Cannot be empty
  // - Must have at least one dot (for TLD)
  // - Cannot start or end with dot or hyphen
  // - Cannot have consecutive dots
  if (!domainPart || domainPart.length === 0) return false;
  if (!domainPart.includes('.')) return false;
  if (
    domainPart.startsWith('.') ||
    domainPart.endsWith('.') ||
    domainPart.startsWith('-') ||
    domainPart.endsWith('-')
  )
    return false;
  if (domainPart.includes('..')) return false;

  // Validate TLD (top-level domain)
  // - Must be at least 2 characters
  // - Must contain only letters
  const lastDotIndex = domainPart.lastIndexOf('.');
  const tld = domainPart.substring(lastDotIndex + 1);
  if (tld.length < 2) return false;
  if (!/^[a-zA-Z]+$/.test(tld)) return false;

  // Comprehensive regex for email format
  // Allows: letters, numbers, dots, hyphens, underscores, plus signs
  // Domain allows: letters, numbers, dots, hyphens
  const emailRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;

  return emailRegex.test(trimmed);
}

/**
 * Returns detailed validation message for email.
 * Provides specific feedback for common errors.
 */
export function getEmailValidationMessage(email: string): string {
  const trimmed = email.trim();

  // Empty check
  if (!trimmed) return 'Email cannot be empty.';

  // Length check
  if (trimmed.length > MAX_EMAIL_LENGTH) {
    return `Email cannot exceed ${MAX_EMAIL_LENGTH} characters.`;
  }

  // Space check
  if (/\s/.test(trimmed)) {
    return 'Email cannot contain spaces.';
  }

  // @ symbol check
  const atIndex = trimmed.indexOf('@');
  if (atIndex === -1) {
    return 'Email must contain an @ symbol.';
  }

  if (atIndex === 0) {
    return 'Email must have a local part before @ (e.g., name@example.com).';
  }

  // Multiple @ check
  if (trimmed.indexOf('@', atIndex + 1) !== -1) {
    return 'Email can only contain one @ symbol.';
  }

  // Split into parts
  const localPart = trimmed.substring(0, atIndex);
  const domainPart = trimmed.substring(atIndex + 1);

  // Local part validation
  if (!localPart) {
    return 'Email must have a local part before @ (e.g., name@example.com).';
  }

  if (localPart.length > 64) {
    return 'Email local part (before @) cannot exceed 64 characters.';
  }

  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return 'Email local part cannot start or end with a dot.';
  }

  if (localPart.includes('..')) {
    return 'Email cannot contain consecutive dots.';
  }

  // Domain part validation
  if (!domainPart) {
    return 'Email must have a domain after @ (e.g., name@example.com).';
  }

  if (!domainPart.includes('.')) {
    return 'Email domain must include a top-level domain (e.g., .com, .org).';
  }

  if (
    domainPart.startsWith('.') ||
    domainPart.endsWith('.') ||
    domainPart.startsWith('-') ||
    domainPart.endsWith('-')
  ) {
    return 'Email domain cannot start or end with a dot or hyphen.';
  }

  if (domainPart.includes('..')) {
    return 'Email domain cannot contain consecutive dots.';
  }

  // TLD validation
  const lastDotIndex = domainPart.lastIndexOf('.');
  const tld = domainPart.substring(lastDotIndex + 1);

  if (tld.length < 2) {
    return 'Email top-level domain (e.g., .com) must be at least 2 characters.';
  }

  if (!/^[a-zA-Z]+$/.test(tld)) {
    return 'Email top-level domain can only contain letters.';
  }

  // Final format check
  if (!isValidEmail(trimmed)) {
    return 'Please enter a valid email address (e.g., name@example.com).';
  }

  return '';
}

/* --------------------------------------------------
 * ✅ PASSWORD VALIDATION
 * -------------------------------------------------- */

/**
 * Special character regex pattern matching Step1Account.tsx validation
 * Allows: !@#$%^&*()_+-=[]{};':"\\|,.<>/?
 */
const PASSWORD_SPECIAL_CHAR_REGEX =
  /(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

/**
 * Checks if password has at least 8 characters
 */
export function hasPasswordMinLength(password: string): boolean {
  return password.length >= 8;
}

/**
 * Checks if password has at least one lowercase letter
 */
export function hasPasswordLowercase(password: string): boolean {
  return /(?=.*[a-z])/.test(password);
}

/**
 * Checks if password has at least one uppercase letter
 */
export function hasPasswordUppercase(password: string): boolean {
  return /(?=.*[A-Z])/.test(password);
}

/**
 * Checks if password has at least one number
 */
export function hasPasswordNumber(password: string): boolean {
  return /(?=.*\d)/.test(password);
}

/**
 * Checks if password has at least one special character
 * Matches the validation used in Step1Account.tsx
 */
export function hasPasswordSpecialChar(password: string): boolean {
  return PASSWORD_SPECIAL_CHAR_REGEX.test(password);
}

/**
 * Checks if password contains any spaces
 */
export function hasPasswordSpaces(password: string): boolean {
  return /\s/.test(password);
}

/**
 * Validates password against all requirements:
 * - At least 8 characters
 * - One lowercase letter
 * - One uppercase letter
 * - One number
 * - One special character
 * - No spaces
 */
export function isValidPassword(password: string): boolean {
  if (!password) return false;
  if (hasPasswordSpaces(password)) return false;
  return (
    hasPasswordMinLength(password) &&
    hasPasswordLowercase(password) &&
    hasPasswordUppercase(password) &&
    hasPasswordNumber(password) &&
    hasPasswordSpecialChar(password)
  );
}

/**
 * Formats password input by removing spaces
 * Should be called in onChange handlers to prevent spaces
 */
export function formatPasswordInput(input: string): string {
  return input.replace(/\s/g, '');
}

/**
 * Returns password requirements array for UI display
 * Matches the structure used in Step1Account.tsx
 */
export interface PasswordRequirement {
  text: string;
  isValid: boolean;
}

export function getPasswordRequirements(
  password: string
): PasswordRequirement[] {
  return [
    {
      text: 'At least 8 characters',
      isValid: hasPasswordMinLength(password),
    },
    {
      text: 'One lowercase letter',
      isValid: hasPasswordLowercase(password),
    },
    {
      text: 'One uppercase letter',
      isValid: hasPasswordUppercase(password),
    },
    {
      text: 'One number',
      isValid: hasPasswordNumber(password),
    },
    {
      text: 'One special character',
      isValid: hasPasswordSpecialChar(password),
    },
  ];
}

export function doPasswordsMatch(pw: string, confirm: string): boolean {
  return pw === confirm;
}

/**
 * Returns a real-time validation message for a given password.
 * Empty string means valid.
 */
export function getPasswordValidationMessage(password: string): string {
  if (!password.trim()) return 'Password cannot be empty.';
  if (hasPasswordSpaces(password)) return 'Password cannot contain spaces.';
  if (!hasPasswordMinLength(password))
    return 'Password must be at least 8 characters.';
  if (!hasPasswordLowercase(password))
    return 'Password must include at least one lowercase letter.';
  if (!hasPasswordUppercase(password))
    return 'Password must include at least one uppercase letter.';
  if (!hasPasswordNumber(password))
    return 'Password must include at least one number.';
  if (!hasPasswordSpecialChar(password))
    return 'Password must include at least one special character.';
  return '';
}

/* --------------------------------------------------
 * ✅ PHONE VALIDATION (PH FORMAT)
 * -------------------------------------------------- */

export function normalizePhone(raw: string): string {
  let v = raw.trim();
  if (!v) return '';
  if (!v.startsWith('+63'))
    v = '+63' + v.replace(/^\+?63/, '').replace(/^0+/, '');
  v = '+63' + v.slice(3).replace(/\D/g, '');
  return v;
}

export function isValidPhone(phone: string): boolean {
  return /^\+639\d{9}$/.test(normalizePhone(phone));
}

export function getPhoneValidationMessage(phone: string): string {
  if (!phone.trim()) return 'Phone number cannot be empty.';
  if (!isValidPhone(phone))
    return 'Enter a valid PH mobile number (e.g., +639XXXXXXXXX).';
  return '';
}

/* --------------------------------------------------
 * ✅ BIRTHDAY VALIDATION
 * -------------------------------------------------- */

/**
 * Minimum year for birthday validation (150 years ago from current year)
 * Industry standard: typically 100-150 years for realistic birth dates
 */
const MIN_BIRTHDAY_YEAR = new Date().getFullYear() - 150;

/**
 * Maximum year for birthday validation (current year)
 * Users cannot be born in the future
 */
const MAX_BIRTHDAY_YEAR = new Date().getFullYear();

/**
 * Minimum age requirement (18 years old)
 */
const MIN_AGE = 18;

/**
 * Parses a date string and returns a Date object.
 * Handles multiple date formats commonly used:
 * - ISO format (YYYY-MM-DD) - standard for HTML date inputs
 * - US format (MM/DD/YYYY)
 * - Other formats (DD/MM/YYYY, YYYY/MM/DD)
 */
function parseBirthdayDate(dateString: string): Date | null {
  if (!dateString || !dateString.trim()) return null;

  const trimmed = dateString.trim();

  // Try ISO format first (YYYY-MM-DD) - most common for HTML date inputs
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(trimmed + 'T00:00:00');
    if (!isNaN(date.getTime())) return date;
  }

  // Try MM/DD/YYYY format (US format)
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const part1 = parseInt(parts[0], 10);
    const part2 = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Try MM/DD/YYYY first (if first part is 1-12 and second part is 1-31)
    if (part1 >= 1 && part1 <= 12 && part2 >= 1 && part2 <= 31) {
      const month = part1 - 1; // Month is 0-indexed
      const day = part2;
      const date = new Date(year, month, day);
      if (
        !isNaN(date.getTime()) &&
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }

    // Try DD/MM/YYYY format (if first part > 12, it must be day)
    if (part1 > 12 && part1 <= 31 && part2 >= 1 && part2 <= 12) {
      const day = part1;
      const month = part2 - 1;
      const date = new Date(year, month, day);
      if (
        !isNaN(date.getTime()) &&
        date.getFullYear() === year &&
        date.getMonth() === month &&
        date.getDate() === day
      ) {
        return date;
      }
    }
  }

  // Try generic Date parsing as fallback
  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    // Verify the parsed date makes sense (not invalid dates like Feb 30)
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const testDate = new Date(year, month, day);
    if (
      testDate.getFullYear() === year &&
      testDate.getMonth() === month &&
      testDate.getDate() === day
    ) {
      return date;
    }
  }

  return null;
}

/**
 * Validates a birthday date string.
 * Checks:
 * - Date is valid and parseable
 * - Year is within reasonable range (MIN_BIRTHDAY_YEAR to MAX_BIRTHDAY_YEAR)
 * - Age is at least 18 years old
 * - Date is not in the future
 */
export function isValidBirthday(date: string): boolean {
  if (!date || !date.trim()) return false;

  const birthDate = parseBirthdayDate(date);
  if (!birthDate) return false;

  const year = birthDate.getFullYear();

  // Check year range (150 years ago to current year)
  if (year < MIN_BIRTHDAY_YEAR || year > MAX_BIRTHDAY_YEAR) {
    return false;
  }

  // Check that date is not in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const birthDateNormalized = new Date(birthDate);
  birthDateNormalized.setHours(0, 0, 0, 0);

  if (birthDateNormalized > today) {
    return false;
  }

  // Calculate age
  const age =
    today.getFullYear() -
    birthDate.getFullYear() -
    (today <
    new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      ? 1
      : 0);

  return age >= MIN_AGE;
}

/**
 * Returns a detailed validation message for a birthday.
 * Empty string means valid.
 */
export function getBirthdayValidationMessage(date: string): string {
  if (!date || !date.trim()) return 'Birthday cannot be empty.';

  const birthDate = parseBirthdayDate(date);

  // Check if date is parseable
  if (!birthDate) {
    return 'Please enter a valid date (e.g., MM/DD/YYYY or YYYY-MM-DD).';
  }

  const year = birthDate.getFullYear();
  const today = new Date();

  // Check year range
  if (year < MIN_BIRTHDAY_YEAR) {
    return `Birth year cannot be before ${MIN_BIRTHDAY_YEAR}.`;
  }

  if (year > MAX_BIRTHDAY_YEAR) {
    return 'Birth date cannot be in the future.';
  }

  // Check if date is in the future
  const todayNormalized = new Date(today);
  todayNormalized.setHours(0, 0, 0, 0);
  const birthDateNormalized = new Date(birthDate);
  birthDateNormalized.setHours(0, 0, 0, 0);

  if (birthDateNormalized > todayNormalized) {
    return 'Birth date cannot be in the future.';
  }

  // Check age requirement
  const age =
    today.getFullYear() -
    birthDate.getFullYear() -
    (today <
    new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      ? 1
      : 0);

  if (age < MIN_AGE) {
    return `You must be at least ${MIN_AGE} years old.`;
  }

  // Verify date is valid (e.g., not Feb 30)
  const month = birthDate.getMonth();
  const day = birthDate.getDate();
  const testDate = new Date(year, month, day);
  if (
    testDate.getFullYear() !== year ||
    testDate.getMonth() !== month ||
    testDate.getDate() !== day
  ) {
    return 'Please enter a valid date.';
  }

  return '';
}

/* --------------------------------------------------
 * ✅ ADDRESS VALIDATION
 * -------------------------------------------------- */

export function isRequiredFieldFilled(value: string): boolean {
  return value.trim().length > 0;
}

export function getRequiredFieldMessage(label: string, value: string): string {
  if (!isRequiredFieldFilled(value)) return `${label} cannot be empty.`;
  return '';
}

/**
 * Formats ZIP code input to only allow numbers, limit to 4 digits, and pad to 4 digits.
 */
export function formatZipCodeInput(
  input: string | number | null | undefined
): string {
  // Convert to string if it's a number
  const inputStr =
    typeof input === 'number' ? String(input) : String(input || '');
  // Remove all non-numeric characters
  const numbersOnly = inputStr.replace(/\D/g, '');
  // Limit to 4 digits
  const limited = numbersOnly.slice(0, 4);
  // Pad to 4 digits with leading zeros
  return limited.padStart(4, '0');
}

/**
 * Validates a ZIP code.
 * Philippine ZIP codes are 4 digits.
 * Only accepts numeric digits (0-9).
 */
export function isValidZipCode(
  zip: string | number | null | undefined
): boolean {
  if (zip === null || zip === undefined) return false;
  const zipStr = typeof zip === 'number' ? String(zip) : String(zip || '');
  const trimmed = zipStr.trim();
  if (!trimmed) return false;
  // Must be exactly 4 digits
  return /^\d{4}$/.test(trimmed);
}

/**
 * Returns a validation message for a ZIP code.
 * Empty string means valid.
 */
export function getZipValidationMessage(
  zip: string | number | null | undefined
): string {
  // Handle null, undefined, or empty values
  if (zip === null || zip === undefined) return 'ZIP Code cannot be empty.';

  // Convert to string if it's a number
  const zipStr = typeof zip === 'number' ? String(zip) : String(zip || '');
  const trimmed = zipStr.trim();

  if (!trimmed) return 'ZIP Code cannot be empty.';
  if (!/^\d+$/.test(trimmed)) return 'ZIP Code must contain only numbers.';
  if (trimmed.length !== 4) return 'ZIP Code must be exactly 4 digits.';
  if (!isValidZipCode(trimmed)) return 'ZIP Code must be 4 digits.';
  return '';
}

/**
 * Checks for basic address consistency (province, city, barangay)
 */
export function isCompleteAddress(address: {
  region?: string;
  province?: string;
  city?: string;
  barangay?: string;
  street?: string;
  zipCode?: string;
}): boolean {
  return (
    !!address.region &&
    !!address.province &&
    !!address.city &&
    !!address.barangay &&
    !!address.street &&
    !!address.zipCode
  );
}

/**
 * Maximum length for address text fields (street, barangay, building number)
 */
const MAX_ADDRESS_FIELD_LENGTH = 100;

/**
 * Validates optional building name/number (alphanumeric only)
 */
export function isValidBuildingName(input: string): boolean {
  return /^[A-Za-z0-9\s\-.,#]*$/.test(input.trim());
}

/**
 * Validates street address field.
 * - Required field
 * - Max 100 characters
 * - Must follow proper noun format (words that start with letters must be capitalized)
 */
export function isValidStreet(street: string): boolean {
  const trimmed = street.trim();
  if (!trimmed) return false;
  if (trimmed.length > MAX_ADDRESS_FIELD_LENGTH) return false;
  // Check proper noun format for addresses (allows numbers, but letter words must be capitalized)
  if (!isAddressProperNounFormat(trimmed)) return false;
  return true;
}

/**
 * Returns validation message for street address.
 * Empty string means valid.
 */
export function getStreetValidationMessage(street: string): string {
  const trimmed = street.trim();
  if (!trimmed) return 'Street cannot be empty.';
  if (trimmed.length > MAX_ADDRESS_FIELD_LENGTH)
    return `Street cannot exceed ${MAX_ADDRESS_FIELD_LENGTH} characters.`;
  // Check proper noun format for addresses
  if (!isAddressProperNounFormat(trimmed)) {
    return 'Street name must start with a capital letter (e.g., "123 Main Street").';
  }
  return '';
}

/**
 * Validates barangay field.
 * - Required field
 * - Max 100 characters
 * - Must follow proper noun format (words that start with letters must be capitalized)
 */
export function isValidBarangay(barangay: string): boolean {
  const trimmed = barangay.trim();
  if (!trimmed) return false;
  if (trimmed.length > MAX_ADDRESS_FIELD_LENGTH) return false;
  // Check proper noun format for addresses (allows numbers, but letter words must be capitalized)
  if (!isAddressProperNounFormat(trimmed)) return false;
  return true;
}

/**
 * Returns validation message for barangay.
 * Empty string means valid.
 */
export function getBarangayValidationMessage(barangay: string): string {
  const trimmed = barangay.trim();
  if (!trimmed) return 'Barangay cannot be empty.';
  if (trimmed.length > MAX_ADDRESS_FIELD_LENGTH)
    return `Barangay cannot exceed ${MAX_ADDRESS_FIELD_LENGTH} characters.`;
  // Check proper noun format for addresses
  if (!isAddressProperNounFormat(trimmed)) {
    return 'Barangay name must start with a capital letter (e.g., "Barangay Poblacion").';
  }
  return '';
}

/**
 * Validates building number/name field (optional).
 * - Optional field (empty is valid)
 * - Max 100 characters if provided
 * - Allows pure numbers (e.g., "123")
 * - Allows numbers with special characters (e.g., "123-A")
 * - If words contain letters, they must start with a capital letter
 */
export function isValidBuildingNumber(buildingNumber: string): boolean {
  const trimmed = buildingNumber.trim();
  if (!trimmed) return true; // Optional field
  if (trimmed.length > MAX_ADDRESS_FIELD_LENGTH) return false;
  // Check building number format (allows pure numbers, but letter words must be capitalized)
  if (!isBuildingNumberFormat(trimmed)) return false;
  return true;
}

/**
 * Returns validation message for building number.
 * Empty string means valid.
 */
export function getBuildingNumberValidationMessage(
  buildingNumber: string
): string {
  const trimmed = buildingNumber.trim();
  if (!trimmed) return ''; // Optional field, empty is valid
  if (trimmed.length > MAX_ADDRESS_FIELD_LENGTH)
    return `Building number cannot exceed ${MAX_ADDRESS_FIELD_LENGTH} characters.`;
  // Check building number format (allows pure numbers, but letter words must be capitalized)
  if (!isBuildingNumberFormat(trimmed)) {
    return 'If building name contains letters, they must start with a capital letter (e.g., "Tower A" or "Building 5-A").';
  }
  return '';
}

/* --------------------------------------------------
 * ✅ GENDER VALIDATION
 * -------------------------------------------------- */

export function isValidGender(gender: string): boolean {
  return ['male', 'female', 'other', 'prefer-not-to-say'].includes(
    gender.toLowerCase()
  );
}

/* --------------------------------------------------
 * ✅ TERMS VALIDATION
 * -------------------------------------------------- */

export function hasAgreedToTerms(agree: boolean): boolean {
  return agree === true;
}

/* --------------------------------------------------
 * ✅ FORM GROUP VALIDATORS
 * -------------------------------------------------- */

/**
 * Validates Step 1 (Account Info)
 * Checks email format, password requirements (8+ chars, uppercase, lowercase, number, special char, no spaces),
 * and password confirmation match
 */
export function validateStep1(data: {
  email: string;
  password: string;
  confirmPassword: string;
}): string {
  if (!isValidEmail(data.email)) return 'Invalid email format.';

  const passwordError = getPasswordValidationMessage(data.password);
  if (passwordError) return passwordError;

  if (!doPasswordsMatch(data.password, data.confirmPassword))
    return 'Passwords do not match.';
  return '';
}

/**
 * Validates Step 2 (Personal Info)
 */
export function validateStep2(data: {
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  birthday: string;
}): string {
  const firstNameError = getFirstNameValidationMessage(data.firstName);
  const lastNameError = getLastNameValidationMessage(data.lastName);
  if (firstNameError) return firstNameError;
  if (lastNameError) return lastNameError;
  if (!isValidPhone(data.phone)) return 'Invalid phone number.';
  if (!isValidGender(data.gender)) return 'Please select a valid gender.';
  const birthdayError = getBirthdayValidationMessage(data.birthday);
  if (birthdayError) return birthdayError;
  return '';
}

/**
 * Validates Step 3 (Address Info)
 */
export function validateStep3(data: {
  street: string;
  barangay: string;
  province: string;
  city: string;
  region: string;
  zipCode: string;
  agreeToTerms: boolean;
  buildingNumber?: string;
}): string {
  const streetError = getStreetValidationMessage(data.street);
  if (streetError) return streetError;

  const barangayError = getBarangayValidationMessage(data.barangay);
  if (barangayError) return barangayError;

  if (data.buildingNumber) {
    const buildingError = getBuildingNumberValidationMessage(
      data.buildingNumber
    );
    if (buildingError) return buildingError;
  }

  if (!isCompleteAddress(data))
    return 'All address fields must be filled out correctly.';

  const zipError = getZipValidationMessage(data.zipCode);
  if (zipError) return zipError;

  if (!hasAgreedToTerms(data.agreeToTerms))
    return 'You must agree to the terms and conditions.';
  return '';
}

/**
 * Validates profile update data (used in CustomerAccountSettings)
 */
export function validateProfileUpdate(data: {
  first_name: string;
  last_name: string;
  contact_no: string;
  gender: string;
  birthday: string;
}): string {
  const firstNameError = getFirstNameValidationMessage(data.first_name);
  if (firstNameError) return firstNameError;
  const lastNameError = getLastNameValidationMessage(data.last_name);
  if (lastNameError) return lastNameError;
  if (!isValidPhone(data.contact_no)) return 'Invalid phone number.';
  if (!isValidGender(data.gender)) return 'Invalid gender.';
  const birthdayError = getBirthdayValidationMessage(data.birthday);
  if (birthdayError) return birthdayError;
  return '';
}
