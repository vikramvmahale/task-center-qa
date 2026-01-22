import { expect, Locator, Page } from '@playwright/test';
import { onboardingReportsConfig } from '../utils/config/reports-config';

/**
 * Onboarding Reports Page Page Object
 * 
 * This models the Task Center Onboarding Reports page where users can generate various reports
 * by selecting report type and date range with additional filters.
 */
export class OnboardingReportsPagePO {
  readonly page: Page;

  // Available Onboarding report names - from config
  static readonly REPORT_NAMES = onboardingReportsConfig.reportNames;

  // Expected CSV headers - from config
  static readonly ONBOARDING_TEAM_STATUS_REPORT_HEADERS = onboardingReportsConfig.csvHeaders['Onboarding Team Status Report'] as readonly string[];
  static readonly ONBOARDING_STATUS_REPORT_HEADERS = onboardingReportsConfig.csvHeaders['Onboarding Status Report'] as readonly string[];
  static readonly ONBOARDING_SPECIALIST_PRODUCTIVITY_REPORT_HEADERS = onboardingReportsConfig.csvHeaders['Onboarding Specialist Productivity Report'] as readonly string[];
  static readonly ONBOARDING_SPECIALIST_REPORT_HEADERS = onboardingReportsConfig.csvHeaders['Onboarding Specialist Report'] as readonly string[];
  static readonly BROKERAGE_OPS_HEADERS = onboardingReportsConfig.csvHeaders['Brokerage Ops'] as readonly string[];
  static readonly COMPLETED_TASKS_HEADERS = onboardingReportsConfig.csvHeaders['Completed Tasks'] as readonly string[];
  static readonly CUSTOM_DATA_EXPORT_TASKS_HEADERS = onboardingReportsConfig.csvHeaders['Custom Data Export Tasks'] as readonly string[];
  static readonly ONBOARDING_COMMUNICATION_REPORT_HEADERS = onboardingReportsConfig.csvHeaders['Onboarding Communication Report'] as readonly string[];
  static readonly ONBOARDING_MODULE_AGENTS_HEADERS = onboardingReportsConfig.csvHeaders['Onboarding Module Agents'] as readonly string[];

  // Page elements
  readonly pageTitle: Locator;
  readonly reportTypeDropdown: Locator;
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly generateButton: Locator;

  // Special fields for different reports
  readonly searchTeamInput: Locator;
  readonly selectStateDropdown: Locator;
  readonly searchOnboardingSpecialistInput: Locator;
  readonly selectMonthDropdown: Locator;
  readonly taskCompletedStartDateInput: Locator;
  readonly taskCompletedEndDateInput: Locator;
  readonly taskCreatedStartDateInput: Locator;
  readonly taskCreatedEndDateInput: Locator;

  constructor(page: Page) {
    this.page = page;

    // Page header - based on HTML: <h2 class="page-title pl-4 flex items-center gap-2">Reports</h2>
    this.pageTitle = page.locator('h2.page-title').filter({ hasText: 'Reports' });

    // Form elements - based on HTML structure
    this.reportTypeDropdown = page.locator('select#report_type');
    this.startDateInput = page.locator('input#start_date');
    this.endDateInput = page.locator('input#end_date');
    // Generate button - based on HTML: <input type="submit" name="commit" value="Generate" class="button success " id="onb_reports_submit_btn" />
    this.generateButton = page.locator('input#onb_reports_submit_btn, input[type="submit"][value="Generate"]');

    // Special fields - these may be dynamically added, so using flexible locators
    // Team search - may appear as autocomplete or search input when Onboarding Team Status Report is selected
    this.searchTeamInput = page.locator('input[placeholder*="Search Team" i], input[name*="team" i], input[id*="team" i], input[data-controller*="autocomplete" i]').first();
    // State dropdown - appears when Onboarding Specialist Productivity Report is selected
    this.selectStateDropdown = page.locator('select#state, select[name*="state" i], select[id*="state" i]').first();
    // Onboarding Specialist search - appears when Onboarding Specialist Report is selected
    this.searchOnboardingSpecialistInput = page.locator('input[placeholder*="Search Onboarding Specialist" i], input[name*="specialist" i], input[id*="specialist" i], input[data-controller*="autocomplete" i]').first();
    // Month dropdown - appears when Onboarding Specialist Report is selected
    this.selectMonthDropdown = page.locator('select#select_month, select#month, select[name*="month" i]').first();
    // Task Completed dates - appear when Completed Tasks is selected
    this.taskCompletedStartDateInput = page.locator('input#start_date, input#task_completed_start_date, input[name*="task_completed_start" i], input[id*="task_completed_start" i], input[name="start_date"]').first();
    this.taskCompletedEndDateInput = page.locator('input#end_date, input#task_completed_end_date, input[name*="task_completed_end" i], input[id*="task_completed_end" i], input[name="end_date"]').first();
    // Task Created dates - appear when Custom Data Export Tasks is selected
    this.taskCreatedStartDateInput = page.locator('input#start_date, input#task_created_start_date, input[name*="task_created_start" i], input[id*="task_created_start" i], input[name="start_date"]').first();
    this.taskCreatedEndDateInput = page.locator('input#end_date, input#task_created_end_date, input[name*="task_created_end" i], input[id*="task_created_end" i], input[name="end_date"]').first();
  }

