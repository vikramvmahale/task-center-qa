import { expect, Locator, Page } from '@playwright/test';
import { accountSolutionsReportsConfig } from '../utils/config/reports-config';

/**
 * Account Solutions Reports Page Page Object
 * 
 * This models the Task Center Reports page for Account Solutions module where users can generate various reports
 * by selecting report type and date range.
 */
export class AccountSolutionsReportsPagePO {
  readonly page: Page;

  // Available report names - from config
  static readonly REPORT_NAMES = accountSolutionsReportsConfig.reportNames;

  // Expected CSV headers - from config
  static readonly INVOICE_TASKS_REPORT_HEADERS = accountSolutionsReportsConfig.csvHeaders['Invoice Tasks Report'] as readonly string[];
  static readonly TC_AR_REPORT_HEADERS = accountSolutionsReportsConfig.csvHeaders['TC AR Report'] as readonly string[];
  static readonly TC_EMAIL_EXPORT_HEADERS = accountSolutionsReportsConfig.csvHeaders['TC Email Export'] as readonly string[];
  static readonly TC_TEXT_MESSAGE_EXPORT_HEADERS = accountSolutionsReportsConfig.csvHeaders['TC Text Message Export'] as readonly string[];
  static readonly INVOICE_ACTIVITY_REPORT_HEADERS = accountSolutionsReportsConfig.csvHeaders['Invoice Activity Report'] as readonly string[];
  static readonly PAID_INVOICE_REPORT_HEADERS = accountSolutionsReportsConfig.csvHeaders['Paid Invoice Report'] as readonly string[];
  static readonly NOTES_HISTORY_REPORT_HEADERS = accountSolutionsReportsConfig.csvHeaders['Notes History Report'] as readonly string[];
  static readonly ACCOUNT_SOLUTIONS_COMMUNICATION_REPORT_HEADERS = accountSolutionsReportsConfig.csvHeaders['Account Solutions Communication Report'] as readonly string[];

  // Invoice Status dropdown values for Notes History Report - from config
  static readonly NOTES_HISTORY_INVOICE_STATUS_VALUES = accountSolutionsReportsConfig.dropdownValues['Notes History Report'].invoiceStatus as readonly string[];

  // Page header elements
  readonly pageTitle: Locator;
  readonly goBackLink: Locator;
  readonly breadcrumbContainer: Locator;
  readonly breadcrumbAdminPanel: Locator;
  readonly breadcrumbCurrentPage: Locator;

  // Form elements
  readonly reportsForm: Locator;
  readonly reportTypeDropdown: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly generateButton: Locator;
  readonly moduleTypeHiddenInput: Locator;
  readonly invoiceStatusDropdown: Locator;

  // Main content
  readonly mainContent: Locator;
  readonly cardComponent: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page header - Reports title
    this.pageTitle = page.getByRole('heading', { name: 'Reports', level: 2 });
    
    // Go back link - using getByRole with accessible name
    this.goBackLink = page.getByRole('link', { name: /Navigate back/i });
    
    // Breadcrumb elements
    this.breadcrumbContainer = page.locator('.breadcrumb-container');
    this.breadcrumbAdminPanel = page.getByRole('link', { name: /Return to Admin Panel/i });
    this.breadcrumbCurrentPage = page.locator('.breadcrumb-container .current-page');

    // Form elements
    this.reportsForm = page.locator('#reports_form');
    this.reportTypeDropdown = page.locator('#report_type');
    this.startDateInput = page.locator('#start_date');
    this.endDateInput = page.locator('#end_date');
    this.generateButton = page.getByRole('button', { name: 'Generate' });
    this.moduleTypeHiddenInput = page.locator('#module_type');
    // Invoice Status dropdown - multiselect component with hidden select
    this.invoiceStatusDropdown = page.locator('#hidden-multiselect-invoice_status');

