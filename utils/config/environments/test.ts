/**
 * Test Environment Configuration
 * 
 * This file contains environment-specific variables for the test environment.
 */

export interface TestEnvironment {
    name: string;
    // UI Configuration
    testUrl: string;
    oktaUrl: string;
    testEmail: string;
    testPassword: string;
    // API Configuration
    apiBaseUrl: string; // Legacy API base URL (not currently used by Task Center APIs)
    // Authentication Configuration
    tokenUrl: string; // OAuth token endpoint
    clientId: string;
    clientSecret: string;
}

export const testEnvironment: TestEnvironment = {
    name: 'test',
    testUrl: 'https://test.d17gkqc424c8kh.amplifyapp.com/',
    oktaUrl: 'https://expi.oktapreview.com/',
    testEmail: 'ted.tester@exprealty.net',
    testPassword: 'Overstuff8-Maximize-Choking',
    apiBaseUrl: 'https://test-agent-platform-model-api.exprealty.com', // Legacy - not currently used
    tokenUrl: 'https://qa-dataservices.auth.us-east-1.amazoncognito.com/oauth2/token',
    clientId: '34kuhkv5j4sksgj2amm6gmtrj9',
    clientSecret: 'pbodh58jnpnef1vuhmie56kvfclumfknsotamnvuk2sv1icjkic'
};

