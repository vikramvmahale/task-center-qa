import { expect, Locator, Page } from '@playwright/test';

/**
 * Task Center Home Page Page Object
 * 
 * This models the Task Center home page that users land on after successful login.
 */
export class TaskCenterHomePagePO {
  readonly page: Page;

  // Header elements
  readonly header: Locator;
  readonly logo: Locator;
  readonly userMenu: Locator;
  readonly notificationsIcon: Locator;
  readonly homeIcon: Locator;

  // Main content
  readonly mainContent: Locator;
  readonly pageTitle: Locator;

  constructor(page: Page) {
    this.page = page;

    // Header - look for the Task Center heading (most reliable from snapshot)
    // The logo appears as a heading "Task Center" at level 1
    this.logo = page.getByRole('heading', { name: 'Task Center', level: 1 });
    
    // User menu - look for user indicator button with "TC Admin"
    // From snapshot: button "avatar_placeholder icon TC Admin dropdown icon"
    this.userMenu = page.getByRole('button', { name: /TC Admin/i });
    
    // Notifications icon - from snapshot: button "Number of Notifications"
    this.notificationsIcon = page.getByRole('button', { name: /Number of Notifications|notification/i });
    
    // Home icon - from snapshot: link "home icon"
    this.homeIcon = page.getByRole('link', { name: /home/i });

    // Main content area
    this.mainContent = page.locator('main').first();
  }

  /**
   * Verify that the home page is loaded correctly
   */
  async expectOnPage(): Promise<void> {
    // Wait for the page to load
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Verify we're on a Task Center page (not Okta)
    await expect(this.page).not.toHaveURL(/okta|oktapreview/i);
    
    // Verify the URL contains the Task Center domain
    await expect(this.page).toHaveURL(/accp-tc\.exprealty\.com/i);
    
    // Verify logo or header is visible
    await expect(this.logo).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify that the user is logged in by checking for user menu or username
   */
  async expectLoggedIn(): Promise<void> {
    // Check for user menu button with "TC Admin" text
    // From the snapshot: button "avatar_placeholder icon TC Admin dropdown icon"
    await expect(this.userMenu).toBeVisible({ timeout: 10000 });
  }

  /**
   * Get the current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }
}

