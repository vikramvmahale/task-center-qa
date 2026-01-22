/**
 * Test Environment Configuration
 * 
 * This file contains environment-specific variables for the test environment.
 */

export interface TestEnvironment {
    name: string;
    // UI Configuration
    testUrl: string;
    taskCenterUiUrl: string; // Task Center UI base URL
    oktaUrl: string;
    testEmail: string;
    testPassword: string;
    taskCenterAdminEmail: string; // Task Center admin credentials
    taskCenterAdminPassword: string;
    // API Configuration
    apiBaseUrl: string; // Legacy API base URL (not currently used by Task Center APIs)
    taskCenterApiBaseUrl: string; // Task Center check_file API base URL
    taskCenterAuthKey: string; // Task Center API authorization key
    // Authentication Configuration
    tokenUrl: string; // OAuth token endpoint
    clientId: string;
    clientSecret: string;
    // MailTrap Configuration
    mailTrapApiUrl: string; // MailTrap API base URL
    mailTrapAccountId: string; // MailTrap account ID
    mailTrapAuthToken: string; // MailTrap API authentication token
    mailTrapInboxId: string; // MailTrap inbox ID for test environment
}

export const testEnvironment: TestEnvironment = {
    name: 'test',
    testUrl: '', // Update with actual ACCP URL
    taskCenterUiUrl: 'https://test-tc.exprealty.com',
    oktaUrl: 'https://expi.oktapreview.com/', // Update with actual ACCP Okta URL if different
    testEmail: '', // Update with ACCP test credentials
    testPassword: '', // Update with ACCP test password
    taskCenterAdminEmail: 'tcadmin3@exprealty.net',
    taskCenterAdminPassword: 'Re*16spirits21?',
    apiBaseUrl: '', // Legacy - not currently used
    taskCenterApiBaseUrl: 'https://test-tc.exprealty.com/',
    taskCenterAuthKey: '5e4652793336027db39bdcfdda9171b5a13c87a3869e1630b1fa5b2c86f7e9552a1c87b2384252d904b7d60dad186ce368b36f8b687103a67ef6cf4fb878b38f3ba1274a5d651f37e224d3856b93dabceef9945b02ffea31bcbbd6205186201a6d88cb11d3f50b6c975fc0bf47a310906718f4e4f5f1a25c',
    tokenUrl: '',
    clientId: '',
    clientSecret: '',
    // MailTrap Configuration
    mailTrapApiUrl: 'https://mailtrap.io/api',
    mailTrapAccountId: '849678',
    mailTrapAuthToken: '94ddd2f5aab072292d1b5aea0e4b2e71',
    mailTrapInboxId: '1715180'
};

