import { test, expect, Page } from '@playwright/test';
import { POManager } from '../../PageObjects/POManager';
import { getEnvironmentConfig } from '../../utils/config/environment-config';

/**
 * Task Center Login UI Tests
 * 
 * These tests validate the Task Center login flow:
 * 1. Navigate to login page
 * 2. Select "eXp Passport" account type
 * 3. Complete Okta authentication
 * 4. Verify landing on Task Center home page
 */

// Get environment configuration
const env = getEnvironmentConfig();

test.describe('Task Center Login Tests', () => {
  test('should successfully log in and land on home page', { tag: ['@ui'] }, async ({ page }: { page: Page }) => {
    // Check if we have Task Center UI configuration
    if (!('taskCenterUiUrl' in env) || !('taskCenterAdminEmail' in env) || !('taskCenterAdminPassword' in env)) {
      test.skip(true, 'Task Center UI credentials not configured for this environment');
      return;
    }

    const taskCenterUiUrl = (env as any).taskCenterUiUrl;
    const loginUrl = `${taskCenterUiUrl}/devise_new_session`;
    const adminEmail = (env as any).taskCenterAdminEmail;
    const adminPassword = (env as any).taskCenterAdminPassword;

    const pOManager = new POManager(page);
    const loginPage = pOManager.getTaskCenterLoginPage();
    const authPage = pOManager.getAuthPage(loginUrl);
    const homePage = pOManager.getTaskCenterHomePage();

    // Step 1: Navigate to Task Center login page
    console.log('🔍 Navigating to Task Center login page...');
    await page.goto(loginUrl, { waitUntil: 'load' });
    
    // Step 2: Verify login page is loaded
    await loginPage.expectOnPage();
    console.log('✅ Login page loaded');

    // Step 3: Click "eXp Passport" button
    console.log('🔍 Clicking eXp Passport button...');
    await loginPage.clickExpPassport();
    console.log('✅ eXp Passport button clicked');

    // Step 4: Wait for redirect to Okta and perform login
    console.log('🔍 Waiting for Okta login page...');
    await page.waitForURL(/okta|oktapreview/i, { timeout: 30000 });
    console.log('✅ Redirected to Okta');

    // Step 5: Perform Okta login
    console.log('🔍 Performing Okta login...');
    await authPage.performOktaLogin(adminEmail, adminPassword, 'accp-tc.exprealty.com');
    console.log('✅ Okta login completed');

    // Step 6: Verify we're on the Task Center home page
    console.log('🔍 Verifying home page...');
    await homePage.expectOnPage();
    await homePage.expectLoggedIn();
    console.log('✅ Successfully logged in and on home page');

    // Additional verification: Check URL contains Task Center domain
    const currentUrl = page.url();
    expect(currentUrl).toContain('accp-tc.exprealty.com');
    expect(currentUrl).not.toContain('okta');
    expect(currentUrl).not.toContain('devise_new_session');
    
    console.log(`✅ Final URL: ${currentUrl}`);
  });
});

