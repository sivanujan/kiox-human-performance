import { parsePhoneNumberWithError, CountryCode } from 'libphonenumber-js';

export interface PhoneValidationResult {
  valid: boolean;
  country?: string;
  country_code?: string;
  normalized?: string | null;
  type?: string;
  reason?: string;
}

/**
 * Validates a phone number against international standards (E.164)
 * @param phoneNumber The raw phone number string
 * @param defaultCountry Optional default country code (e.g., 'LK' for Sri Lanka)
 */
export const validatePhoneNumber = (
  number: string,
  defaultCountry?: string
): PhoneValidationResult => {
  if (!number) {
    return { valid: false, reason: 'PHONE NUMBER IS REQUIRED' };
  }

  // 1. Strip all non-numeric characters
  let cleanNumber = number.replace(/\D/g, '');

  // 2. Remove leading zero if present (handles national trunk prefixes like 077 -> 77)
  // We do this manually to ensure strict compliance with the requested normalization rules
  if (cleanNumber.startsWith('0')) {
    cleanNumber = cleanNumber.substring(1);
  }

  try {
    // 3. Attempt to parse using the provided country code context
    let phoneNumber = parsePhoneNumberWithError(cleanNumber, defaultCountry as CountryCode);

    // 4. Validate using possibility check to ensure new active ranges are accepted
    if (!phoneNumber.isPossible()) {
      return {
        valid: false,
        country: phoneNumber.country,
        country_code: `+${phoneNumber.countryCallingCode}`,
        reason: 'INVALID NUMBER FORMAT OR LENGTH',
      };
    }

    return {
      valid: true,
      country: phoneNumber.country,
      country_code: `+${phoneNumber.countryCallingCode}`,
      normalized: phoneNumber.format('E164'),
      type: phoneNumber.getType() || 'unknown',
    };
  } catch (error: any) {
    // If explicit parsing fails, try one more time by prepending a '+' if the user 
    // typed the full international number without it.
    try {
      let retryPhone = parsePhoneNumberWithError('+' + cleanNumber, defaultCountry as CountryCode);
      if (retryPhone.isPossible()) {
        return {
          valid: true,
          country: retryPhone.country,
          country_code: `+${retryPhone.countryCallingCode}`,
          normalized: retryPhone.format('E164'),
          type: retryPhone.getType() || 'unknown',
        };
      }
    } catch (e) {}

    let reason = 'INVALID PHONE NUMBER';
    if (error.message === 'NOT_A_NUMBER') reason = 'INPUT CONTAINS NO DIGITS';
    if (error.message === 'INVALID_COUNTRYCODE') reason = 'INVALID OR MISSING COUNTRY CODE';
    if (error.message === 'TOO_SHORT') reason = 'NUMBER IS TOO SHORT';
    if (error.message === 'TOO_LONG') reason = 'NUMBER IS TOO LONG';

    return {
      valid: false,
      reason,
    };
  }
};
