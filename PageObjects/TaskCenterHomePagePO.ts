import { expect, Locator, Page } from '@playwright/test';

/**
 * Task Center Home Page Page Object
 * 
 * This models the Task Center home page that users land on after successful login.
 */
export class TaskCenterHomePagePO {
  readonly page: Page;

  // Header elements
  readonly logo: Locator;
  readonly userMenu: Locator;

  // Module switcher elements
  readonly moduleSwitcherButton: Locator;
  readonly moduleSwitcherDropdown: Locator;
  
  // Navigation elements
  readonly moduleOptionsButton: Locator;

  // Module names mapping
  private readonly moduleNames = {
    'account_solution': 'Account Solutions',
    'onboarding': 'Onboarding',
    'document_review': 'Document Review',
    'transaction_payment': 'Transaction Payment',
    'agent_support': 'Agent Support'
  };

  constructor(page: Page) {
    this.page = page;

    // Header - look for the Task Center heading (most reliable from snapshot)
    // The logo appears as a heading "Task Center" at level 1
    this.logo = page.getByRole('heading', { name: 'Task Center', level: 1 });
    
    // User menu - look for user indicator button with "TC Admin"
    // From snapshot: button "avatar_placeholder icon TC Admin dropdown icon"
    this.userMenu = page.getByRole('button', { name: /TC Admin/i });

    // Module switcher dropdown - scope to sub-nav container to avoid matching navbar button
    this.moduleSwitcherButton = page.locator('#sub-nav button[title="Switch modules"], .sub-nav button[title="Switch modules"]').first();
    // Scope dropdown search to sub-nav container to avoid matching other menus on the page
    this.moduleSwitcherDropdown = page.locator('#sub-nav [role="menu"], .sub-nav [role="menu"]')
      .filter({ hasText: /Account Solutions|Document Review|Onboarding|Transaction Payment|Agent Support/i })
      .first();

    // Module options button - scoped to sub-nav section, can be found by title or alt text
    this.moduleOptionsButton = page.locator('#sub-nav button[title="View module options"], .sub-nav button[title="View module options"]')
      .or(page.locator('#sub-nav button:has(img[alt*="module-options"]), .sub-nav button:has(img[alt*="module-options"])'))
      .or(page.getByRole('button', { name: /View module options|module-options/i }))
      .first();
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
   * Get the currently selected module name
   * @returns The current module name or null if not found
   */
  async getCurrentModule(): Promise<string | null> {
    try {
      const moduleSwitcher = this.page.locator('.sub-nav--current-module-header .module--name, [class*="module--name"]');
      const isVisible = await moduleSwitcher.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isVisible) {
        const moduleText = await moduleSwitcher.textContent();
        return moduleText?.trim() || null;
      }
      
      // Fallback: try to get from button text
      const buttonText = await this.moduleSwitcherButton.textContent();
      return buttonText?.trim() || null;
    } catch {
      return null;
    }
  }

