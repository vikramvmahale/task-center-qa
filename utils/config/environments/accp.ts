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
    apiBaseUrl: string; // Task Center API base URL
    taskCenterApiBaseUrl: string; // Task Center check_file API base URL
    taskCenterAuthKey: string; // Task Center API authorization key
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
    taskCenterApiBaseUrl: 'https://accp-tc.exprealty.com/',
    taskCenterAuthKey: '5e4652793336027db39bdcfdda9171b5a13c87a3869e1630b1fa5b2c86f7e9552a1c87b2384252d904b7d60dad186ce368b36f8b687103a67ef6cf4fb878b38f3ba1274a5d651f37e224d3856b93dabceef9945b02ffea31bcbbd6205186201a6d88cb11d3f50b6c975fc0bf47a310906718f4e4f5f1a25c',
    tokenUrl: 'https://qa-dataservices.auth.us-east-1.amazoncognito.com/oauth2/token', // Update with ACCP token URL if different
    clientId: '34kuhkv5j4sksgj2amm6gmtrj9', // Update with ACCP client ID if different
    clientSecret: 'pbodh58jnpnef1vuhmie56kvfclumfknsotamnvuk2sv1icjkic' // Update with ACCP client secret if different
};

