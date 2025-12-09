import { test, expect, Page } from '@playwright/test';
import { POManager } from '../../PageObjects/POManager';
import { getEnvironmentConfig } from '../../utils/config/environment-config';

// Get environment configuration
const env = getEnvironmentConfig();
const taskCenterAuthUrl = `${env.testUrl}auth.html`;
const taskCenterChatPath = '/chat';
const expectedFirstName = env.testEmail.split('@')[0].split('.')[0]; // Extract first name from email

test.describe('Chat Page UI Tests', () => {
  test.beforeEach(async ({ page }: { page: Page }) => {
    const pOManager = new POManager(page);
    const authPage = pOManager.getAuthPage(taskCenterAuthUrl);

    // Perform Okta login and wait for redirect back to Task Center chat
    await authPage.login(env.testEmail, env.testPassword, taskCenterChatPath);
  });

  test('should load chat page and show greeting for logged in user', { tag: ['@ui'] }, async ({ page }: { page: Page }) => {
    const pOManager = new POManager(page);
    const chatPage = pOManager.getChatPage();

    await chatPage.expectOnPage();
    await chatPage.expectGreetingForUser(expectedFirstName);
    // Note: If you need a specific expected full name, add it to the environment config
    // await chatPage.expectLoggedInUser(env.testUserName);
  });

  test('should send a chat message from the input', { tag: ['@ui'] }, async ({ page }: { page: Page }) => {
    const pOManager = new POManager(page);
    const chatPage = pOManager.getChatPage();

    await chatPage.expectOnPage();

    const message = 'What is my cap status?';
    await chatPage.sendMessage(message);

    // We can't assert the full AI response reliably here, but we can at least
    // ensure the input is visible after sending.
    await expect(chatPage.chatInput).toBeVisible();
  });
});

