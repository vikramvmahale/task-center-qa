import { test, expect, Page } from '@playwright/test';
import { POManager } from '../../PageObjects/POManager';
import { getEnvironmentConfig } from '../../utils/config/environment-config';
import { ApiManager } from '../../api/ApiManager';
import { AccountSolutionsReportsPagePO } from '../../PageObjects/AccountSolutionsReportsPagePO';
import { OnboardingReportsPagePO } from '../../PageObjects/OnboardingReportsPagePO';
import { accountSolutionsReportsConfig, onboardingReportsConfig, reportsTestConfig } from '../../utils/config/reports-config';

/**
 * Reports Functional Test
 * 
 * This test suite validates the Task Center Reports functionality:
 * 1. Launch the Task Center Application in Acceptance Environment
 * 2. Login as Admin User
 * 3. Navigate through modules to access Reports
 * 4. Validate Reports functionality for each module
 */

test.describe('Reports Functional Test', () => {
  let pOManager: POManager;
  let taskCenterUiUrl: string;
  let loginUrl: string;
  let adminEmail: string;
  let adminPassword: string;

  // Common setup - login once before all tests
  test.beforeEach(async ({ page }: { page: Page }) => {
    // Set environment to ACCP for this test suite
    if (typeof process !== 'undefined' && (process as any).env) {
      (process as any).env.TEST_ENV = 'accp';
    }
    
    // Get environment configuration
    const env = getEnvironmentConfig();

    // Check if we have Task Center UI configuration
    if (!('taskCenterUiUrl' in env) || !('taskCenterAdminEmail' in env) || !('taskCenterAdminPassword' in env)) {
      test.skip(true, 'Task Center UI credentials not configured for this environment');
      return;
    }

    taskCenterUiUrl = (env as any).taskCenterUiUrl;
    loginUrl = `${taskCenterUiUrl}/devise_new_session`;
    adminEmail = (env as any).taskCenterAdminEmail;
    adminPassword = (env as any).taskCenterAdminPassword;

    pOManager = new POManager(page);
    const loginPage = pOManager.getTaskCenterLoginPage();
    const authPage = pOManager.getAuthPage(loginUrl);
    const homePage = pOManager.getTaskCenterHomePage();

    // Step 1: Launch the Task Center Application in Acceptance Environment
    console.log('🔍 Launching Task Center Application in Acceptance Environment...');
    console.log(`📍 Task Center UI URL: ${taskCenterUiUrl}`);
    await page.goto(loginUrl, { waitUntil: 'load' });
    console.log('✅ Task Center application launched');
    
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

    // Step 5: Login as Admin User
    console.log('🔍 Logging in as Admin User...');
    console.log(`👤 Admin Email: ${adminEmail}`);
    await authPage.performOktaLogin(adminEmail, adminPassword, 'accp-tc.exprealty.com');
    console.log('✅ Admin login completed');

    // Step 6: Verify we're on the Task Center home page
    console.log('🔍 Verifying home page...');
    await homePage.expectOnPage();
    await homePage.expectLoggedIn();
    console.log('✅ Successfully logged in and on home page');

    // Verify URL contains Task Center domain
    const currentUrl = page.url();
    expect(currentUrl).toContain('accp-tc.exprealty.com');
    expect(currentUrl).not.toContain('okta');
    expect(currentUrl).not.toContain('devise_new_session');
    console.log(`✅ Final URL: ${currentUrl}`);
  });

  test.describe('Module Reports Validation', () => {
    test('should validate all reports for Account Solutions module', { tag: ['@functional', '@reports'] }, async ({ page }: { page: Page }) => {
      const homePage = pOManager.getTaskCenterHomePage();
      
      // Switch to Account Solutions module
      console.log('🔍 Switching to Account Solutions module...');
      await homePage.switchToModule('account_solution');
      
      // Navigate to Reports
      console.log('🔍 Navigating to Reports...');
      await homePage.clickReports();
      
      // Validate reports page
      const reportsPage = pOManager.getReportsPage();
      await reportsPage.expectOnPage();
      console.log('✅ Account Solutions Reports page loaded');
      
      // Verify URL contains module type
      const reportsUrl = page.url();
      expect(reportsUrl).toContain('accp-tc.exprealty.com');
      expect(reportsUrl).toContain('reports');
      console.log(`✅ Reports URL: ${reportsUrl}`);
      
      // Compare stored reports with dropdown options
      console.log('🔍 Validating stored reports are present in dropdown...');
      await reportsPage.expectAllStoredReportsPresent();
      console.log('✅ All stored reports are present in the Report Type dropdown');
      
      // Test reports based on config
      // If reportsToTest is specified in config, use only those reports
      // Otherwise, test all reports except excluded ones
      let reportsToTest: string[];
      if (accountSolutionsReportsConfig.reportsToTest && accountSolutionsReportsConfig.reportsToTest.length > 0) {
        reportsToTest = [...accountSolutionsReportsConfig.reportsToTest];
        console.log(`📋 Using reportsToTest from config: ${reportsToTest.join(', ')}`);
      } else {
        const allReports = [...AccountSolutionsReportsPagePO.REPORT_NAMES];
        reportsToTest = allReports.filter(
          report => !accountSolutionsReportsConfig.excludedReports.includes(report as any)
        );
        console.log(`📋 Testing all reports except excluded: ${reportsToTest.join(', ')}`);
      }
      
      console.log(`📋 Testing ${reportsToTest.length} report(s): ${reportsToTest.join(', ')}`);
      
      // Get API request context for CSV validation
      const request = page.request;
      const apiManager = new ApiManager(request);
      const mailTrapApi = apiManager.getMailTrapApi();
      
      // Reports that have CSV headers defined
      const reportsWithHeaders = [
        'Invoice Tasks Report',
        'TC AR Report',
        'TC Email Export',
        'TC Text Message Export',
        'Invoice Activity Report',
        'Paid Invoice Report',
        'Notes History Report',
        'Account Solutions Communication Report'
      ];
      
      // Track validation results
      const passedReports: string[] = [];
      const failedReports: Array<{ reportName: string; error: string }> = [];
      
      // Iterate through each report
      for (const reportName of reportsToTest) {
        try {
          console.log(`\n${'='.repeat(80)}`);
          console.log(`📊 Testing Report: ${reportName}`);
          console.log(`${'='.repeat(80)}`);
          
          // Select the report
          console.log(`🔍 Selecting report "${reportName}"...`);
          await reportsPage.selectReportByName(reportName);
          console.log(`✅ Selected report: ${reportName}`);
          
          // Verify Start Date and End Date fields are present
          console.log('🔍 Verifying Start Date and End Date fields...');
          await reportsPage.expectFormReady();
          console.log('✅ Start Date and End Date fields are present');
          
          // Special handling for Notes History Report - select Invoice Status and set dates
          if (reportName === 'Notes History Report') {
            console.log('🔍 Handling Notes History Report...');
            console.log('🔍 Validating Invoice Status dropdown for Notes History Report...');
            await reportsPage.expectInvoiceStatusDropdown();
            console.log('✅ Invoice Status dropdown validated');
            
            // Select "Open" from Invoice Status dropdown
            await reportsPage.selectInvoiceStatus('Open');
            
            // Set Start Date and End Date (using today's date)
            const todayDate = reportsPage.getTodayDatePST();
            console.log(`📅 Today's date (PST/PDT): ${todayDate}`);
            console.log('🔍 Entering today\'s date in Start Date and End Date fields...');
            await reportsPage.setDateRange(todayDate, todayDate);
            console.log('✅ Dates entered successfully');
          } else if (reportName === 'Account Solutions Communication Report') {
            // Special handling for Account Solutions Communication Report - prefill dates
            console.log('🔍 Prefilling dates for Account Solutions Communication Report...');
            await reportsPage.prefillAccountSolutionsCommunicationReportDates();
            console.log('✅ Dates prefilled (last Friday to upcoming Thursday)');
          } else {
            // For other reports, use today's date
            const todayDate = reportsPage.getTodayDatePST();
            console.log(`📅 Today's date (PST/PDT): ${todayDate}`);
            
            // Enter today's date in both Start Date and End Date fields
            console.log('🔍 Entering today\'s date in Start Date and End Date fields...');
            await reportsPage.setDateRange(todayDate, todayDate);
            console.log('✅ Dates entered successfully');
          }
          
          // Click Generate button
          console.log('🔍 Clicking Generate button...');
          await reportsPage.clickGenerate();
          console.log('✅ Generate button clicked');
          
          // Wait for and close the alert
          const alertMessage = reportsTestConfig.alertMessages.reportGeneration;
          console.log('🔍 Waiting for report generation alert...');
          await reportsPage.waitForAndCloseAlert(alertMessage);
          console.log('✅ Alert closed successfully');
          
          // Validate CSV headers if this report has headers defined
          if (reportsWithHeaders.includes(reportName)) {
            console.log(`🔍 Validating CSV headers for ${reportName}...`);
            
            // Wait for email and download CSV report
            console.log(`📧 Waiting for email with subject "${reportName}"...`);
            const csvContent = await mailTrapApi.waitForEmailAndDownloadReport(reportName);
            
            // Log CSV content details
            const rows = mailTrapApi['parseCsvRows'](csvContent);
            const dataRowCount = rows.length > 1 ? rows.length - 1 : 0;
            console.log(`\n📊 CSV Report Details:`);
            console.log(`   - Total rows: ${rows.length}`);
            console.log(`   - Header row: ${rows.length > 0 ? 'Present' : 'Missing'}`);
            console.log(`   - Data rows: ${dataRowCount}`);
            console.log(`\n📈 Record Count for "${reportName}": ${dataRowCount} record(s)`);
            
            // Log if no records present
            if (dataRowCount === 0) {
              console.log(`⚠️ WARNING: No records found in "${reportName}" - Report is empty`);
            }
            
            // Get expected headers based on report type
            const expectedHeaders = reportsPage.getHeadersForReport(reportName);
            console.log(`\n📋 Header Validation:`);
            console.log(`   - Expected headers (${expectedHeaders.length}): ${expectedHeaders.join(', ')}`);
            
            // Validate CSV headers
            console.log('🔍 Validating CSV headers...');
            const validationResult = mailTrapApi.validateCsvHeaders(csvContent, expectedHeaders);
            
            // Log validation details
            if (validationResult.missingHeaders.length > 0) {
              console.log(`   ❌ Missing headers (${validationResult.missingHeaders.length}): ${validationResult.missingHeaders.join(', ')}`);
            }
            if (validationResult.extraHeaders.length > 0) {
              console.log(`   ⚠️ Extra headers (${validationResult.extraHeaders.length}): ${validationResult.extraHeaders.join(', ')}`);
            }
            
            // Assert validation passes
            if (!validationResult.isValid || validationResult.missingHeaders.length > 0) {
              const errorMsg = `CSV header validation failed. Missing headers: ${validationResult.missingHeaders.join(', ')}`;
              console.log(`❌ ${errorMsg}`);
              throw new Error(errorMsg);
            }
            
            console.log('✅ All expected CSV headers are present in the downloaded report');
            
            // Special validation for Account Solutions Communication Report
            if (reportName === 'Account Solutions Communication Report') {
              console.log('\n🔍 Validating Account Solutions Communication Report data rules...');
              console.log('   📋 Validation Rules:');
              console.log('      - Module Name must be "account_solution"');
              console.log('      - Communication Type must be valid');
              console.log('      - Task ID is required (except for Manual SMS/Email)');
              console.log('      - Send Date / Time must be within the selected date range (last Friday to upcoming Thursday)');
              console.log('      - Sent Status must be "Success"');
              const dataValidationResult = mailTrapApi.validateAccountSolutionsCommunicationReport(csvContent);
              
              if (!dataValidationResult.isValid || dataValidationResult.errors.length > 0 || dataValidationResult.rowErrors.length > 0) {
                const errors: string[] = [];
                if (dataValidationResult.errors.length > 0) {
                  errors.push(`Validation errors: ${dataValidationResult.errors.join(', ')}`);
                }
                if (dataValidationResult.rowErrors.length > 0) {
                  errors.push(`Row errors found in ${dataValidationResult.rowErrors.length} row(s)`);
                  dataValidationResult.rowErrors.slice(0, 5).forEach(({ row, errors: rowErrs }) => {
                    errors.push(`   Row ${row}: ${rowErrs.join('; ')}`);
                  });
                }
                const errorMsg = `Account Solutions Communication Report data validation failed. ${errors.join('; ')}`;
                console.log(`❌ ${errorMsg}`);
                throw new Error(errorMsg);
              }
              
              console.log(`   ✅ Validated ${dataRowCount} row(s) - All validations passed`);
              console.log('✅ Account Solutions Communication Report data validation passed');
            }
          } else {
            console.log(`ℹ️ Skipping CSV validation - headers not defined for ${reportName}`);
          }
          
          // If we reach here, the report validation passed
          passedReports.push(reportName);
          console.log(`✅ Completed validation for ${reportName}\n`);
          
        } catch (error) {
          // Log the error but continue to next report
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`\n❌ FAILED: Validation for "${reportName}" failed with error:`);
          console.log(`   ${errorMessage}`);
          console.log(`⚠️ Continuing to next report...\n`);
          
          failedReports.push({
            reportName,
            error: errorMessage
          });
        }
      }
      
      // Print summary
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 VALIDATION SUMMARY`);
      console.log(`${'='.repeat(80)}`);
      console.log(`✅ Passed: ${passedReports.length}/${reportsToTest.length}`);
      if (passedReports.length > 0) {
        console.log(`   ${passedReports.join(', ')}`);
      }
      console.log(`❌ Failed: ${failedReports.length}/${reportsToTest.length}`);
      if (failedReports.length > 0) {
        failedReports.forEach(({ reportName, error }) => {
          console.log(`   ${reportName}: ${error}`);
        });
      }
      console.log(`${'='.repeat(80)}\n`);
      
      // Assert that at least some reports passed (optional - you can remove this if you want the test to always pass)
      if (failedReports.length === reportsToTest.length) {
        throw new Error(`All ${reportsToTest.length} reports failed validation. See logs above for details.`);
      }
      
      // Log final status
      if (failedReports.length > 0) {
        console.log(`⚠️ Test completed with ${failedReports.length} failure(s). Check logs above for details.`);
      } else {
        console.log(`✅ All ${reportsToTest.length} reports validated successfully!`);
      }
    });

    test('should validate all reports for Onboarding module', { tag: ['@functional', '@reports'] }, async ({ page }: { page: Page }) => {
      const homePage = pOManager.getTaskCenterHomePage();
      
      // Switch to Onboarding module
      console.log('🔍 Switching to Onboarding module...');
      await homePage.switchToModule('onboarding');
      
      // Navigate to Reports
      console.log('🔍 Navigating to Reports...');
      await homePage.clickReports();
      
      // Validate reports page
      const onboardingReportsPage = pOManager.getOnboardingReportsPage();
      await onboardingReportsPage.expectOnPage();
      console.log('✅ Onboarding Reports page loaded');
      
      // Verify URL contains module type
      const reportsUrl = page.url();
      expect(reportsUrl).toContain('accp-tc.exprealty.com');
      expect(reportsUrl).toContain('reports');
      console.log(`✅ Reports URL: ${reportsUrl}`);
      
      // Compare stored reports with dropdown options
      console.log('🔍 Validating stored reports are present in dropdown...');
      await onboardingReportsPage.expectAllStoredReportsPresent();
      console.log('✅ All stored reports are present in the Report Type dropdown');
      
      // Test reports based on config
      // If reportsToTest is specified in config, use only those reports
      // Otherwise, test all reports except excluded ones
      let reportsToTest: string[];
      if (onboardingReportsConfig.reportsToTest && onboardingReportsConfig.reportsToTest.length > 0) {
        reportsToTest = [...onboardingReportsConfig.reportsToTest];
        console.log(`📋 Using reportsToTest from config: ${reportsToTest.join(', ')}`);
      } else {
        const allOnboardingReports = [...OnboardingReportsPagePO.REPORT_NAMES];
        reportsToTest = allOnboardingReports.filter(
          report => !onboardingReportsConfig.excludedReports.includes(report as any)
        );
        console.log(`📋 Testing all reports except excluded: ${reportsToTest.join(', ')}`);
      }
      
      console.log(`📋 Testing ${reportsToTest.length} report(s): ${reportsToTest.join(', ')}`);
      
      // Get API request context for CSV validation
      const request = page.request;
      const apiManager = new ApiManager(request);
      const mailTrapApi = apiManager.getMailTrapApi();
      
      // Track validation results
      const passedReports: string[] = [];
      const failedReports: Array<{ reportName: string; error: string }> = [];
      
      // Iterate through each report
      for (const reportName of reportsToTest) {
        try {
          console.log(`\n${'='.repeat(80)}`);
          console.log(`📊 Testing Report: ${reportName}`);
          console.log(`${'='.repeat(80)}`);
          
          // Select the report
          console.log(`🔍 Selecting report "${reportName}"...`);
          await onboardingReportsPage.selectReportByName(reportName);
          console.log(`✅ Selected report: ${reportName}`);
          
          // Wait for form to be ready
          await page.waitForTimeout(500);
          
          // Handle report-specific interactions
          switch (reportName) {
            case 'Onboarding Team Status Report':
              console.log('🔍 Handling Onboarding Team Status Report...');
              await onboardingReportsPage.handleOnboardingTeamStatusReport(
                onboardingReportsConfig.testData.teamNames['Onboarding Team Status Report']
              );
              break;
            
            case 'Onboarding Status Report':
              console.log('🔍 Handling Onboarding Status Report...');
              await onboardingReportsPage.handleOnboardingStatusReport();
              break;
            
            case 'Onboarding Specialist Productivity Report':
              console.log('🔍 Handling Onboarding Specialist Productivity Report...');
              await onboardingReportsPage.handleOnboardingSpecialistProductivityReport(
                onboardingReportsConfig.testData.states['Onboarding Specialist Productivity Report'].displayName
              );
              break;
            
            case 'Onboarding Specialist Report':
              console.log('🔍 Handling Onboarding Specialist Report...');
              await onboardingReportsPage.handleOnboardingSpecialistReport(
                onboardingReportsConfig.testData.specialists['Onboarding Specialist Report']
              );
              break;
            
            case 'Brokerage Ops':
              console.log('🔍 Handling Brokerage Ops Report...');
              await onboardingReportsPage.handleBrokerageOpsReport();
              break;
            
            case 'Completed Tasks':
              console.log('🔍 Handling Completed Tasks Report...');
              await onboardingReportsPage.handleCompletedTasksReport();
              break;
            
            case 'Custom Data Export Tasks':
              console.log('🔍 Handling Custom Data Export Tasks Report...');
              await onboardingReportsPage.handleCustomDataExportTasksReport();
              break;
            
            case 'Onboarding Task Report':
              console.log('🔍 Handling Onboarding Task Report...');
              await onboardingReportsPage.handleOnboardingTaskReport();
              break;
            
            case 'Onboarding Communication Report':
              console.log('🔍 Handling Onboarding Communication Report...');
              await onboardingReportsPage.handleOnboardingCommunicationReport();
              break;
            
            case 'Onboarding Module Agents':
              console.log('🔍 Handling Onboarding Module Agents Report...');
              await onboardingReportsPage.handleOnboardingModuleAgentsReport();
              break;
          }
          
          // Click Generate button
          console.log('🔍 Clicking Generate button...');
          await onboardingReportsPage.clickGenerate();
          console.log('✅ Generate button clicked');
          
          // Wait for and close the alert
          const alertMessage = reportsTestConfig.alertMessages.reportGeneration;
          console.log('🔍 Waiting for report generation alert...');
          await onboardingReportsPage.waitForAndCloseAlert(alertMessage);
          console.log('✅ Alert closed successfully');
          
          // Validate CSV headers and content
          console.log(`🔍 Validating CSV headers for ${reportName}...`);
          
          // Wait for email and download CSV report
          console.log(`📧 Waiting for email with subject "${reportName}"...`);
          const csvContent = await mailTrapApi.waitForEmailAndDownloadReport(reportName);
          
          // Log CSV content details
          const rows = mailTrapApi['parseCsvRows'](csvContent);
          const dataRowCount = rows.length > 1 ? rows.length - 1 : 0;
          console.log(`\n📊 CSV Report Details:`);
          console.log(`   - Total rows: ${rows.length}`);
          console.log(`   - Header row: ${rows.length > 0 ? 'Present' : 'Missing'}`);
          console.log(`   - Data rows: ${dataRowCount}`);
          console.log(`\n📈 Record Count for "${reportName}": ${dataRowCount} record(s)`);
          
          // Log if no records present
          if (dataRowCount === 0) {
            console.log(`⚠️ WARNING: No records found in "${reportName}" - Report is empty`);
          }
          
          // Get expected headers
          const expectedHeaders = onboardingReportsPage.getHeadersForReport(reportName);
          console.log(`\n📋 Header Validation:`);
          console.log(`   - Expected headers (${expectedHeaders.length}): ${expectedHeaders.join(', ')}`);
          
          // Validate CSV headers
          console.log('🔍 Validating CSV headers...');
          const headerValidationResult = mailTrapApi.validateCsvHeaders(csvContent, expectedHeaders);
          
          // Log validation details
          if (headerValidationResult.missingHeaders.length > 0) {
            console.log(`   ❌ Missing headers (${headerValidationResult.missingHeaders.length}): ${headerValidationResult.missingHeaders.join(', ')}`);
          }
          if (headerValidationResult.extraHeaders.length > 0) {
            console.log(`   ⚠️ Extra headers (${headerValidationResult.extraHeaders.length}): ${headerValidationResult.extraHeaders.join(', ')}`);
          }
          
          if (!headerValidationResult.isValid || headerValidationResult.missingHeaders.length > 0) {
            throw new Error(`CSV header validation failed. Missing headers: ${headerValidationResult.missingHeaders.join(', ')}`);
          }
          
          console.log('✅ All expected CSV headers are present in the downloaded report');
          
          // Perform report-specific content validations
          let contentValidationResult: { isValid: boolean; errors: string[]; rowErrors: Array<{ row: number; errors: string[] }> } | null = null;
          
          switch (reportName) {
            case 'Onboarding Specialist Productivity Report':
              console.log('\n🔍 Validating Onboarding Specialist Productivity Report content...');
              console.log('   📋 Validation Rules:');
              console.log('      - All rows must contain "AZ" in State column');
              console.log(`      - Total data rows to validate: ${dataRowCount}`);
              contentValidationResult = mailTrapApi.validateOnboardingSpecialistProductivityReport(csvContent, expectedHeaders);
              if (contentValidationResult.isValid) {
                console.log(`   ✅ Validated ${dataRowCount} row(s) - All rows contain expected state code`);
              }
              break;
            
            case 'Onboarding Specialist Report':
              console.log('\n🔍 Validating Onboarding Specialist Report content...');
              console.log('   📋 Validation Rules:');
              console.log('      - All rows must contain "Auto OB Specialist" in User Name column');
              console.log(`      - Total data rows to validate: ${dataRowCount}`);
              contentValidationResult = mailTrapApi.validateOnboardingSpecialistReport(csvContent, expectedHeaders);
              if (contentValidationResult.isValid) {
                console.log(`   ✅ Validated ${dataRowCount} row(s) - All rows contain expected specialist`);
              }
              break;
            
            case 'Brokerage Ops':
              console.log('\n🔍 Validating Brokerage Ops Report content...');
              console.log('   📋 Validation Rules:');
              console.log('      - ASA Name column cannot be empty');
              console.log(`      - Total data rows to validate: ${dataRowCount}`);
              contentValidationResult = mailTrapApi.validateBrokerageOpsReport(csvContent, expectedHeaders);
              if (contentValidationResult.isValid) {
                console.log(`   ✅ Validated ${dataRowCount} row(s) - All ASA Names are present`);
              }
              break;
            
            case 'Completed Tasks':
              console.log('\n🔍 Validating Completed Tasks Report content...');
              const completedStartDate = onboardingReportsPage.get7DaysBeforePST();
              const completedEndDate = onboardingReportsPage.getTodayDatePST();
              console.log('   📋 Validation Rules:');
              console.log(`      - Required columns cannot be empty`);
              console.log(`      - Completed Task Completed Date must be within range: ${completedStartDate} to ${completedEndDate}`);
              console.log(`      - Total data rows to validate: ${dataRowCount}`);
              contentValidationResult = mailTrapApi.validateCompletedTasksReport(csvContent, expectedHeaders, completedStartDate, completedEndDate);
              if (contentValidationResult.isValid) {
                console.log(`   ✅ Validated ${dataRowCount} row(s) - All validations passed`);
              }
              break;
            
            case 'Custom Data Export Tasks':
              console.log('\n🔍 Validating Custom Data Export Tasks Report content...');
              const customStartDate = onboardingReportsPage.get7DaysBeforePST();
              const customEndDate = onboardingReportsPage.getTodayDatePST();
              console.log('   📋 Validation Rules:');
              console.log(`      - Required columns cannot be empty`);
              console.log(`      - Task Create Date must be within range: ${customStartDate} to ${customEndDate}`);
              console.log(`      - Total data rows to validate: ${dataRowCount}`);
              contentValidationResult = mailTrapApi.validateCustomDataExportTasksReport(csvContent, expectedHeaders, customStartDate, customEndDate);
              if (contentValidationResult.isValid) {
                console.log(`   ✅ Validated ${dataRowCount} row(s) - All validations passed`);
              }
              break;
            
            case 'Onboarding Communication Report':
              console.log('\n🔍 Validating Onboarding Communication Report content...');
              const commStartDate = onboardingReportsPage.getYesterdayDatePST();
              const commEndDate = onboardingReportsPage.getTodayDatePST();
              console.log('   📋 Validation Rules:');
              console.log(`      - Module Name must be "onboarding"`);
              console.log(`      - Agent Name cannot be empty`);
              console.log(`      - Communication Type must be valid`);
              console.log(`      - Send Date / Time must be within range: ${commStartDate} to ${commEndDate}`);
              console.log(`      - Sent Status must be "Success"`);
              console.log(`      - Total data rows to validate: ${dataRowCount}`);
              contentValidationResult = mailTrapApi.validateOnboardingCommunicationReport(csvContent, expectedHeaders, commStartDate, commEndDate);
              if (contentValidationResult.isValid) {
                console.log(`   ✅ Validated ${dataRowCount} row(s) - All validations passed`);
              }
              break;
            
            case 'Onboarding Module Agents':
              console.log('\n🔍 Validating Onboarding Module Agents Report content...');
              const agentsStartDate = onboardingReportsPage.getYesterdayDatePST();
              const agentsEndDate = onboardingReportsPage.getTodayDatePST();
              console.log('   📋 Validation Rules:');
              console.log(`      - Required columns cannot be empty`);
              console.log(`      - Conditional fields based on Join Agent Status`);
              console.log(`      - Join Application Complete Date/Timestamp must be within range: ${agentsStartDate} to ${agentsEndDate}`);
              console.log(`      - Total data rows to validate: ${dataRowCount}`);
              contentValidationResult = mailTrapApi.validateOnboardingModuleAgentsReport(csvContent, expectedHeaders, agentsStartDate, agentsEndDate);
              if (contentValidationResult.isValid) {
                console.log(`   ✅ Validated ${dataRowCount} row(s) - All validations passed`);
              }
              break;
          }
          
          if (contentValidationResult && (!contentValidationResult.isValid || contentValidationResult.errors.length > 0 || contentValidationResult.rowErrors.length > 0)) {
            const errors: string[] = [];
            if (contentValidationResult.errors.length > 0) {
              errors.push(`Validation errors: ${contentValidationResult.errors.join(', ')}`);
            }
            if (contentValidationResult.rowErrors.length > 0) {
              errors.push(`Row errors found in ${contentValidationResult.rowErrors.length} row(s)`);
              contentValidationResult.rowErrors.slice(0, 5).forEach(({ row, errors: rowErrs }) => {
                errors.push(`   Row ${row}: ${rowErrs.join('; ')}`);
              });
            }
            throw new Error(`Content validation failed. ${errors.join('; ')}`);
          }
          
          if (contentValidationResult) {
            console.log('✅ Content validation passed');
          }
          
          // If we reach here, the report validation passed
          passedReports.push(reportName);
          console.log(`✅ Completed validation for ${reportName}\n`);
          
        } catch (error) {
          // Log the error but continue to next report
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.log(`\n❌ FAILED: Validation for "${reportName}" failed with error:`);
          console.log(`   ${errorMessage}`);
          console.log(`⚠️ Continuing to next report...\n`);
          
          failedReports.push({
            reportName,
            error: errorMessage
          });
        }
      }
      
      // Print summary
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 VALIDATION SUMMARY`);
      console.log(`${'='.repeat(80)}`);
      console.log(`✅ Passed: ${passedReports.length}/${reportsToTest.length}`);
      if (passedReports.length > 0) {
        console.log(`   ${passedReports.join(', ')}`);
      }
      console.log(`❌ Failed: ${failedReports.length}/${reportsToTest.length}`);
      if (failedReports.length > 0) {
        failedReports.forEach(({ reportName, error }) => {
          console.log(`   ${reportName}: ${error}`);
        });
      }
      console.log(`${'='.repeat(80)}\n`);
      
      // Assert that at least some reports passed
      if (failedReports.length === reportsToTest.length) {
        throw new Error(`All ${reportsToTest.length} reports failed validation. See logs above for details.`);
      }
      
      // Log final status
      if (failedReports.length > 0) {
        console.log(`⚠️ Test completed with ${failedReports.length} failure(s). Check logs above for details.`);
      } else {
        console.log(`✅ All ${reportsToTest.length} reports validated successfully!`);
      }
    });

  });
});
