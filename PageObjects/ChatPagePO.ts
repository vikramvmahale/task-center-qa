import { expect, Locator, Page } from '@playwright/test';

/**
 * Chat Page Page Object for the Mira Agent Platform.
 *
 * This models the main chat experience at `/chat`, including:
 * - Header / sidebar elements
 * - Greeting content
 * - Chat input
 * - Recent chats list
 * - Authenticated user display
 */
export class ChatPagePO {
  readonly page: Page;

  // Layout / containers
  readonly appMainContainer: Locator;
  readonly layoutMainContent: Locator;
  readonly chatPage: Locator;
  readonly chatContainer: Locator;

  // Header / sidebar
  readonly sidebarLogo: Locator;
  readonly newChatLink: Locator;
  readonly recentChatContainer: Locator;
  readonly recentChatButtons: Locator;
  readonly languageSelector: Locator;
  readonly darkModeToggle: Locator;

  // Greeting
  readonly chatGreetingContainer: Locator;
  readonly greetingTitle: Locator;
  readonly greetingSubtitle: Locator;

  // Chat input & controls
  readonly chatInputContainer: Locator;
  readonly chatInputWrapper: Locator;
  readonly chatInput: Locator;
  readonly pulseButton: Locator;
  readonly micButton: Locator;
  readonly voiceButton: Locator;
  readonly chatDisclaimer: Locator;

  // Authenticated user
  readonly authUserContainer: Locator;
  readonly authUserButton: Locator;
  readonly authUserNameText: Locator;

  constructor(page: Page) {
    this.page = page;

    // Layout / containers
    this.appMainContainer = page.getByTestId('app-main-container');
    this.layoutMainContent = page.getByTestId('layout-main-content');
    this.chatPage = page.getByTestId('chat-page');
    this.chatContainer = page.getByTestId('chat-container');

    // Header / sidebar
    this.sidebarLogo = page.getByTestId('sidebar-logo').first();
    this.newChatLink = page.getByRole('link', { name: 'New Chat' });
    this.recentChatContainer = page.getByTestId('recent-chat-container');
    this.recentChatButtons = page.locator('[data-testid^="recent-chat-button-"]');
    this.languageSelector = page.getByTestId('language-dropdown');
    this.darkModeToggle = page.getByTestId('sidebar-dark-mode-toggle');

    // Greeting
    this.chatGreetingContainer = page.getByTestId('chat-greeting');
    this.greetingTitle = this.chatGreetingContainer.locator('span');
    this.greetingSubtitle = this.chatGreetingContainer.locator('h6');

    // Chat input & controls
    this.chatInputContainer = page.getByTestId('chat-input-container');
    this.chatInputWrapper = page.getByTestId('chat-input-wrapper');
    this.chatInput = this.chatInputWrapper.getByPlaceholder('Ask anything...');
    this.pulseButton = page.getByTestId('pulse-button');
    this.micButton = page.getByTestId('mic-button');
    this.voiceButton = page.getByTestId('voice-button');
    this.chatDisclaimer = page.getByTestId('chat-disclaimer');

    // Authenticated user
    this.authUserContainer = page.getByTestId('auth-user-container');
    this.authUserButton = page.getByTestId('auth-user-button');
    // There are two <p> elements under auth-user-button (main header + menu).
    // Use the first one (visible in the header) to avoid strict mode violations.
    this.authUserNameText = this.authUserButton.locator('p').first();
  }

  // ----- Assertions -----

  /**
   * Verify that the chat page is loaded correctly.
   */
  async expectOnPage(): Promise<void> {
    await expect(this.appMainContainer).toBeVisible();
    await expect(this.layoutMainContent).toBeVisible();
    await expect(this.chatPage).toBeVisible();
    await expect(this.chatContainer).toBeVisible();
    await expect(this.chatGreetingContainer).toBeVisible();
    await expect(this.chatInput).toBeVisible();
    await expect(this.chatDisclaimer).toBeVisible();
  }

  /**
   * Verify that the greeting contains the given user name.
   * Example: "Hello, Dylan!"
   */
  async expectGreetingForUser(userName: string): Promise<void> {
    await expect(this.greetingTitle).toContainText(`Hello, ${userName}`);
  }

  /**
   * Verify that the authenticated user display shows the given name.
   */
  async expectLoggedInUser(userName: string): Promise<void> {
    await expect(this.authUserNameText).toContainText(userName);
  }

  // ----- Getters -----

  /**
   * Get the logged in user's display name from the header.
   */
  async getLoggedInUserName(): Promise<string> {
    const text = await this.authUserNameText.textContent();
    return (text || '').trim();
  }

  /**
   * Get the list of visible recent chat titles.
   */
  async getRecentChatTitles(): Promise<string[]> {
    const titles: string[] = [];
    const count = await this.recentChatButtons.count();

    for (let i = 0; i < count; i++) {
      const button = this.recentChatButtons.nth(i);
      const text = await button.textContent();
      if (text) {
        titles.push(text.trim());
      }
    }

    return titles;
  }

  // ----- Actions -----

  /**
   * Click the "New Chat" link in the sidebar.
   */
  async clickNewChat(): Promise<void> {
    await this.newChatLink.click();
  }

  /**
   * Click a recent chat by its visible title.
   */
  async clickRecentChatByTitle(title: string): Promise<void> {
    const button = this.recentChatButtons.filter({ hasText: title }).first();
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Send a chat message using the text input and pressing Enter.
   */
  async sendMessage(message: string): Promise<void> {
    await this.chatInput.click();
    await this.chatInput.fill(message);
    await this.chatInput.press('Enter');
  }

  /**
   * Click the mic button (voice input).
   */
  async clickMic(): Promise<void> {
    await this.micButton.click();
  }

  /**
   * Click the voice mode button.
   */
  async clickVoiceMode(): Promise<void> {
    await this.voiceButton.click();
  }
}


