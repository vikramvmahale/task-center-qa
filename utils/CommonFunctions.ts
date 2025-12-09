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
 * Generate a random transaction ID for testing
 * @param min - Minimum ID value
 * @param max - Maximum ID value
 * @returns Random transaction ID
 */
export function generateRandomTransactionId(min: number = 1, max: number = 1000): number {
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
 * Test data types for generateTestData function
 */
export type TestDataType = 'transaction' | 'bonus';

/**
 * Generated test data structure
 */
export interface GeneratedTestData {
  transactionType?: string;
  listPrice?: string;
  salePrice?: string;
  transactionNumber?: string;
  propertyType?: string;
  name?: string;
  amount?: string;
  is_buyer_side?: boolean;
}

/**
 * Generate test data for API requests
 * @param type - Type of test data to generate
 * @returns Generated test data
 */
export function generateTestData(type: TestDataType): GeneratedTestData {
  const timestamp = getUSDateTimeString();
  
  switch (type) {
    case 'transaction':
      return {
        transactionType: 'Sale',
        listPrice: '150000.00',
        salePrice: '145000.00',
        transactionNumber: `TEST-${timestamp}`,
        propertyType: 'Residential Sale'
      };
    case 'bonus':
      return {
        name: `Test Bonus ${timestamp}`,
        amount: '50.00',
        is_buyer_side: true
      };
    default:
      return {};
  }
}