    // Main content
    this.mainContent = page.locator('main').first();
    this.cardComponent = page.locator('.card-component');
  }

  /**
   * Verify that the Reports page is loaded correctly
   */
  async expectOnPage(): Promise<void> {
    // Wait for the page to load
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Verify we're on a Task Center page (not Okta)
    await expect(this.page).not.toHaveURL(/okta|oktapreview/i);
    
    // Verify the URL contains reports
    await expect(this.page).toHaveURL(/reports/i);
    
    // Verify page title is visible
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    
    // Verify form is visible
    await expect(this.reportsForm).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify breadcrumb navigation is present
   */
  async expectBreadcrumb(): Promise<void> {
    await expect(this.breadcrumbContainer).toBeVisible({ timeout: 10000 });
    await expect(this.breadcrumbAdminPanel).toBeVisible();
    await expect(this.breadcrumbCurrentPage).toContainText('Reports');
  }

  /**
   * Navigate back to Admin Panel
   */
  async clickGoBack(): Promise<void> {
    await expect(this.goBackLink).toBeVisible({ timeout: 10000 });
    await this.goBackLink.click();
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
  }

  /**
   * Select a report type from the dropdown
   * @param reportType - The report type value to select (e.g., 'invoice_tasks_report', 'tc_ar_reports')
   */
  async selectReportType(reportType: string): Promise<void> {
    await expect(this.reportTypeDropdown).toBeVisible({ timeout: 10000 });
    await this.reportTypeDropdown.selectOption(reportType);
    // Wait for any dynamic content changes after selection
    await this.page.waitForTimeout(500);
  }

  /**
   * Select the first available report from the dropdown (excluding the default "Select..." option)
   */
  async selectFirstReport(): Promise<string> {
    await expect(this.reportTypeDropdown).toBeVisible({ timeout: 10000 });
    
    // Get all options excluding the default empty option
    const options = await this.reportTypeDropdown.locator('option').all();
    let firstReportValue: string | null = null;
    let firstReportName: string | null = null;
    
    for (const option of options) {
      const value = await option.getAttribute('value');
      const text = await option.textContent();
      
      if (value && value.trim() !== '' && text && text.trim() !== 'Select the type of Report') {
        firstReportValue = value;
        firstReportName = text.trim();
        break;
      }
    }
    
    if (!firstReportValue) {
      throw new Error('No report options found in the dropdown');
    }
    
    await this.reportTypeDropdown.selectOption(firstReportValue);
    await this.page.waitForTimeout(500);
    
    console.log(`✅ Selected first report: ${firstReportName}`);
    return firstReportName || firstReportValue;
  }

  /**
   * Select a report by its display name
   * @param reportName - The display name of the report to select
   * @returns The selected report name
   */
  async selectReportByName(reportName: string): Promise<string> {
    await expect(this.reportTypeDropdown).toBeVisible({ timeout: 10000 });
    
    // Get all options
    const options = await this.reportTypeDropdown.locator('option').all();
    let reportValue: string | null = null;
    let selectedReportName: string | null = null;
    
    for (const option of options) {
      const text = await option.textContent();
      if (text && text.trim() === reportName) {
        reportValue = await option.getAttribute('value');
        selectedReportName = text.trim();
        break;
      }
    }
    
    if (!reportValue) {
      throw new Error(`Report "${reportName}" not found in the dropdown`);
    }
    
    await this.reportTypeDropdown.selectOption(reportValue);
    await this.page.waitForTimeout(500);
    
    console.log(`✅ Selected report: ${selectedReportName}`);
    return selectedReportName || reportName;
  }

  /**
   * Set the start date for the report
   * @param date - Date string in YYYY-MM-DD format
   */
  async setStartDate(date: string): Promise<void> {
    await expect(this.startDateInput).toBeVisible({ timeout: 10000 });
    await this.startDateInput.fill(date);
  }

  /**
   * Set the end date for the report
   * @param date - Date string in YYYY-MM-DD format
   */
  async setEndDate(date: string): Promise<void> {
    await expect(this.endDateInput).toBeVisible({ timeout: 10000 });
    await this.endDateInput.fill(date);
  }

  /**
   * Set date range for the report
   * @param startDate - Start date string in YYYY-MM-DD format
   * @param endDate - End date string in YYYY-MM-DD format
   */
  async setDateRange(startDate: string, endDate: string): Promise<void> {
    await this.setStartDate(startDate);
    await this.setEndDate(endDate);
  }

  /**
   * Click the Generate button to submit the report form
   */
  async clickGenerate(): Promise<void> {
    await expect(this.generateButton).toBeVisible({ timeout: 10000 });
    await expect(this.generateButton).toBeEnabled();
    await this.generateButton.click();
    // Wait a moment for the form submission to process
    await this.page.waitForTimeout(1000);
  }

  /**
   * Generate a report with the specified parameters
   * @param reportType - The report type value to select
   * @param startDate - Start date string in YYYY-MM-DD format
   * @param endDate - End date string in YYYY-MM-DD format
   */
  async generateReport(reportType: string, startDate: string, endDate: string): Promise<void> {
    await this.selectReportType(reportType);
    await this.setDateRange(startDate, endDate);
    await this.clickGenerate();
  }

  /**
   * Get the selected report type value
   * @returns The selected report type value
   */
  async getSelectedReportType(): Promise<string | null> {
    return await this.reportTypeDropdown.inputValue();
  }

  /**
   * Get the start date value
   * @returns The start date value
   */
  async getStartDate(): Promise<string> {
    return await this.startDateInput.inputValue();
  }

  /**
   * Get the end date value
   * @returns The end date value
   */
  async getEndDate(): Promise<string> {
    return await this.endDateInput.inputValue();
  }

  /**
   * Verify that the form is ready for submission
   */
  async expectFormReady(): Promise<void> {
    await expect(this.reportTypeDropdown).toBeVisible();
    await expect(this.startDateInput).toBeVisible();
    await expect(this.endDateInput).toBeVisible();
    await expect(this.generateButton).toBeVisible();
  }

  /**
   * Get the current page URL
   */
  getCurrentUrl(): string {
    return this.page.url();
  }

  /**
   * Get available report type options (values)
   * @returns Array of report type option values
   */
  async getReportTypeOptions(): Promise<string[]> {
    const options = await this.reportTypeDropdown.locator('option').all();
    const values: string[] = [];
    for (const option of options) {
      const value = await option.getAttribute('value');
      if (value) {
        values.push(value);
      }
    }
    return values.filter(v => v !== ''); // Filter out empty/default option
  }

  /**
   * Get available report names (display text) from the dropdown
   * @returns Array of report names as displayed in the dropdown
   */
  async getReportNamesFromDropdown(): Promise<string[]> {
    await expect(this.reportTypeDropdown).toBeVisible({ timeout: 10000 });
    const options = await this.reportTypeDropdown.locator('option').all();
    const names: string[] = [];
    for (const option of options) {
      const text = await option.textContent();
      if (text && text.trim() && text.trim() !== 'Select the type of Report') {
        names.push(text.trim());
      }
    }
    return names;
  }

  /**
   * Verify that all stored report names are present in the Report Type dropdown
   * @returns Object with validation result and details
   */
  async expectStoredReportsPresent(): Promise<{ isValid: boolean; missing: string[]; extra: string[] }> {
    const dropdownReports = await this.getReportNamesFromDropdown();
    const storedReports = [...AccountSolutionsReportsPagePO.REPORT_NAMES];
    
    // Find missing reports (in stored but not in dropdown)
    const missing = storedReports.filter(report => !dropdownReports.includes(report));
    
    // Find extra reports (in dropdown but not in stored)
    const extra = dropdownReports.filter(report => !storedReports.includes(report));
    
    const isValid = missing.length === 0;
    
    if (!isValid) {
      console.log(`⚠️ Report validation failed:`);
      if (missing.length > 0) {
        console.log(`   Missing reports: ${missing.join(', ')}`);
      }
      if (extra.length > 0) {
        console.log(`   Extra reports: ${extra.join(', ')}`);
      }
    } else {
      console.log(`✅ All ${storedReports.length} stored reports are present in the dropdown`);
    }
    
    return { isValid, missing, extra };
  }

  /**
   * Assert that all stored report names are present in the dropdown
   * Throws an error if validation fails
   */
  async expectAllStoredReportsPresent(): Promise<void> {
    const validation = await this.expectStoredReportsPresent();
    
    if (!validation.isValid) {
      const errorMessages: string[] = [];
      if (validation.missing.length > 0) {
        errorMessages.push(`Missing reports: ${validation.missing.join(', ')}`);
      }
      if (validation.extra.length > 0) {
        errorMessages.push(`Extra reports: ${validation.extra.join(', ')}`);
      }
      throw new Error(`Report validation failed. ${errorMessages.join('; ')}`);
    }
  }

  /**
   * Get today's date in PST/PDT timezone (considering daylight saving)
   * @returns Date string in YYYY-MM-DD format
   */
  getTodayDatePST(): string {
    // Get current date/time in PST/PDT timezone
    // Using Intl.DateTimeFormat to handle DST automatically
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Format returns MM/DD/YYYY, convert to YYYY-MM-DD
    const parts = formatter.formatToParts(now);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    
    if (!year || !month || !day) {
      throw new Error('Failed to format PST date');
    }
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Wait for and close the report generation alert
   * @param alertText - The expected alert text to wait for
   */
  async waitForAndCloseAlert(alertText: string): Promise<void> {
    // Wait for the alert to appear
    const alertLocator = this.page.getByText(alertText, { exact: false });
    await expect(alertLocator).toBeVisible({ timeout: 30000 });
    console.log(`✅ Alert appeared: "${alertText}"`);
    
    // Look for close button - try multiple strategies
    // Strategy 1: Look for close button in common alert containers
    const alertContainer = this.page.locator('#global-flash-msg-container, [role="alert"], .alert, .flash-message').filter({ hasText: alertText }).first();
    const closeButtonInContainer = alertContainer.locator('button').filter({ hasText: /close|×|✕|dismiss/i }).first();
    
    // Strategy 2: Look for close button by role
    const closeButtonByRole = this.page.getByRole('button', { name: /close|×|✕|dismiss/i }).first();
    
    // Strategy 3: Look for button with × symbol or close text anywhere
    const closeButtonGeneric = this.page.locator('button').filter({ hasText: /×|close|✕|dismiss/i }).first();
    
    // Try to find and click close button
    let closed = false;
    
    // Try close button in container
    const isCloseInContainerVisible = await closeButtonInContainer.isVisible({ timeout: 2000 }).catch(() => false);
    if (isCloseInContainerVisible) {
      await closeButtonInContainer.click();
      closed = true;
      console.log('✅ Alert closed via container button');
    }
    
    // Try close button by role
    if (!closed) {
      const isCloseByRoleVisible = await closeButtonByRole.isVisible({ timeout: 2000 }).catch(() => false);
      if (isCloseByRoleVisible) {
        await closeButtonByRole.click();
        closed = true;
        console.log('✅ Alert closed via role button');
      }
    }
    
    // Try generic close button
    if (!closed) {
      const isCloseGenericVisible = await closeButtonGeneric.isVisible({ timeout: 2000 }).catch(() => false);
      if (isCloseGenericVisible) {
        await closeButtonGeneric.click();
        closed = true;
        console.log('✅ Alert closed via generic button');
      }
    }
    
    // If no close button found, try pressing Escape
    if (!closed) {
      await this.page.keyboard.press('Escape');
      console.log('✅ Alert dismissed with Escape key');
    }
    
    // Wait for alert to disappear
    await expect(alertLocator).not.toBeVisible({ timeout: 5000 }).catch(() => {
      console.log('⚠️ Alert may still be visible');
    });
  }

  /**
   * Get expected CSV headers for Invoice Tasks Report
   * @returns Array of expected header names
   */
  getInvoiceTasksReportHeaders(): string[] {
    return [...AccountSolutionsReportsPagePO.INVOICE_TASKS_REPORT_HEADERS];
  }

  /**
   * Get expected CSV headers for TC AR Report
   * @returns Array of expected header names
   */
  getTcArReportHeaders(): string[] {
    return [...AccountSolutionsReportsPagePO.TC_AR_REPORT_HEADERS];
  }

  /**
   * Get expected CSV headers for TC Email Export
   * @returns Array of expected header names
   */
  getTcEmailExportHeaders(): string[] {
    return [...AccountSolutionsReportsPagePO.TC_EMAIL_EXPORT_HEADERS];
  }

  /**
   * Get expected CSV headers for TC Text Message Export
   * @returns Array of expected header names
   */
  getTcTextMessageExportHeaders(): string[] {
    return [...AccountSolutionsReportsPagePO.TC_TEXT_MESSAGE_EXPORT_HEADERS];
  }

  /**
   * Get expected CSV headers for Invoice Activity Report
   * @returns Array of expected header names
   */
  getInvoiceActivityReportHeaders(): string[] {
    return [...AccountSolutionsReportsPagePO.INVOICE_ACTIVITY_REPORT_HEADERS];
  }

  /**
   * Get expected CSV headers for Paid Invoice Report
   * @returns Array of expected header names
   */
  getPaidInvoiceReportHeaders(): string[] {
    return [...AccountSolutionsReportsPagePO.PAID_INVOICE_REPORT_HEADERS];
  }

  /**
   * Get expected CSV headers for Notes History Report
   * @returns Array of expected header names
   */
  getNotesHistoryReportHeaders(): string[] {
    return [...AccountSolutionsReportsPagePO.NOTES_HISTORY_REPORT_HEADERS];
  }

  /**
   * Get expected CSV headers for Account Solutions Communication Report
   * @returns Array of expected header names
   */
  getAccountSolutionsCommunicationReportHeaders(): string[] {
    return [...AccountSolutionsReportsPagePO.ACCOUNT_SOLUTIONS_COMMUNICATION_REPORT_HEADERS];
  }

  /**
   * Get headers for a specific report type
   * @param reportName - Name of the report
   * @returns Array of expected header names
   */
  getHeadersForReport(reportName: string): string[] {
    switch (reportName) {
      case 'Invoice Tasks Report':
        return this.getInvoiceTasksReportHeaders();
      case 'TC AR Report':
        return this.getTcArReportHeaders();
      case 'TC Email Export':
        return this.getTcEmailExportHeaders();
      case 'TC Text Message Export':
        return this.getTcTextMessageExportHeaders();
      case 'Invoice Activity Report':
        return this.getInvoiceActivityReportHeaders();
      case 'Paid Invoice Report':
        return this.getPaidInvoiceReportHeaders();
      case 'Notes History Report':
        return this.getNotesHistoryReportHeaders();
      case 'Account Solutions Communication Report':
        return this.getAccountSolutionsCommunicationReportHeaders();
      default:
        return [];
    }
  }

  /**
   * Verify Invoice Status dropdown is present and has correct values for Notes History Report
   */
  async expectInvoiceStatusDropdown(): Promise<void> {
    // Check if the multiselect component is visible (the trigger button)
    const invoiceStatusTrigger = this.page.locator('div#multiselect-component-invoice_status').or(
      this.page.locator('div.multiselect-visible-selector-container').filter({ hasText: /Invoice Status/i })
    ).first();
    
    await expect(invoiceStatusTrigger).toBeVisible({ timeout: 10000 });
    
    // Verify the hidden select has the correct options
    await expect(this.invoiceStatusDropdown).toBeAttached({ timeout: 5000 });
    const options = await this.invoiceStatusDropdown.locator('option').allTextContents();
    const optionValues = options.map(opt => opt.trim()).filter(opt => opt !== '' && opt !== 'Select Invoice Status');
    
    for (const expectedValue of AccountSolutionsReportsPagePO.NOTES_HISTORY_INVOICE_STATUS_VALUES) {
      expect(optionValues).toContain(expectedValue);
    }
    console.log(`✅ Invoice Status dropdown validated with values: ${AccountSolutionsReportsPagePO.NOTES_HISTORY_INVOICE_STATUS_VALUES.join(', ')}`);
  }

  /**
   * Select Invoice Status from dropdown for Notes History Report
   * Uses multiselect component - click trigger, then click button
   * @param status - Invoice status to select (default: 'Open')
   */
  async selectInvoiceStatus(status: string = 'Open'): Promise<void> {
    console.log(`🔍 Selecting Invoice Status: "${status}"...`);

    try {
      // Step 1: Click on the visible multiselect trigger to open the dropdown
      const invoiceStatusTrigger = this.page.locator('div.multiselect-visible-selector-container[role="button"]').filter({ hasText: /Select Invoice Status|Invoice Status/i }).or(
        this.page.locator('div#multiselect-component-invoice_status div.multiselect-visible-selector-container[role="button"]')
      ).first();
      
      await expect(invoiceStatusTrigger).toBeVisible({ timeout: 10000 });
      console.log('🔍 Clicking Invoice Status dropdown trigger...');
      await invoiceStatusTrigger.click();
      await this.page.waitForTimeout(500); // Wait for dropdown to open
      
      // Step 2: Find and click the button for the selected status
      const statusButton = this.page.locator(`button.multiselect-dropdown-btn:has-text("${status}")`).or(
        this.page.locator(`button#dropdown-btn-${status.toLowerCase()}-invoice_status`)
      ).first();
      
      await expect(statusButton).toBeVisible({ timeout: 5000 });
      console.log(`🔍 Clicking status button for: ${status}`);
      await statusButton.click();
      await this.page.waitForTimeout(500); // Wait for selection to complete
      
      console.log(`✅ Selected Invoice Status: ${status}`);
      
      // Step 3: Click outside the dropdown to collapse it
      console.log('🔍 Clicking outside to collapse dropdown...');
      await this.page.locator('body').click({ position: { x: 0, y: 0 } });
      await this.page.waitForTimeout(300); // Wait for dropdown to collapse
      console.log('✅ Dropdown collapsed');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.log(`⚠️ Failed to select Invoice Status using multiselect trigger: ${errorMessage}`);
      
      // Fallback: Try to interact with hidden multiselect directly using evaluate
      console.log('⚠️ Attempting fallback: setting value on hidden select...');
      try {
        const hiddenInvoiceStatusSelect = this.page.locator('select#hidden-multiselect-invoice_status');
        await hiddenInvoiceStatusSelect.waitFor({ state: 'attached', timeout: 5000 });
        
        // Use evaluate to set the value directly on the hidden select
        await hiddenInvoiceStatusSelect.evaluate((select: HTMLSelectElement, statusValue: string) => {
          // Find the option with matching value
          const options = Array.from(select.options);
          const option = options.find(opt => opt.value === statusValue || opt.textContent?.trim() === statusValue);
          if (option) {
            select.value = option.value;
            // Trigger change event to notify the multiselect component
            select.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            throw new Error(`Invoice Status option "${statusValue}" not found in select`);
          }
        }, status);
        
        await this.page.waitForTimeout(500); // Wait for multiselect component to update
        console.log(`✅ Selected Invoice Status via hidden select fallback: ${status}`);
        
        // Also click outside after fallback selection
        console.log('🔍 Clicking outside to collapse dropdown...');
        await this.page.locator('body').click({ position: { x: 0, y: 0 } });
        await this.page.waitForTimeout(300);
        console.log('✅ Dropdown collapsed');
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.log(`❌ Failed to select Invoice Status: ${fallbackErrorMessage}`);
        throw new Error(`Failed to select Invoice Status "${status}": ${fallbackErrorMessage}`);
      }
    }
    
    await this.page.waitForTimeout(300);
  }

  /**
   * Get last Friday date in PST/PDT timezone
   * @returns Date string in YYYY-MM-DD format
   */
  getLastFridayPST(): string {
    const now = new Date();
    
    // Get current date components in PST
    const pstDateStr = now.toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Parse PST date
    const [month, day, year] = pstDateStr.split(/[/, ]/).filter(Boolean);
    const pstNow = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Find last Friday (Friday is day 5, 0 = Sunday)
    const currentDay = pstNow.getDay();
    let daysToSubtract: number;
    
    if (currentDay === 5) {
      // Today is Friday, go back 7 days
      daysToSubtract = 7;
    } else if (currentDay > 5) {
      // Saturday (6) or Sunday (0), go back (currentDay - 5) days
      daysToSubtract = currentDay - 5;
    } else {
      // Monday (1) through Thursday (4), go back (currentDay + 2) days
      daysToSubtract = currentDay + 2;
    }
    
    const lastFriday = new Date(pstNow);
    lastFriday.setDate(pstNow.getDate() - daysToSubtract);
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(lastFriday);
    const yearStr = parts.find(part => part.type === 'year')?.value;
    const monthStr = parts.find(part => part.type === 'month')?.value;
    const dayStr = parts.find(part => part.type === 'day')?.value;
    
    if (!yearStr || !monthStr || !dayStr) {
      throw new Error('Failed to format last Friday PST date');
    }
    
    return `${yearStr}-${monthStr}-${dayStr}`;
  }

  /**
   * Get upcoming Thursday date in PST/PDT timezone
   * @returns Date string in YYYY-MM-DD format
   */
  getUpcomingThursdayPST(): string {
    const now = new Date();
    
    // Get current date components in PST
    const pstDateStr = now.toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    // Parse PST date
    const [month, day, year] = pstDateStr.split(/[/, ]/).filter(Boolean);
    const pstNow = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    // Find upcoming Thursday (Thursday is day 4, 0 = Sunday)
    const currentDay = pstNow.getDay();
    let daysToAdd: number;
    
    if (currentDay === 4) {
      // Today is Thursday, go forward 7 days
      daysToAdd = 7;
    } else if (currentDay < 4) {
      // Sunday (0) through Wednesday (3), go forward (4 - currentDay) days
      daysToAdd = 4 - currentDay;
    } else {
      // Friday (5) or Saturday (6), go forward (4 - currentDay + 7) days
      daysToAdd = 4 - currentDay + 7;
    }
    
    const upcomingThursday = new Date(pstNow);
    upcomingThursday.setDate(pstNow.getDate() + daysToAdd);
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(upcomingThursday);
    const yearStr = parts.find(part => part.type === 'year')?.value;
    const monthStr = parts.find(part => part.type === 'month')?.value;
    const dayStr = parts.find(part => part.type === 'day')?.value;
    
    if (!yearStr || !monthStr || !dayStr) {
      throw new Error('Failed to format upcoming Thursday PST date');
    }
    
    return `${yearStr}-${monthStr}-${dayStr}`;
  }

  /**
   * Prefill dates for Account Solutions Communication Report
   * Start Date = last Friday, End Date = upcoming Thursday
   */
  async prefillAccountSolutionsCommunicationReportDates(): Promise<void> {
    const startDate = this.getLastFridayPST();
    const endDate = this.getUpcomingThursdayPST();
    
    console.log(`📅 Prefilling dates for Account Solutions Communication Report:`);
    console.log(`   Start Date (last Friday): ${startDate}`);
    console.log(`   End Date (upcoming Thursday): ${endDate}`);
    
    await this.setDateRange(startDate, endDate);
  }
}

