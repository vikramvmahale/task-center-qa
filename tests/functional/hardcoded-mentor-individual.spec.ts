import { test, expect, Page, BrowserContext } from '@playwright/test';
import { POManager } from '../../PageObjects/POManager';
import { getEnvironmentConfig } from '../../utils/config/environment-config';

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

    let storedAgentId: string;
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

    await test.step('Click Search', async () => {
      await page.getByRole('button', { name: 'Search' }).click();
    });

    await test.step('Select Mentee, store Agent ID after clicking heading, click History, store updatedDate after tab', async () => {
      await page.getByRole('button', { name: 'Select Mentee' }).click();

      // If "verify team type" popup appears, click Continue with Mentee
      const continueWithMentee = page.getByRole('button', { name: /continue with mentee/i });
      await continueWithMentee.waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
      if (await continueWithMentee.isVisible().catch(() => false)) {
        await continueWithMentee.click();
        await page.waitForTimeout(500);
      }

      await page.getByRole('heading', { name: 'Agent ID:' }).click();

      // Store agentID after Agent ID: heading click
      storedAgentId = (await page.getByLabel(/agent id/i).inputValue().catch(() => ''))?.trim()
        ?? (await page.getByLabel(/agent id/i).textContent().catch(() => ''))?.trim()
        ?? (await page.getByRole('heading', { name: 'Agent ID:' }).evaluate((el) => {
            const h = el as HTMLElement;
            const fromHeading = (h.textContent ?? '').replace(/agent id\s*:?\s*/gi, '').trim();
            if (fromHeading) return fromHeading;
            const sibling = h.nextElementSibling?.textContent?.trim() ?? '';
            if (sibling) return sibling;
            return (h.parentElement?.textContent ?? '').replace(/agent id\s*:?\s*/gi, '').trim();
          }).catch(() => ''))
        ?? (await page.getByRole('heading', { name: 'Agent ID:' }).locator('..').locator('..').textContent().catch(() => ''))?.replace(/agent id:?/gi, '').trim()
        ?? '';

      await page.getByRole('tab', { name: 'History' }).click();
      await page.waitForTimeout(500);

      // Store updatedDate after History tab click and wait
      const historyRows = page.locator('table tbody tr');
      const historyRowCount = await historyRows.count();
      const noHistoryMessage = await page.getByText(/no records|no data|empty|no history/i).isVisible().catch(() => false);

      if (noHistoryMessage || historyRowCount === 0) {
        // When history is empty, use Program Start Date as updatedDate
        const programStartLabel = page.getByText(/program start date\s*:?/i);
        updatedDate = (await page.getByLabel(/program start date/i).inputValue().catch(() => ''))?.trim()
          ?? (await page.getByLabel(/program start date/i).textContent().catch(() => ''))?.trim()
          ?? (await programStartLabel.locator('..').textContent().catch(() => ''))?.replace(/program start date\s*:?\s*/gi, '').trim()
          ?? (await programStartLabel.evaluate((el) => (el as HTMLElement).nextElementSibling?.textContent ?? '').catch(() => ''))?.trim()
          ?? '';
      } else {
        // First row = most recent history entry
        const firstHistoryRow = historyRows.first();
        updatedDate = (await firstHistoryRow.locator('td').last().textContent().catch(() => ''))?.trim()
          ?? (await firstHistoryRow.locator('td').nth(1).textContent().catch(() => ''))?.trim()
          ?? '';
      }

      console.log('agentId:', storedAgentId);
      console.log('updatedDate:', updatedDate);

      await test.info().attach('Stored values', {
        body: `agentId: ${storedAgentId}\nupdatedDate: ${updatedDate}`,
        contentType: 'text/plain',
      });
    });

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

    await test.step('Open Filters and fill Agent ID filter with storedAgentId from Expand', async () => {
      await tcPage.getByRole('button', { name: 'filter icon Filters' }).click();
      await expect(tcPage.locator('#agent_id-filter-field-container').getByText('Agent ID')).toBeVisible();
      await tcPage.getByRole('textbox', { name: 'Agent ID' }).click();
      await tcPage.getByRole('textbox', { name: 'Agent ID' }).fill(storedAgentId);
    });
  });
});