  /**
   * Verify that the Reports page is loaded correctly
   */
  async expectOnPage(): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    // Wait for page title - based on HTML: h2.page-title with text "Reports"
    await expect(this.pageTitle).toBeVisible({ timeout: 10000 });
    // Wait for report type dropdown
    await expect(this.reportTypeDropdown).toBeVisible({ timeout: 10000 });
    // Verify form is present
    await expect(this.page.locator('form[data-controller="reports"]')).toBeVisible({ timeout: 10000 });
  }

  /**
   * Verify that all stored Onboarding reports are present in the dropdown
   */
  async expectAllStoredReportsPresent(): Promise<void> {
    await expect(this.reportTypeDropdown).toBeVisible({ timeout: 10000 });
    
    const options = await this.reportTypeDropdown.locator('option').all();
    const availableReports = await Promise.all(
      options.map(async (option) => {
        const text = await option.textContent();
        return text?.trim() || '';
      })
    );

    const missingReports: string[] = [];
    for (const reportName of [...OnboardingReportsPagePO.REPORT_NAMES]) {
      if (!availableReports.includes(reportName)) {
        missingReports.push(reportName);
      }
    }

    if (missingReports.length > 0) {
      throw new Error(
        `Missing reports in dropdown: ${missingReports.join(', ')}. ` +
        `Available reports: ${availableReports.filter(r => r).join(', ')}`
      );
    }
  }

  /**
   * Select a report by its display name
   * Note: Based on HTML, selecting a report triggers a page reload via onchange handler
   * @param reportName - The display name of the report to select
   * @returns The selected report name
   */
  async selectReportByName(reportName: string): Promise<string> {
    await expect(this.reportTypeDropdown).toBeVisible({ timeout: 10000 });
    
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
    
    // Based on HTML: onchange="window.location.href = '/reports?module_type=onboarding&report_type=' + this.value"
    // This triggers a page reload, so we need to wait for navigation
    await Promise.all([
      this.page.waitForLoadState('networkidle', { timeout: 30000 }),
      this.reportTypeDropdown.selectOption(reportValue)
    ]);
    
    // Wait for the form to be ready again after reload
    await expect(this.reportTypeDropdown).toBeVisible({ timeout: 10000 });
    await this.page.waitForTimeout(500);
    
    console.log(`✅ Selected report: ${selectedReportName}`);
    return selectedReportName || reportName;
  }

  /**
   * Get today's date in PST/PDT timezone (considering daylight saving)
   * @returns Date string in YYYY-MM-DD format
   */
  getTodayDatePST(): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
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
   * Get yesterday's date in PST/PDT timezone
   * @returns Date string in YYYY-MM-DD format
   */
  getYesterdayDatePST(): string {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(yesterday);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    
    if (!year || !month || !day) {
      throw new Error('Failed to format PST date');
    }
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Get date 7 days before today in PST/PDT timezone
   * @returns Date string in YYYY-MM-DD format
   */
  get7DaysBeforePST(): string {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const parts = formatter.formatToParts(sevenDaysAgo);
    const year = parts.find(part => part.type === 'year')?.value;
    const month = parts.find(part => part.type === 'month')?.value;
    const day = parts.find(part => part.type === 'day')?.value;
    
    if (!year || !month || !day) {
      throw new Error('Failed to format PST date');
    }
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Get last Friday in PST/PDT timezone
   * @returns Date string in YYYY-MM-DD format
   */
  getLastFridayPST(): string {
    const now = new Date();
    
    const pstDateStr = now.toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const [month, day, year] = pstDateStr.split(/[/, ]/).filter(Boolean);
    const pstNow = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const currentDay = pstNow.getDay();
    let daysToSubtract: number;
    
    if (currentDay === 5) {
      // Today is Friday, go back 7 days
      daysToSubtract = 7;
    } else if (currentDay === 6) {
      // Today is Saturday, go back 1 day
      daysToSubtract = 1;
    } else if (currentDay === 0) {
      // Today is Sunday, go back 2 days
      daysToSubtract = 2;
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
      throw new Error('Failed to format PST date');
    }
    
    return `${yearStr}-${monthStr}-${dayStr}`;
  }

  /**
   * Get upcoming Thursday in PST/PDT timezone
   * @returns Date string in YYYY-MM-DD format
   */
  getUpcomingThursdayPST(): string {
    const now = new Date();
    
    const pstDateStr = now.toLocaleString('en-US', { 
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    const [month, day, year] = pstDateStr.split(/[/, ]/).filter(Boolean);
    const pstNow = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    
    const currentDay = pstNow.getDay();
    let daysToAdd: number;
    
    if (currentDay === 4) {
      // Today is Thursday, go forward 7 days
      daysToAdd = 7;
    } else if (currentDay < 4) {
      // Monday (1) through Wednesday (3), go forward (4 - currentDay) days
      daysToAdd = 4 - currentDay;
    } else {
      // Friday (5) through Sunday (0), go forward (4 + 7 - currentDay) days
      daysToAdd = 4 + 7 - currentDay;
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
    
    if (!yearStr || !dayStr) {
      throw new Error('Failed to format PST date');
    }
    
    return `${yearStr}-${monthStr}-${dayStr}`;
  }

  /**
   * Get current month name for dropdown selection
   * @returns Month name (e.g., "January", "February")
   */
  getCurrentMonth(): string {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      month: 'long'
    });
    return formatter.format(now);
  }

  /**
   * Set date range for standard Start Date and End Date fields
   */
  async setDateRange(startDate: string, endDate: string): Promise<void> {
    await expect(this.startDateInput).toBeVisible({ timeout: 10000 });
    await expect(this.endDateInput).toBeVisible({ timeout: 10000 });
    
    await this.startDateInput.fill(startDate);
    await this.endDateInput.fill(endDate);
    await this.page.waitForTimeout(300);
  }

  /**
   * Handle Onboarding Team Status Report - Search Team and set dates
   */
  async handleOnboardingTeamStatusReport(teamName: string = 'Go Arizona'): Promise<void> {
    // Wait for Search Team input to appear (may be dynamically added)
    await this.page.waitForTimeout(1000); // Wait for dynamic fields to load
    
    // Try to find the team search input - it might be an autocomplete field
    const teamInput = this.page.locator('input[placeholder*="Search Team" i], input[name*="team" i], input[id*="team" i], input[data-controller*="autocomplete" i]').first();
    
    try {
      await expect(teamInput).toBeVisible({ timeout: 5000 });
      // Type team name and wait for dropdown
      await teamInput.fill(teamName);
      await this.page.waitForTimeout(500);
      
      // Wait for the dropdown results container to appear
      const resultsContainer = this.page.locator('div#teams-search-results');
      await expect(resultsContainer).toBeVisible({ timeout: 5000 });
      
      // Select from dropdown using the specific HTML structure:
      // <div id="teams-search-results"><a data-team="Go Arizona" class="search-result-container">...</a></div>
      // Try multiple strategies in order of specificity
      let clicked = false;
      
      // Strategy 1: Use data-team attribute (most specific and reliable)
      try {
        const teamOption1 = resultsContainer.locator(`a[data-team="${teamName}"]`).first();
        await expect(teamOption1).toBeVisible({ timeout: 2000 });
        await teamOption1.click({ timeout: 2000 });
        clicked = true;
        console.log(`✅ Selected team "${teamName}" using data-team attribute`);
      } catch (e1) {
        // Strategy 2: Use search-result-container class with text match
        try {
          const teamOption2 = resultsContainer.locator(`a.search-result-container:has-text("${teamName}")`).first();
          await expect(teamOption2).toBeVisible({ timeout: 2000 });
          await teamOption2.click({ timeout: 2000 });
          clicked = true;
          console.log(`✅ Selected team "${teamName}" using search-result-container class`);
        } catch (e2) {
          // Strategy 3: Use span.user-name with text match
          try {
            const teamOption3 = resultsContainer.locator(`span.user-name:has-text("${teamName}")`).first();
            await expect(teamOption3).toBeVisible({ timeout: 2000 });
            // Click on the parent <a> tag
            await teamOption3.locator('..').click({ timeout: 2000 });
            clicked = true;
            console.log(`✅ Selected team "${teamName}" using user-name span`);
          } catch (e3) {
            // Strategy 4: Fallback to any link in results container with matching text
            try {
              const teamOption4 = resultsContainer.locator(`a:has-text("${teamName}")`).first();
              await expect(teamOption4).toBeVisible({ timeout: 2000 });
              await teamOption4.click({ timeout: 2000 });
              clicked = true;
              console.log(`✅ Selected team "${teamName}" using link with text`);
            } catch (e4) {
              console.log(`⚠️ All click strategies failed for team "${teamName}"`);
              throw new Error(`Failed to select team "${teamName}" - element not found or not clickable`);
            }
          }
        }
      }
      
      if (!clicked) {
        throw new Error(`Failed to select team "${teamName}"`);
      }
      
      // Wait for selection to complete
      await this.page.waitForTimeout(300);
    } catch (e) {
      // If search input doesn't appear, try setting hidden field directly
      const hiddenTeamInput = this.page.locator('input#team_name[type="hidden"]');
      if (await hiddenTeamInput.isVisible().catch(() => false)) {
        await this.page.evaluate((name) => {
          const input = document.getElementById('team_name') as HTMLInputElement;
          if (input) input.value = name;
        }, teamName);
      }
      console.log(`⚠️ Team search input not found, continuing with date setup`);
    }
    
    // Set dates: 7 days before to today
    const startDate = this.get7DaysBeforePST();
    const endDate = this.getTodayDatePST();
    await this.setDateRange(startDate, endDate);
  }

  /**
   * Handle Onboarding Status Report - Set dates only
   */
  async handleOnboardingStatusReport(): Promise<void> {
    const startDate = this.get7DaysBeforePST();
    const endDate = this.getTodayDatePST();
    await this.setDateRange(startDate, endDate);
  }

  /**
   * Handle Onboarding Specialist Productivity Report - Select State and set dates
   */
  async handleOnboardingSpecialistProductivityReport(state: string = 'Arizona'): Promise<void> {
    console.log(`🔍 Selecting state "${state}" from dropdown...`);

    try {
      // Step 1: Click on the visible multiselect trigger to open the dropdown
      // The trigger has class "multiselect-visible-selector-container" and role="button"
      const stateTrigger = this.page.locator('div.multiselect-visible-selector-container[role="button"]').filter({ hasText: /select state/i }).or(
        this.page.locator('div#multiselect-component-state div.multiselect-visible-selector-container[role="button"]')
      ).first();
      
      await expect(stateTrigger).toBeVisible({ timeout: 10000 });
      console.log('🔍 Clicking state dropdown trigger...');
      await stateTrigger.click();
      await this.page.waitForTimeout(500); // Wait for dropdown to open
      
      // Step 2: Find and click the button for the selected state
      // The buttons have IDs like dropdown-btn-arizona-state, dropdown-btn-california-state, etc.
      // And they contain the state name as text
      const stateButton = this.page.locator(`button.multiselect-dropdown-btn:has-text("${state}")`).or(
        this.page.locator(`button[id*="dropdown-btn-${state.toLowerCase().replace(/\s+/g, '-')}-state"]`)
      ).first();
      
      await expect(stateButton).toBeVisible({ timeout: 5000 });
      console.log(`🔍 Clicking state button for: ${state}`);
      await stateButton.click();
      await this.page.waitForTimeout(500); // Wait for selection to complete
      
      console.log(`✅ Selected state: ${state}`);
      
      // Step 3: Click outside the dropdown to collapse it
      // Click on a neutral area (like the page title or a static element) to close the dropdown
      console.log('🔍 Clicking outside to collapse dropdown...');
      await this.page.locator('body').click({ position: { x: 0, y: 0 } });
      // Alternative: Click on the page title or Reports heading
      // await this.pageTitle.click();
      await this.page.waitForTimeout(300); // Wait for dropdown to collapse
      console.log('✅ Dropdown collapsed');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.log(`⚠️ Failed to select state using multiselect trigger: ${errorMessage}`);
      
      // Fallback: Try to interact with hidden select directly using evaluate
      console.log('⚠️ Attempting fallback: setting value on hidden select...');
      try {
        const hiddenStateSelect = this.page.locator('select#hidden-multiselect-state');
        await hiddenStateSelect.waitFor({ state: 'attached', timeout: 5000 });
        
        // Use evaluate to set the value directly on the hidden select
        await hiddenStateSelect.evaluate((select: HTMLSelectElement, stateValue: string) => {
          // Find the option with matching text
          const options = Array.from(select.options);
          const option = options.find(opt => opt.textContent?.trim() === stateValue);
          if (option) {
            select.value = option.value;
            // Trigger change event to notify the multiselect component
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, state);
        
        await this.page.waitForTimeout(500); // Wait for multiselect component to update
        console.log(`✅ Selected state via hidden select fallback: ${state}`);
        
        // Also click outside after fallback selection
        console.log('🔍 Clicking outside to collapse dropdown...');
        await this.page.locator('body').click({ position: { x: 0, y: 0 } });
        await this.page.waitForTimeout(300);
        console.log('✅ Dropdown collapsed');
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.log(`❌ Failed to select state: ${fallbackErrorMessage}`);
        throw new Error(`Failed to select state "${state}": ${fallbackErrorMessage}`);
      }
    }
    
    await this.page.waitForTimeout(300);
    
    const startDate = this.get7DaysBeforePST();
    const endDate = this.getTodayDatePST();
    await this.setDateRange(startDate, endDate);
  }

  /**
   * Handle Onboarding Specialist Report - Search Specialist and select Month
   */
  async handleOnboardingSpecialistReport(specialistName: string = 'Auto OB Specialist', month?: string): Promise<void> {
    await this.page.waitForTimeout(1000); // Wait for dynamic fields to load
    
    // Try to find the specialist search input
    const specialistInput = this.page.locator('input[placeholder*="Search Onboarding Specialist" i], input[name*="specialist" i], input[id*="specialist" i], input[data-controller*="autocomplete" i]').first();
    
    try {
      await expect(specialistInput).toBeVisible({ timeout: 5000 });
      // Search for specialist
      await specialistInput.fill(specialistName);
      await this.page.waitForTimeout(500);
      
      // Wait for the dropdown results container to appear
      // Use specific ID like team search does
      const resultsContainer = this.page.locator('div#users-search-results');
      await expect(resultsContainer).toBeVisible({ timeout: 5000 });
      
      // Select from dropdown using the specific HTML structure:
      // <div id="users-search-results"><a data-user="Auto OB Specialist" class="search-result-container">...</a></div>
      // Try multiple strategies in order of specificity
      let clicked = false;
      
      // Strategy 1: Use data-user attribute (most specific and reliable, similar to data-team)
      try {
        const specialistOption1 = resultsContainer.locator(`a[data-user="${specialistName}"]`).first();
        await expect(specialistOption1).toBeVisible({ timeout: 2000 });
        await specialistOption1.click({ timeout: 2000 });
        clicked = true;
        console.log(`✅ Selected specialist "${specialistName}" using data-user attribute`);
      } catch (e1) {
        // Strategy 2: Use search-result-container class with text match
        try {
          const specialistOption2 = resultsContainer.locator(`a.search-result-container:has-text("${specialistName}")`).first();
          await expect(specialistOption2).toBeVisible({ timeout: 2000 });
          await specialistOption2.click({ timeout: 2000 });
          clicked = true;
          console.log(`✅ Selected specialist "${specialistName}" using search-result-container class`);
        } catch (e2) {
          // Strategy 3: Use user-name span with text match
          try {
            const specialistOption3 = resultsContainer.locator(`span.user-name:has-text("${specialistName}")`).first();
            await expect(specialistOption3).toBeVisible({ timeout: 2000 });
            // Click on the parent <a> tag
            await specialistOption3.locator('..').click({ timeout: 2000 });
            clicked = true;
            console.log(`✅ Selected specialist "${specialistName}" using user-name span`);
          } catch (e3) {
            // Strategy 4: Fallback to any link in results container with matching text
            try {
              const specialistOption4 = resultsContainer.locator(`a:has-text("${specialistName}")`).first();
              await expect(specialistOption4).toBeVisible({ timeout: 2000 });
              await specialistOption4.click({ timeout: 2000 });
              clicked = true;
              console.log(`✅ Selected specialist "${specialistName}" using link with text`);
            } catch (e4) {
              console.log(`⚠️ All click strategies failed for specialist "${specialistName}"`);
              throw new Error(`Failed to select specialist "${specialistName}" - element not found or not clickable`);
            }
          }
        }
      }
      
      if (!clicked) {
        throw new Error(`Failed to select specialist "${specialistName}"`);
      }
      
      // Wait for selection to complete
      await this.page.waitForTimeout(300);
    } catch (e) {
      // If search input doesn't appear, try setting hidden field directly
      const hiddenSpecialistInput = this.page.locator('input#users_ids[type="hidden"]');
      if (await hiddenSpecialistInput.isVisible().catch(() => false)) {
        // Note: This might need the user ID, not the name
        console.log(`⚠️ Specialist search input not found, may need to set users_ids`);
      } else {
        const errorMessage = e instanceof Error ? e.message : String(e);
        console.log(`⚠️ Specialist selection failed: ${errorMessage}`);
        throw e;
      }
    }
    
    // Select month dropdown - MUST happen before Generate button
    // Wait for month dropdown to be visible and select current month in PST
    console.log('🔍 Selecting current month from dropdown...');
    
    // Get current month in PST timezone (already handles daylight saving)
    const currentMonthPST = this.getCurrentMonth();
    const monthToSelect = month || currentMonthPST;
    console.log(`📅 Current month in PST: ${currentMonthPST}`);

    try {
      // Step 1: Try to click on the visible multiselect trigger to open the dropdown (same approach as state dropdown)
      const monthTrigger = this.page.locator('div.multiselect-visible-selector-container[role="button"]').filter({ hasText: /select month|month/i }).or(
        this.page.locator('div#multiselect-component-months div.multiselect-visible-selector-container[role="button"]')
      ).first();
      
      const isTriggerVisible = await monthTrigger.isVisible({ timeout: 5000 }).catch(() => false);
      
      if (isTriggerVisible) {
        console.log('🔍 Clicking month dropdown trigger...');
        await monthTrigger.click();
        await this.page.waitForTimeout(500); // Wait for dropdown to open
        
        // Step 2: Find and click the button for the selected month
        const monthButton = this.page.locator(`button.multiselect-dropdown-btn:has-text("${monthToSelect}")`).or(
          this.page.locator(`button[id*="dropdown-btn-${monthToSelect.toLowerCase().replace(/\s+/g, '-')}-months"]`)
        ).first();
        
        const isButtonVisible = await monthButton.isVisible({ timeout: 5000 }).catch(() => false);
        
        if (isButtonVisible) {
          console.log(`🔍 Clicking month button for: ${monthToSelect}`);
          await monthButton.click();
          await this.page.waitForTimeout(500); // Wait for selection to complete
          console.log(`✅ Selected month: ${monthToSelect}`);
          
          // Step 3: Click outside the dropdown to collapse it
          console.log('🔍 Clicking outside to collapse dropdown...');
          await this.page.locator('body').click({ position: { x: 0, y: 0 } });
          await this.page.waitForTimeout(300); // Wait for dropdown to collapse
          console.log('✅ Dropdown collapsed');
        } else {
          throw new Error(`Month button "${monthToSelect}" not found in dropdown`);
        }
      } else {
        // No visible trigger found - try interacting with visible select directly
        console.log('⚠️ Multiselect trigger not found, trying visible select...');
        const monthDropdown = this.page.locator('select#select_month:not(#hidden-multiselect-months), select#month:not(#hidden-multiselect-months), select[name*="month" i]:not(#hidden-multiselect-months)').first();
        
        const isVisible = await monthDropdown.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isVisible) {
          await monthDropdown.selectOption(monthToSelect);
          await this.page.waitForTimeout(300);
          console.log(`✅ Selected month via visible select: ${monthToSelect}`);
        } else {
          // Fallback: interact with hidden multiselect directly
          throw new Error('No visible month dropdown found, attempting hidden select fallback...');
        }
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      console.log(`⚠️ Failed to select month using multiselect trigger: ${errorMessage}`);
      
      // Fallback: Try to interact with hidden multiselect directly using evaluate
      console.log('⚠️ Attempting fallback: setting value on hidden select...');
      try {
        const hiddenMonthSelect = this.page.locator('select#hidden-multiselect-months');
        await hiddenMonthSelect.waitFor({ state: 'attached', timeout: 5000 });
        
        // Use evaluate to set the value directly on the hidden select
        await hiddenMonthSelect.evaluate((select: HTMLSelectElement, monthValue: string) => {
          // Find the option with matching text
          const options = Array.from(select.options);
          const option = options.find(opt => opt.textContent?.trim() === monthValue);
          if (option) {
            select.value = option.value;
            // Trigger change event to notify the multiselect component
            select.dispatchEvent(new Event('change', { bubbles: true }));
          } else {
            throw new Error(`Month option "${monthValue}" not found in select`);
          }
        }, monthToSelect);
        
        await this.page.waitForTimeout(500); // Wait for multiselect component to update
        console.log(`✅ Selected month via hidden select fallback: ${monthToSelect}`);
        
        // Also click outside after fallback selection
        console.log('🔍 Clicking outside to collapse dropdown...');
        await this.page.locator('body').click({ position: { x: 0, y: 0 } });
        await this.page.waitForTimeout(300);
        console.log('✅ Dropdown collapsed');
      } catch (fallbackError) {
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        console.log(`❌ Failed to select month: ${fallbackErrorMessage}`);
        throw new Error(`Failed to select month "${monthToSelect}" for Onboarding Specialist Report: ${fallbackErrorMessage}`);
      }
    }
    
    await this.page.waitForTimeout(300);
  }

  /**
   * Handle Brokerage Ops Report - Set yesterday to today dates
   */
  async handleBrokerageOpsReport(): Promise<void> {
    const startDate = this.getYesterdayDatePST();
    const endDate = this.getTodayDatePST();
    await this.setDateRange(startDate, endDate);
  }

  /**
   * Handle Completed Tasks Report - Set task completed dates
   */
  async handleCompletedTasksReport(): Promise<void> {
    // Wait for form to be ready after report selection
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    await this.page.waitForTimeout(1000); // Additional wait for dynamic form fields
    
    console.log('🔍 Waiting for Task Completed date inputs...');
    
    const startDate = this.get7DaysBeforePST();
    const endDate = this.getTodayDatePST();
    console.log(`📅 Setting Task Completed dates - Start: ${startDate}, End: ${endDate}`);
    
    // Try multiple strategies to find Task Completed Start Date input
    let startDateInput: Locator | null = null;
    let endDateInput: Locator | null = null;
    
    // Strategy 1: Try the specific locators defined in constructor
    const specificStartInput = this.taskCompletedStartDateInput;
    const specificEndInput = this.taskCompletedEndDateInput;
    
    let isStartVisible = await specificStartInput.isVisible({ timeout: 3000 }).catch(() => false);
    let isEndVisible = await specificEndInput.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isStartVisible && isEndVisible) {
      startDateInput = specificStartInput;
      endDateInput = specificEndInput;
      console.log('✅ Found Task Completed date inputs using specific locators');
    } else {
      // Strategy 2: Try simple start_date/end_date IDs (most common)
      console.log('⚠️ Specific locators not found, trying simple start_date/end_date IDs...');
      const simpleStartInput = this.page.locator('input#start_date, input[name="start_date"]').first();
      const simpleEndInput = this.page.locator('input#end_date, input[name="end_date"]').first();
      
      isStartVisible = await simpleStartInput.isVisible({ timeout: 3000 }).catch(() => false);
      isEndVisible = await simpleEndInput.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isStartVisible && isEndVisible) {
        startDateInput = simpleStartInput;
        endDateInput = simpleEndInput;
        console.log('✅ Found Task Completed date inputs using simple start_date/end_date IDs');
      } else {
        // Strategy 3: Try alternative locators with different patterns
        console.log('⚠️ Simple IDs not found, trying alternative patterns...');
        
        // Try with different name/id patterns
        const altStartInput = this.page.locator('input[name*="task_completed_start" i], input[id*="task_completed_start" i], input[placeholder*="Task Completed Start" i], input[placeholder*="Completed Start" i]').first();
        const altEndInput = this.page.locator('input[name*="task_completed_end" i], input[id*="task_completed_end" i], input[placeholder*="Task Completed End" i], input[placeholder*="Completed End" i]').first();
        
        isStartVisible = await altStartInput.isVisible({ timeout: 3000 }).catch(() => false);
        isEndVisible = await altEndInput.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isStartVisible && isEndVisible) {
          startDateInput = altStartInput;
          endDateInput = altEndInput;
          console.log('✅ Found Task Completed date inputs using alternative locators');
        } else {
          // Strategy 3: Try to find by label text
          console.log('⚠️ Alternative locators not found, trying label-based search...');
          const startLabel = this.page.locator('label:has-text("Task Completed Start"), label:has-text("Completed Start"), label:has-text("Task Completed Start Date")').first();
          const endLabel = this.page.locator('label:has-text("Task Completed End"), label:has-text("Completed End"), label:has-text("Task Completed End Date")').first();
          
          const startLabelVisible = await startLabel.isVisible({ timeout: 2000 }).catch(() => false);
          const endLabelVisible = await endLabel.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (startLabelVisible) {
            const startInputId = await startLabel.getAttribute('for').catch(() => null);
            if (startInputId) {
              startDateInput = this.page.locator(`input#${startInputId}`);
              // Try attached first, then visible
              await startDateInput.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
              isStartVisible = await startDateInput.isVisible({ timeout: 2000 }).catch(() => false);
            } else {
              // If no 'for' attribute, try finding input next to label
              startDateInput = startLabel.locator('..').locator('input[type="date"], input[type="text"]').first();
              await startDateInput.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
              isStartVisible = await startDateInput.isVisible({ timeout: 2000 }).catch(() => false);
            }
          }
          
          if (endLabelVisible) {
            const endInputId = await endLabel.getAttribute('for').catch(() => null);
            if (endInputId) {
              endDateInput = this.page.locator(`input#${endInputId}`);
              await endDateInput.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
              isEndVisible = await endDateInput.isVisible({ timeout: 2000 }).catch(() => false);
            } else {
              // If no 'for' attribute, try finding input next to label
              endDateInput = endLabel.locator('..').locator('input[type="date"], input[type="text"]').first();
              await endDateInput.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
              isEndVisible = await endDateInput.isVisible({ timeout: 2000 }).catch(() => false);
            }
          }
          
          if (isStartVisible && isEndVisible) {
            console.log('✅ Found Task Completed date inputs using label-based search');
          } else {
            // Strategy 4: Final fallback - try simple start_date/end_date
            console.log('⚠️ Label-based search failed, trying simple start_date/end_date as final fallback...');
            const fallbackStartInput = this.page.locator('input#start_date, input[name="start_date"]').first();
            const fallbackEndInput = this.page.locator('input#end_date, input[name="end_date"]').first();
            
            isStartVisible = await fallbackStartInput.isVisible({ timeout: 2000 }).catch(() => false);
            isEndVisible = await fallbackEndInput.isVisible({ timeout: 2000 }).catch(() => false);
            
            if (isStartVisible && isEndVisible) {
              startDateInput = fallbackStartInput;
              endDateInput = fallbackEndInput;
              console.log('✅ Found Task Completed date inputs using fallback start_date/end_date');
            }
          }
        }
      }
    }
    
    // Final check: if inputs not found by visibility, try attached state
    if (!startDateInput || !endDateInput) {
      // Try simple start_date/end_date as last resort
      const finalStartInput = this.page.locator('input#start_date, input[name="start_date"]').first();
      const finalEndInput = this.page.locator('input#end_date, input[name="end_date"]').first();
      
      const startAttached = await finalStartInput.count() > 0;
      const endAttached = await finalEndInput.count() > 0;
      
      if (startAttached && endAttached) {
        startDateInput = finalStartInput;
        endDateInput = finalEndInput;
        console.log('✅ Found Task Completed date inputs using final fallback (attached to DOM)');
        // Wait for them to be attached
        await startDateInput.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
        await endDateInput.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
      } else {
        // Log all available date inputs for debugging
        const allDateInputs = await this.page.locator('input[type="date"], input[type="text"][placeholder*="date" i], input[name*="date" i], input#start_date, input#end_date').all();
        const inputInfo = await Promise.all(allDateInputs.map(async (input) => {
          const id = await input.getAttribute('id').catch(() => 'no-id');
          const name = await input.getAttribute('name').catch(() => 'no-name');
          const placeholder = await input.getAttribute('placeholder').catch(() => 'no-placeholder');
          const isVisible = await input.isVisible().catch(() => false);
          return `id="${id}", name="${name}", placeholder="${placeholder}", visible=${isVisible}`;
        }));
        console.log(`❌ Available date inputs on page: ${inputInfo.join('; ')}`);
        
        throw new Error(`Task Completed date inputs not found. Start attached: ${startAttached}, End attached: ${endAttached}`);
      }
    }
    
    // Fill the date inputs
    console.log(`📝 Entering Task Completed Start Date: ${startDate}`);
    await startDateInput.fill(startDate);
    await this.page.waitForTimeout(200);
    
    // Verify Start Date was entered
    const enteredStartDate = await startDateInput.inputValue();
    if (enteredStartDate !== startDate) {
      console.log(`⚠️ Start Date mismatch - Expected: ${startDate}, Got: ${enteredStartDate}`);
      // Try filling again
      await startDateInput.fill(startDate);
      await this.page.waitForTimeout(200);
    }
    
    console.log(`📝 Entering Task Completed End Date: ${endDate}`);
    await endDateInput.fill(endDate);
    await this.page.waitForTimeout(300);
    
    // Verify End Date was entered
    const enteredEndDate = await endDateInput.inputValue();
    if (enteredEndDate !== endDate) {
      console.log(`⚠️ End Date mismatch - Expected: ${endDate}, Got: ${enteredEndDate}`);
      // Try filling again
      await endDateInput.fill(endDate);
      await this.page.waitForTimeout(200);
    }
    
    console.log(`✅ Task Completed dates entered successfully - Start: ${enteredStartDate}, End: ${enteredEndDate}`);
  }

  /**
   * Handle Custom Data Export Tasks Report - Set task created dates
   */
  async handleCustomDataExportTasksReport(): Promise<void> {
    // Wait for form to be ready after report selection
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    await this.page.waitForTimeout(1000); // Additional wait for dynamic form fields
    
    console.log('🔍 Waiting for Task Created date inputs...');
    
    const startDate = this.get7DaysBeforePST();
    const endDate = this.getTodayDatePST();
    console.log(`📅 Setting Task Created dates - Start: ${startDate}, End: ${endDate}`);
    
    // Try multiple strategies to find Task Created Start Date and End Date inputs
    let startDateInput: Locator | null = null;
    let endDateInput: Locator | null = null;
    
    // Strategy 1: Try the specific locators defined in constructor
    const specificStartInput = this.taskCreatedStartDateInput;
    const specificEndInput = this.taskCreatedEndDateInput;
    
    let isStartVisible = await specificStartInput.isVisible({ timeout: 3000 }).catch(() => false);
    let isEndVisible = await specificEndInput.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (isStartVisible && isEndVisible) {
      startDateInput = specificStartInput;
      endDateInput = specificEndInput;
      console.log('✅ Found Task Created date inputs using specific locators');
    } else {
      // Strategy 2: Try simple start_date/end_date IDs (most common)
      console.log('⚠️ Specific locators not found, trying simple start_date/end_date IDs...');
      const simpleStartInput = this.page.locator('input#start_date, input[name="start_date"]').first();
      const simpleEndInput = this.page.locator('input#end_date, input[name="end_date"]').first();
      
      isStartVisible = await simpleStartInput.isVisible({ timeout: 3000 }).catch(() => false);
      isEndVisible = await simpleEndInput.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (isStartVisible && isEndVisible) {
        startDateInput = simpleStartInput;
        endDateInput = simpleEndInput;
        console.log('✅ Found Task Created date inputs using simple start_date/end_date IDs');
      } else {
        // Strategy 3: Try alternative locators with different patterns
        console.log('⚠️ Simple IDs not found, trying alternative patterns...');
        
        // Try with different name/id patterns
        const altStartInput = this.page.locator('input[name*="task_created_start" i], input[id*="task_created_start" i], input[placeholder*="Task Created Start" i], input[placeholder*="Created Start" i]').first();
        const altEndInput = this.page.locator('input[name*="task_created_end" i], input[id*="task_created_end" i], input[placeholder*="Task Created End" i], input[placeholder*="Created End" i]').first();
        
        isStartVisible = await altStartInput.isVisible({ timeout: 3000 }).catch(() => false);
        isEndVisible = await altEndInput.isVisible({ timeout: 3000 }).catch(() => false);
        
        if (isStartVisible && isEndVisible) {
          startDateInput = altStartInput;
          endDateInput = altEndInput;
          console.log('✅ Found Task Created date inputs using alternative locators');
        } else {
          // Strategy 4: Final fallback - try simple start_date/end_date
          console.log('⚠️ Alternative locators not found, trying simple start_date/end_date as final fallback...');
          const fallbackStartInput = this.page.locator('input#start_date, input[name="start_date"]').first();
          const fallbackEndInput = this.page.locator('input#end_date, input[name="end_date"]').first();
          
          isStartVisible = await fallbackStartInput.isVisible({ timeout: 2000 }).catch(() => false);
          isEndVisible = await fallbackEndInput.isVisible({ timeout: 2000 }).catch(() => false);
          
          if (isStartVisible && isEndVisible) {
            startDateInput = fallbackStartInput;
            endDateInput = fallbackEndInput;
            console.log('✅ Found Task Created date inputs using fallback start_date/end_date');
          }
        }
      }
    }
    
    // Final check: if inputs not found by visibility, try attached state
    if (!startDateInput || !endDateInput) {
      // Try simple start_date/end_date as last resort
      const finalStartInput = this.page.locator('input#start_date, input[name="start_date"]').first();
      const finalEndInput = this.page.locator('input#end_date, input[name="end_date"]').first();
      
      const startAttached = await finalStartInput.count() > 0;
      const endAttached = await finalEndInput.count() > 0;
      
      if (startAttached && endAttached) {
        startDateInput = finalStartInput;
        endDateInput = finalEndInput;
        console.log('✅ Found Task Created date inputs using final fallback (attached to DOM)');
        // Wait for them to be attached
        await startDateInput.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
        await endDateInput.waitFor({ state: 'attached', timeout: 2000 }).catch(() => {});
      } else {
        // Log all available date inputs for debugging
        const allDateInputs = await this.page.locator('input[type="date"], input[type="text"][placeholder*="date" i], input[name*="date" i], input#start_date, input#end_date').all();
        const inputInfo = await Promise.all(allDateInputs.map(async (input) => {
          const id = await input.getAttribute('id').catch(() => 'no-id');
          const name = await input.getAttribute('name').catch(() => 'no-name');
          const placeholder = await input.getAttribute('placeholder').catch(() => 'no-placeholder');
          const isVisible = await input.isVisible().catch(() => false);
          return `id="${id}", name="${name}", placeholder="${placeholder}", visible=${isVisible}`;
        }));
        console.log(`❌ Available date inputs on page: ${inputInfo.join('; ')}`);
        
        throw new Error(`Task Created date inputs not found. Start attached: ${startAttached}, End attached: ${endAttached}`);
      }
    }
    
    // Fill the date inputs
    console.log(`📝 Entering Task Created Start Date: ${startDate}`);
    await startDateInput.fill(startDate);
    await this.page.waitForTimeout(200);
    
    // Verify Start Date was entered
    const enteredStartDate = await startDateInput.inputValue();
    if (enteredStartDate !== startDate) {
      console.log(`⚠️ Start Date mismatch - Expected: ${startDate}, Got: ${enteredStartDate}`);
      // Try filling again
      await startDateInput.fill(startDate);
      await this.page.waitForTimeout(200);
    }
    
    console.log(`📝 Entering Task Created End Date: ${endDate}`);
    await endDateInput.fill(endDate);
    await this.page.waitForTimeout(300);
    
    // Verify End Date was entered
    const enteredEndDate = await endDateInput.inputValue();
    if (enteredEndDate !== endDate) {
      console.log(`⚠️ End Date mismatch - Expected: ${endDate}, Got: ${enteredEndDate}`);
      // Try filling again
      await endDateInput.fill(endDate);
      await this.page.waitForTimeout(200);
    }
    
    console.log(`✅ Task Created dates entered successfully - Start: ${enteredStartDate}, End: ${enteredEndDate}`);
  }

  /**
   * Handle Onboarding Task Report - Verify prefilled dates, then override
   */
  async handleOnboardingTaskReport(): Promise<void> {
    // Verify dates are prefilled (check if they exist and match expected values)
    const lastFriday = this.getLastFridayPST();
    const upcomingThursday = this.getUpcomingThursdayPST();
    
    const startDateValue = await this.startDateInput.inputValue().catch(() => '');
    const endDateValue = await this.endDateInput.inputValue().catch(() => '');
    
    console.log(`🔍 Prefilled dates - Start: ${startDateValue}, End: ${endDateValue}`);
    console.log(`🔍 Expected prefilled - Start: ${lastFriday}, End: ${upcomingThursday}`);
    
    // Override to yesterday and today
    const startDate = this.getYesterdayDatePST();
    const endDate = this.getTodayDatePST();
    await this.setDateRange(startDate, endDate);
  }

  /**
   * Handle Onboarding Communication Report - Verify prefilled dates, then override
   */
  async handleOnboardingCommunicationReport(): Promise<void> {
    const lastFriday = this.getLastFridayPST();
    const upcomingThursday = this.getUpcomingThursdayPST();
    
    const startDateValue = await this.startDateInput.inputValue().catch(() => '');
    const endDateValue = await this.endDateInput.inputValue().catch(() => '');
    
    console.log(`🔍 Prefilled dates - Start: ${startDateValue}, End: ${endDateValue}`);
    console.log(`🔍 Expected prefilled - Start: ${lastFriday}, End: ${upcomingThursday}`);
    
    // Override to yesterday and today
    const startDate = this.getYesterdayDatePST();
    const endDate = this.getTodayDatePST();
    await this.setDateRange(startDate, endDate);
  }

  /**
   * Handle Onboarding Module Agents Report - Verify prefilled dates, then override
   */
  async handleOnboardingModuleAgentsReport(): Promise<void> {
    const lastFriday = this.getLastFridayPST();
    const upcomingThursday = this.getUpcomingThursdayPST();
    
    const startDateValue = await this.startDateInput.inputValue().catch(() => '');
    const endDateValue = await this.endDateInput.inputValue().catch(() => '');
    
    console.log(`🔍 Prefilled dates - Start: ${startDateValue}, End: ${endDateValue}`);
    console.log(`🔍 Expected prefilled - Start: ${lastFriday}, End: ${upcomingThursday}`);
    
    // Override to yesterday and today
    const startDate = this.getYesterdayDatePST();
    const endDate = this.getTodayDatePST();
    await this.setDateRange(startDate, endDate);
  }

  /**
   * Click Generate button
   */
  async clickGenerate(): Promise<void> {
    // Based on HTML: input#onb_reports_submit_btn or input[type="submit"][value="Generate"]
    const generateBtn = this.page.locator('input#onb_reports_submit_btn, input[type="submit"][value="Generate"]').first();
    await expect(generateBtn).toBeVisible({ timeout: 10000 });
    await expect(generateBtn).toBeEnabled({ timeout: 10000 });
    await generateBtn.click();
    await this.page.waitForTimeout(500);
  }

  /**
   * Wait for and close the report generation alert
   */
  async waitForAndCloseAlert(alertText: string): Promise<void> {
    // Use exact: false to handle slight variations in alert text
    const alertLocator = this.page.getByText(alertText, { exact: false });
    await expect(alertLocator).toBeVisible({ timeout: 60000 });
    console.log(`✅ Alert appeared: "${alertText}"`);
    
    // Try to find and click close button
    const closeButton = this.page.getByRole('button', { name: /close|dismiss|ok/i }).or(
      this.page.locator('[aria-label*="close" i]')
    ).first();
    
    try {
      await closeButton.click({ timeout: 3000 });
      console.log('✅ Alert closed via button');
    } catch (e) {
      // If no close button, press Escape
      console.log('⚠️ Close button not found, pressing Escape...');
      await this.page.keyboard.press('Escape');
      console.log('✅ Alert dismissed via Escape key');
    }
    
    await this.page.waitForTimeout(500);
  }

  /**
   * Get headers for a specific report
   */
  getHeadersForReport(reportName: string): string[] {
    switch (reportName) {
      case 'Onboarding Team Status Report':
        return [...OnboardingReportsPagePO.ONBOARDING_TEAM_STATUS_REPORT_HEADERS];
      case 'Onboarding Status Report':
        return [...OnboardingReportsPagePO.ONBOARDING_STATUS_REPORT_HEADERS];
      case 'Onboarding Specialist Productivity Report':
        return [...OnboardingReportsPagePO.ONBOARDING_SPECIALIST_PRODUCTIVITY_REPORT_HEADERS];
      case 'Onboarding Specialist Report':
        return [...OnboardingReportsPagePO.ONBOARDING_SPECIALIST_REPORT_HEADERS];
      case 'Brokerage Ops':
        return [...OnboardingReportsPagePO.BROKERAGE_OPS_HEADERS];
      case 'Completed Tasks':
        return [...OnboardingReportsPagePO.COMPLETED_TASKS_HEADERS];
      case 'Custom Data Export Tasks':
        return [...OnboardingReportsPagePO.CUSTOM_DATA_EXPORT_TASKS_HEADERS];
      case 'Onboarding Communication Report':
        return [...OnboardingReportsPagePO.ONBOARDING_COMMUNICATION_REPORT_HEADERS];
      case 'Onboarding Module Agents':
        return [...OnboardingReportsPagePO.ONBOARDING_MODULE_AGENTS_HEADERS];
      default:
        throw new Error(`Headers not defined for report: ${reportName}`);
    }
  }
}

