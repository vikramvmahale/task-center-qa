//TODO: Move the more common stuff in here, example the generate phone number function in PersonalPage

export function getUSDateTimeString(): string {
  const now = new Date();
  const pad = (n: number): string => n.toString().padStart(2, '0');

  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const ss = pad(now.getSeconds());

  return `${mm}${dd}${hh}${min}${ss}`;
}

/**
 * API Testing Utilities
 */

/**
 * Generate a random number for testing
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Random number
 */
export function generateRandomNumber(min: number = 1, max: number = 1000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Validate API response structure
 * @param response - API response object
 * @param requiredFields - Array of required field names
 * @returns True if response has all required fields
 */
export function validateApiResponse(response: any, requiredFields: string[] = []): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }

  if (requiredFields.length === 0) {
    return true;
  }

  return requiredFields.every(field => {
    return response.hasOwnProperty(field) && response[field] !== null && response[field] !== undefined;
  });
}

/**
 * Format currency string to number
 * @param currencyString - Currency string (e.g., "135000.00")
 * @returns Parsed number
 */
export function parseCurrency(currencyString: string): number {
  if (typeof currencyString !== 'string') {
    return 0;
  }
  
  const cleaned = currencyString.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Generate a random GUID/UUID for testing
 * @returns Random GUID string
 */
export function generateRandomGuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

