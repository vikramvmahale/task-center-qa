import { expect, Locator, Page } from '@playwright/test';

/**
 * Task Center Login Page Page Object
 * 
 * This models the initial login page at /devise_new_session where users
 * select their account type (eXp Passport or Consumer).
 */
export class TaskCenterLoginPagePO {
  readonly page: Page;

  // Page elements
  readonly expPassportButton: Locator;
  readonly consumerButton: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;

    // Use getByRole to find the buttons by their accessible names
    // The "eXp Passport" button - prioritize role, but can also find by text if needed
    this.expPassportButton = page.getByRole('button', { name: /eXp Passport/i });
    
    // The "I'm a Consumer" button
    this.consumerButton = page.getByRole('button', { name: /I'm a Consumer|Consumer/i });
    
    // Page title/heading
    this.pageTitle = page.getByRole('heading', { name: /Choose Account Type/i });
  }

  /**
   * Verify that the login page is loaded correctly
   */
  async expectOnPage(): Promise<void> {
    await expect(this.pageTitle).toBeVisible({ timeout: 30000 });
    await expect(this.expPassportButton).toBeVisible();
  }

  /**
   * Click the "eXp Passport" button to proceed to Okta login
   */
  async clickExpPassport(): Promise<void> {
    await expect(this.expPassportButton).toBeVisible({ timeout: 30000 });
    await this.expPassportButton.click();
  }

  /**
   * Click the "I'm a Consumer" button (if needed for other tests)
   */
  async clickConsumer(): Promise<void> {
    await expect(this.consumerButton).toBeVisible({ timeout: 30000 });
    await this.consumerButton.click();
  }
}

