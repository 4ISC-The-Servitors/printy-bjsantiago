/**
 * Utility functions for validating and formatting various form inputs.
 * Designed for use across the PRINTY platform (Sign-Up, Profile, Checkout forms)
 */

/* --------------------------------------------------
 * ✅ NAME VALIDATION & FORMATTING
 * -------------------------------------------------- */

/**
 * Checks if a given name is valid (letters, spaces, apostrophes, hyphens).
 */
export function isValidName(name: string): boolean {
  const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
  return regex.test(name.trim());
}

/**
 * Formats a name input — removes invalid characters, trims spaces,
 * and capitalizes each word.
 */
export function formatNameInput(input: string): string {
  let cleaned = input.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s'-]/g, '');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Returns a real-time validation message for a given name.
 * Empty string means valid.
 */
export function getNameValidationMessage(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Name field cannot be empty.';
  if (trimmed.length < 2) return 'Name must be at least 2 characters long.';
  if (!isValidName(trimmed))
    return 'Name can only contain letters no numbers or special characters.';
  return '';
}

/* --------------------------------------------------
 * ✅ EMAIL VALIDATION
 * -------------------------------------------------- */

export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.trim());
}

export function getEmailValidationMessage(email: string): string {
  if (!email.trim()) return 'Email cannot be empty.';
  if (!isValidEmail(email)) return 'Enter a valid email address.';
  return '';
}

/* --------------------------------------------------
 * ✅ PASSWORD VALIDATION
 * -------------------------------------------------- */

export function isValidPassword(password: string): boolean {
  // At least 8 characters, includes uppercase, lowercase, number, and special char
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return regex.test(password);
}

export function doPasswordsMatch(pw: string, confirm: string): boolean {
  return pw === confirm;
}

export function getPasswordValidationMessage(password: string): string {
  if (!password.trim()) return 'Password cannot be empty.';
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!isValidPassword(password))
    return 'Password must include uppercase, lowercase, and a number.';
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

export function isValidBirthday(date: string): boolean {
  if (!date) return false;
  const birthDate = new Date(date);
  if (isNaN(birthDate.getTime())) return false;

  const today = new Date();
  const age =
    today.getFullYear() -
    birthDate.getFullYear() -
    (today <
    new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      ? 1
      : 0);

  return age >= 18;
}

export function getBirthdayValidationMessage(date: string): string {
  if (!date.trim()) return 'Birthday cannot be empty.';
  if (!isValidBirthday(date)) return 'You must be at least 18 years old.';
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
 * Validates a Philippine ZIP code (4-digit)
 */
export function isValidZipCode(zip: string): boolean {
  return /^\d{4}$/.test(zip.trim());
}

export function getZipValidationMessage(zip: string): string {
  if (!zip.trim()) return 'ZIP Code cannot be empty.';
  if (!isValidZipCode(zip)) return 'ZIP Code must be 4 digits.';
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
 * Validates optional building name/number (alphanumeric only)
 */
export function isValidBuildingName(input: string): boolean {
  return /^[A-Za-z0-9\s\-.,#]*$/.test(input.trim());
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
 */
export function validateStep1(data: {
  email: string;
  password: string;
  confirmPassword: string;
}): string {
  if (!isValidEmail(data.email)) return 'Invalid email format.';
  if (!isValidPassword(data.password))
    return 'Password must be at least 8 characters and include letters & numbers.';
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
  const firstNameError = getNameValidationMessage(data.firstName);
  const lastNameError = getNameValidationMessage(data.lastName);
  if (firstNameError || lastNameError) return 'Invalid name format.';
  if (!isValidPhone(data.phone)) return 'Invalid phone number.';
  if (!isValidGender(data.gender)) return 'Please select a valid gender.';
  if (!isValidBirthday(data.birthday))
    return 'You must be at least 18 years old.';
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
}): string {
  if (!isCompleteAddress(data))
    return 'All address fields must be filled out correctly.';
  if (!isValidZipCode(data.zipCode)) return 'Invalid ZIP code.';
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
  if (!isValidName(data.first_name) || !isValidName(data.last_name))
    return 'Invalid name.';
  if (!isValidPhone(data.contact_no)) return 'Invalid phone number.';
  if (!isValidGender(data.gender)) return 'Invalid gender.';
  if (!isValidBirthday(data.birthday)) return 'Invalid birth date.';
  return '';
}