  /**
   * Switch to a specific module if not already selected
   * @param moduleType - Module type: 'account_solution', 'onboarding', 'document_review', 'transaction_payment', 'agent_support'
   */
  async switchToModule(moduleType: keyof typeof this.moduleNames): Promise<void> {
    const targetModuleName = this.moduleNames[moduleType];
    const currentModule = await this.getCurrentModule();
    
    // Check if already on the target module
    if (currentModule && currentModule.includes(targetModuleName)) {
      console.log(`✅ Already on ${targetModuleName} module`);
      return;
    }

    console.log(`🔄 Switching from "${currentModule}" to "${targetModuleName}" module...`);
    
    // Ensure dropdown is closed before opening (click outside or press Escape if needed)
    // Check if dropdown menu items are already visible/attached
    const menuItems = this.moduleSwitcherDropdown.locator('[role="menuitem"], [role="menuitemlink"], a, button');
    const isDropdownOpen = await menuItems.first().isVisible({ timeout: 1000 }).catch(() => false);
    
    if (isDropdownOpen) {
      console.log('🔍 Dropdown is already open, closing it first...');
      // Close dropdown by clicking outside or pressing Escape
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(300);
    }
    
    // Ensure module switcher button is ready and visible
    await expect(this.moduleSwitcherButton).toBeVisible({ timeout: 10000 });
    await this.page.waitForTimeout(200); // Small wait to ensure button is ready
    
    // Open module switcher dropdown
    await this.moduleSwitcherButton.click();
    
    // Wait for dropdown menu items to be available (menu container may be hidden even when open)
    // Check for menu items instead of menu container visibility
    await menuItems.first().waitFor({ state: 'attached', timeout: 5000 });
    await this.page.waitForTimeout(500);
    
    // Try multiple strategies to find the module link/item
    // Strategy 1: Try menuitemlink (most common for menu items that are links)
    let moduleLink = this.moduleSwitcherDropdown.getByRole('menuitemlink', { name: new RegExp(targetModuleName, 'i') });
    let isVisible = await moduleLink.isVisible({ timeout: 2000 }).catch(() => false);
    
    // Strategy 2: Try menuitem if menuitemlink didn't work
    if (!isVisible) {
      console.log(`🔍 Trying menuitem role for "${targetModuleName}"...`);
      moduleLink = this.moduleSwitcherDropdown.getByRole('menuitem', { name: new RegExp(targetModuleName, 'i') });
      isVisible = await moduleLink.isVisible({ timeout: 2000 }).catch(() => false);
    }
    
    // Strategy 3: Try link role if menuitem didn't work
    if (!isVisible) {
      console.log(`🔍 Trying link role for "${targetModuleName}"...`);
      moduleLink = this.moduleSwitcherDropdown.getByRole('link', { name: new RegExp(targetModuleName, 'i') });
      isVisible = await moduleLink.isVisible({ timeout: 2000 }).catch(() => false);
    }
    
    // Strategy 4: Try button role as fallback
    if (!isVisible) {
      console.log(`🔍 Trying button role for "${targetModuleName}"...`);
      moduleLink = this.moduleSwitcherDropdown.getByRole('button', { name: new RegExp(targetModuleName, 'i') });
      isVisible = await moduleLink.isVisible({ timeout: 2000 }).catch(() => false);
    }
    
    // Strategy 5: Use locator with text content (handles whitespace better)
    if (!isVisible) {
      console.log(`🔍 Trying locator with text content for "${targetModuleName}"...`);
      // Use filter with normalized text to handle whitespace
      const allItems = this.moduleSwitcherDropdown.locator('[role="menuitem"], [role="menuitemlink"], a, button');
      const items = await allItems.all();
      for (const item of items) {
        const text = await item.textContent();
        if (text && text.trim().toLowerCase() === targetModuleName.toLowerCase()) {
          moduleLink = item;
          isVisible = await item.isVisible({ timeout: 2000 }).catch(() => false);
          break;
        }
      }
    }
    
    if (!isVisible) {
      // Debug: Log available menu items (reuse menuItems locator)
      const allMenuItems = await menuItems.all();
      const itemTexts = await Promise.all(allMenuItems.map(item => item.textContent()));
      const normalizedTexts = itemTexts.map(t => t ? t.trim() : '').filter(t => t);
      console.log(`❌ Available menu items: ${normalizedTexts.join(', ')}`);
      throw new Error(`Module "${targetModuleName}" not found in module switcher dropdown. Available items: ${normalizedTexts.join(', ')}`);
    }
    
    // Click the target module link
    await expect(moduleLink).toBeVisible({ timeout: 5000 });
    await moduleLink.click();
    
    // Wait for module switch to complete
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Additional wait to ensure page is fully loaded and module switcher is reset
    await this.page.waitForTimeout(1000);
    
    // Verify we switched to the correct module
    const newModule = await this.getCurrentModule();
    if (newModule && newModule.includes(targetModuleName)) {
      console.log(`✅ Successfully switched to ${targetModuleName} module`);
    } else {
      console.log(`⚠️ Module switch may not have completed. Current module: ${newModule}`);
    }
  }

  /**
   * Navigate to Reports section
   * Note: Reports link is inside the module options dropdown, so it must be opened first
   */
  async clickReports(): Promise<void> {
    console.log('🔍 Opening module options dropdown and navigating to Reports...');
    
    // Click the module options button using XPath (use class property if XPath matches, otherwise use XPath)
    const moduleOptionsButton = this.page.locator('xpath=//div[@id="sub-nav"]//button[@title="View module options"]');
    await moduleOptionsButton.click();
    await this.page.waitForTimeout(500); // Wait for dropdown to open
    
    // Wait for and click the Reports link using XPath
    // First wait for it to be attached, then check if it's visible or clickable
    const reportsLink = this.page.locator('xpath=//div[@id="sub-nav"]//button[@title="View module options"]/following::div//a[@title="Go to Reports"]');
    await reportsLink.waitFor({ state: 'attached', timeout: 10000 });
    
    // Try to make it visible by hovering or clicking the dropdown first
    const isVisible = await reportsLink.isVisible().catch(() => false);
    if (!isVisible) {
      // If not visible, try clicking anyway (it might be clickable even if not visible)
      console.log('⚠️ Reports link is attached but not visible, attempting to click...');
      await reportsLink.click({ force: true });
    } else {
      await reportsLink.click();
    }
    
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    console.log('✅ Navigated to Reports page');
  }
}

