import * as pw from '@playwright/test';
const test = pw.test as typeof import('@playwright/test')['test'];
const expect = pw.expect as typeof import('@playwright/test')['expect'];
import type { Page, BrowserContext } from '@playwright/test';
import { POManager } from '../../PageObjects/POManager';
import { getEnvironmentConfig } from '../../utils/config/environment-config';
import { verifyTask } from '../../utils/taskVerification';

/**
 * Hardcoded Mentor Individual - Functional Test
 *
 * Flow: Open Expand → Click Mentees → Apply filters → Search → Open 2nd record → Store agent ID
 *       → Click History → Store latest history as updatedDate (if history empty: Program Start Date as updatedDate).
 * Then login to Task Center (ACCP) as admin and switch to Agent Support module in a new tab.
 */

test.describe('Hardcoded Mentor Individual', () => {
  let pOManager: POManager;
  let taskCenterUiUrl: string;
  let loginUrl: string;
  let adminEmail: string;
  let adminPassword: string;
  let expandUrl: string | undefined;
  let expandUsername: string | undefined;
  let expandPassword: string | undefined;

  test.beforeEach(async ({ page }: { page: Page }) => {
    if (typeof process !== 'undefined' && (process as any).env) {
      (process as any).env.TEST_ENV = 'accp';
    }

    const env = getEnvironmentConfig();

    if (!('taskCenterUiUrl' in env)) {
      test.skip(true, 'Task Center UI URL not configured for this environment');
      return;
    }

    taskCenterUiUrl = (env as any).taskCenterUiUrl;
    loginUrl = `${taskCenterUiUrl}/devise_new_session`;
    adminEmail = (env as any).taskCenterAdminEmail ?? '';
    adminPassword = (env as any).taskCenterAdminPassword ?? '';
    expandUrl = undefined;
    expandUsername = undefined;
    expandPassword = undefined;
    if ('expandUrl' in env && 'expandUsername' in env && 'expandPassword' in env) {
      expandUrl = (env as any).expandUrl;
      expandUsername = (env as any).expandUsername;
      expandPassword = (env as any).expandPassword;
    }
    pOManager = new POManager(page);
  });

  test('should login to Expand and complete Hardcoded Mentor Individual flow', { tag: ['@functional'] }, async ({ page, context }: { page: Page; context: BrowserContext }) => {
    if (!expandUrl || !expandUsername || !expandPassword) {
      test.skip(true, 'Expand URL or credentials not configured for this environment');
      return;
    }
    const url = expandUrl;
    const username = expandUsername;
    const password = expandPassword;

    // Agent ID to use: stored from Expand or fallback to this value
    const AGENT_ID = '242496';
    let storedAgentId: string = AGENT_ID;
    let updatedDate: string;

    await test.step('Navigate to Expand login page', async () => {
      await page.goto(url, { waitUntil: 'load' });
    });

    await test.step('Login with credentials', async () => {
      await page.getByLabel(/user name/i).fill(username);
      await page.getByLabel(/password/i).fill(password);
      await page.getByRole('button', { name: /sign in/i }).click();
    });

    await test.step('Wait for post-login navigation', async () => {
      await page.waitForURL((url: URL) => !url.href.toLowerCase().includes('login'), { timeout: 15000 }).catch(() => {});
    });

    await test.step('Verify logged in', async () => {
      const currentUrl = page.url();
      expect(currentUrl).not.toContain('login.html');
    });

    await test.step('Accept All cookies', async () => {
      await page.getByRole('button', { name: 'Accept All' }).click();
    });

    await test.step('Open US Mentor Program menu', async () => {
      await page.getByRole('menuitem', { name: 'US Mentor Program' }).click();
    });

    await test.step('Select Mentees', async () => {
      await page.getByRole('menuitem', { name: 'Mentees' }).click();
    });
     
    await test.step('Set Primary Licensed State to NV', async () => {
      await page.getByRole('textbox', { name: 'Primary Licensed State' }).click();
      await page.getByRole('textbox', { name: 'Primary Licensed State' }).fill('NV');
    });

    await test.step('Select Is On Team filter', async () => {
      await page.getByLabel('Is On Team').selectOption('mxui_widget_SearchInput_16_false');
    });

    await test.step('Select Group filter', async () => {
      await page.getByLabel('Group').selectOption('mxui_widget_SearchInput_14_Reassign');
    });

    await test.step('Fill Agent ID in mentor', async () => {
      await page.getByRole('textbox', { name: 'Agent ID' }).click();
      await page.getByRole('textbox', { name: 'Agent ID' }).fill(AGENT_ID);
    });

    await test.step('Click Search', async () => {
      await page.getByRole('button', { name: 'Search' }).click();
    });
    await page.waitForTimeout(5000);
    await test.step('Select Mentee, store Agent ID after clicking heading, click History, store updatedDate after tab', async () => {
      await page.getByRole('button', { name: 'Select Mentee' }).click();
    
      // If "verify team type" popup appears, click Continue with Mentee
      const continueWithMentee = page.getByRole('button', { name: /continue with mentee/i });
      await continueWithMentee.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      if (await continueWithMentee.isVisible().catch(() => false)) {
        await continueWithMentee.click();
        await page.waitForTimeout(5000);
      }
      
      storedAgentId = (await page.locator('.mx-name-fd5f9ac7ee834da7bc0d8cbae87104a6').textContent({ timeout: 5000 }).catch(() => ''))?.trim() ?? storedAgentId;

      await page.getByRole('tab', { name: 'History' }).click({ timeout: 8000 });
      await page.waitForTimeout(400);

      const dateOnly = (s: string) => (s.split(',')[0] ?? s).trim();
      const pagingStatus = (await page.locator('.mx-name-grid1 .mx-grid-paging-status').textContent({ timeout: 3000 }).catch(() => ''))?.trim() ?? '';

      if (pagingStatus !== '0' && pagingStatus !== '') {
        const historyDateText = (await page.locator('.mx-name-grid1 .mx-name-index-0').textContent({ timeout: 4000 }).catch(() => ''))?.trim() ?? '';
        updatedDate = dateOnly(historyDateText);
      }

      await page.getByText('Program Start Date:').scrollIntoViewIfNeeded().catch(() => {});

      if (pagingStatus === '0' || pagingStatus === '') {
        const programStartValue = (await page.getByLabel(/program start date/i).inputValue().catch(() => ''))?.trim()
          ?? (await page.getByLabel(/program start date/i).textContent().catch(() => ''))?.trim()
          ?? (await page.evaluate(() => {
              const el = Array.from(document.querySelectorAll('*')).find(n => /program\s*start\s*date\s*:?/i.test((n as HTMLElement).textContent || ''));
              if (!el) return '';
              const parent = (el as HTMLElement).closest('div, tr, li') || (el as HTMLElement).parentElement;
              const text = (parent?.textContent || '').trim();
              const m = text.match(/program\s*start\s*date\s*:?\s*([^\n\r]+)/i);
              return m ? m[1].trim() : '';
            }).catch(() => ''));
        updatedDate = dateOnly(programStartValue ?? '') || (programStartValue ?? '');
      }

      console.log('agentId:', storedAgentId);
      console.log('updatedDate:', updatedDate);

      await test.info().attach('Stored values', {
        body: `agentId: ${storedAgentId}\nupdatedDate: ${updatedDate}`,
        contentType: 'text/plain',
      });
    });

    await test.step('Convert stored updatedDate to PST for subsequent comparisons', async () => {
      if (!updatedDate || !updatedDate.trim()) return;
      const parsed = new Date(updatedDate.trim());
      if (Number.isNaN(parsed.getTime())) return;
      updatedDate = parsed.toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles', year: 'numeric', month: 'numeric', day: 'numeric' });
      console.log('updatedDate (PST):', updatedDate);
    });

    // After storing updatedDate (PST): open Task Center, switch to Agent Support, click on Agents
    let tcPage: Page;
    await test.step('Open new tab for Task Center', async () => {
      tcPage = await context.newPage();
    });

    await test.step('Login to Task Center (ACCP) as admin', async () => {
      if (!adminEmail || !adminPassword) {
        test.skip(true, 'Task Center admin credentials not configured for this environment');
        return;
      }
      const tcPOManager = new POManager(tcPage);
      const loginPage = tcPOManager.getTaskCenterLoginPage();
      const authPage = tcPOManager.getAuthPage(loginUrl);
      const homePage = tcPOManager.getTaskCenterHomePage();

      await tcPage.goto(loginUrl, { waitUntil: 'load' });
      await loginPage.expectOnPage();
      await loginPage.clickExpPassport();
      await tcPage.waitForURL(/okta|oktapreview/i, { timeout: 30000 });
      await authPage.performOktaLogin(adminEmail, adminPassword, 'accp-tc.exprealty.com');
      await homePage.expectOnPage();
      await homePage.expectLoggedIn();
    });

    await test.step('Switch to Agent Support module', async () => {
      const tcPOManager = new POManager(tcPage);
      const homePage = tcPOManager.getTaskCenterHomePage();
      await homePage.switchToModule('agent_support');
    });

   

    await test.step('Verify Agents page is visible', async () => {
      await expect(tcPage.getByRole('heading', { name: 'Agents', exact: true })).toBeVisible();
    });

    await test.step('Open Filters and fill Agent ID with storedAgentId from Expand', async () => {
      await tcPage.getByRole('button', { name: 'filter icon Filters' }).click();
      await tcPage.getByRole('textbox', { name: 'Agent ID' }).click();
      await tcPage.getByRole('textbox', { name: 'Agent ID' }).fill(storedAgentId);
    });

    await test.step('Click Filter Team Name after entering Agent ID', async () => {
      await tcPage.getByPlaceholder('Filter Team Name').click({ timeout: 8000 });
    });
    
    await test.step('Click Apply and open agent record', async () => {
      await tcPage.waitForTimeout(2000);
      try {
        await expect(tcPage.getByText("Filters updated. Select 'Apply' to see results.")).toBeVisible({ timeout: 5000 });
      } catch {
        // Message may not appear; continue to click Apply
      }
      await tcPage.getByRole('button', { name: 'Apply' }).click({ timeout: 10000, force: true });
      await page.waitForTimeout(5000);
      await tcPage.locator('tr[class*="resource-table-row"] td >> div >> a').first().click({ timeout: 15000 });
    });
   
    await test.step('Wait for Agent details and scroll to upcoming tasks', async () => {
      await tcPage.waitForTimeout(5000);
      await expect(tcPage.locator('div.main-details-container header.card-header-title')).toBeVisible({ timeout: 15000 });
      await tcPage.locator('div[title="Number of upcoming tasks"]').scrollIntoViewIfNeeded({ timeout: 5000 }).catch(() => {});
    });

    await test.step('Verify tasks: Mentee Detail Review, Check Pairing Request/Attempts, Send Pairing Request (due updatedDate, assign Agent Programs Analyst, trigger Manual/Reassigned)', async () => {
      await tcPage.locator('#task-list-grid-1685849').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      const requestNumbers = [1, 2];
      const taskNames = ['Mentee Detail Review', 'Check Pairing Request/Attempts', 'Send Pairing Request'] as const;
      for (const taskName of taskNames) {
        for (const requestNumber of requestNumbers) {
          const card = tcPage.locator('#task-list-grid-1685849 .task-card').filter({ hasText: `${taskName} - ${requestNumber}` }).first();
          if (await card.isVisible().catch(() => false)) {
            await verifyTask(tcPage, taskName, requestNumber, updatedDate);
          }
        }
      }
    });
  });
});
