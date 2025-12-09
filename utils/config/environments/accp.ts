/**
 * ACCP Environment Configuration
 * 
 * This file contains environment-specific variables for the ACCP (Acceptance) environment.
 */

export interface AccpEnvironment {
    name: string;
    // UI Configuration
    testUrl: string;
    oktaUrl: string;
    testEmail: string;
    testPassword: string;
    // API Configuration
    apiBaseUrl: string; // Agent Platform API base URL
    // Authentication Configuration
    tokenUrl: string; // OAuth token endpoint
    clientId: string;
    clientSecret: string;
}

export const accpEnvironment: AccpEnvironment = {
    name: 'accp',
    testUrl: 'https://accp.d17gkqc424c8kh.amplifyapp.com/', // Update with actual ACCP URL
    oktaUrl: 'https://expi.oktapreview.com/', // Update with actual ACCP Okta URL if different
    testEmail: 'ted.tester@exprealty.net', // Update with ACCP test credentials
    testPassword: 'Overstuff8-Maximize-Choking', // Update with ACCP test password
    apiBaseUrl: 'https://accp-agent-platform-model-api.exprealty.com', // Update with actual ACCP API URL
    tokenUrl: 'https://qa-dataservices.auth.us-east-1.amazoncognito.com/oauth2/token', // Update with ACCP token URL if different
    clientId: '34kuhkv5j4sksgj2amm6gmtrj9', // Update with ACCP client ID if different
    clientSecret: 'pbodh58jnpnef1vuhmie56kvfclumfknsotamnvuk2sv1icjkic' // Update with ACCP client secret if different
};

