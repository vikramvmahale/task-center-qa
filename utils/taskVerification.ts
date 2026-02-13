import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

const TASK_GRID_ID = '#task-list-grid-1685849';
const ROLE_LABEL = 'Agent Programs Analyst';

/** Normalize date string to MM/DD/YYYY (leading zeros) for comparison. Handles "1/30/2026" and "01/18/2026 ". */
function normalizeDateString(dateStr: string): string {
  const s = dateStr.trim();
  if (!s) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${mm}/${dd}/${yyyy}`;
}

/**
 * Verifies a task card in the Agent Support task list (Overdue / Upcoming / Completed).
 * Search is global within #task-list-grid-1685849 so the task can be in any column.
 *
 * @param page - Playwright page (Task Center agent details page with task list)
 * @param taskName - Task name (e.g. "Mentee Detail Review", "Check Pairing Request/Attempts", "Send Pairing Request")
 * @param requestNumber - Request number (e.g. 1, 2, or "Teams")
 * @param expectedDueDate - Due date in MM/DD/YYYY format (use PST-converted updatedDate for comparisons)
 */
export async function verifyTask(
  page: Page,
  taskName: string,
  requestNumber: string | number,
  expectedDueDate: string
): Promise<void> {
  const grid = page.locator(TASK_GRID_ID);
  const cardTitle = `${taskName} - ${requestNumber}`;
  const card = grid.locator('.task-card').filter({ hasText: cardTitle }).first();

  await expect(card).toBeVisible({ timeout: 15000 });

  // Role: "Agent Programs Analyst" within .task-detail-badge-component--role
  const roleContainer = card.locator('.task-detail-badge-component--role');
  await expect(roleContainer).toContainText(ROLE_LABEL, { ignoreCase: true });

  // Due date: time element shows due date (MM/DD/YYYY); compare normalized dates so "1/30/2026" matches "01/30/2026"
  const timeEl = card.locator('time').first();
  await expect(timeEl).toBeVisible({ timeout: 5000 });
  const displayedDate = (await timeEl.textContent())?.trim() ?? '';
  const normalizedExpected = normalizeDateString(expectedDueDate);
  const normalizedDisplayed = normalizeDateString(displayedDate);
  expect(normalizedDisplayed, `Task due date should be ${normalizedExpected} (PST updatedDate)`).toBe(normalizedExpected);

  // Trigger: Manual / Reassigned – check data attributes or badges inside the card
  await verifyTaskTriggerManualReassigned(card);
}

/**
 * Checks if the task card reflects Manual status / Reassigned (AgentPairingStatus = Manual, Status = Reassigned).
 * Looks for data attributes (e.g. data-agent-pairing-status, data-status) or badge/text "Manual", "Reassigned".
 */
async function verifyTaskTriggerManualReassigned(card: ReturnType<Page['locator']>): Promise<void> {
  const cardEl = card.first();
  const hasManualOrReassigned = await cardEl.evaluate((el) => {
    const html = el.outerHTML + ' ' + (el.getAttribute('data-agent-pairing-status') ?? '') + ' ' + (el.getAttribute('data-status') ?? '') + ' ' + (el.getAttribute('data-pairing-status') ?? '');
    const lower = html.toLowerCase();
    return lower.includes('manual') || lower.includes('reassigned');
  }).catch(() => false);

  expect.soft(hasManualOrReassigned, `Task card should reflect Manual/Reassigned trigger (data attributes or badge/text)`).toBe(true);
}
