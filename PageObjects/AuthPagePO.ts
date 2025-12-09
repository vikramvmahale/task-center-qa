import { expect, Page } from '@playwright/test';

/**
 * Auth Page Object for the Mira Okta auth entry (/auth.html).
 * Handles logging in the user via Okta and waiting for redirect back to Mira.
 */
export class AuthPagePO {
  readonly page: Page;
  readonly authUrl: string;

  constructor(page: Page, authUrl: string) {
    this.page = page;
    this.authUrl = authUrl;
  }

  /**
   * Perform Okta login for Mira.
   *
   * @param username - Okta username (e.g., dylan.nonakatest@exprealty.com)
   * @param password - Okta password (e.g., alphaMay2025)
   * @param expectedRedirectPath - Path fragment expected after login (e.g., "/chat")
   */
  async login(username: string, password: string, expectedRedirectPath: string = '/chat'): Promise<void> {
    // Go to the Mira auth entry page
    await this.page.goto(this.authUrl, { waitUntil: 'load' });

    // Wait for Okta email/username field to appear
    // Different Okta templates use different accessible names (Email, Username, Email or username)
    const usernameInput = this.page.getByRole('textbox', {
      name: /Email|Username/i,
    });
    await expect(usernameInput).toBeVisible({ timeout: 30000 });

    // Fill username and proceed
    await usernameInput.fill(username);
    const nextButton = this.page.getByRole('button', { name: /Next|Sign in|Continue/i });
    await nextButton.click();

    // Wait for password field
    const passwordInput = this.page.getByLabel('Password', { exact: false });
    await expect(passwordInput).toBeVisible({ timeout: 30000 });

    // Fill password and submit
    await passwordInput.fill(password);
    const submitButton = this.page.getByRole('button', { name: /Verify|Sign in|Log in/i });
    await submitButton.click();

    // Wait for redirect back to Mira (chat page or shell)
    await this.page.waitForLoadState('networkidle', { timeout: 60000 });
    await expect(this.page).toHaveURL(new RegExp(expectedRedirectPath.replace('/', '\/')), {
      timeout: 60000,
    });
  }
}


