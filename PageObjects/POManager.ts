import { ChatPagePO } from './ChatPagePO';
import { AuthPagePO } from './AuthPagePO';
import { Page } from '@playwright/test';

export class POManager {
    private page: Page;
    private chatPage: ChatPagePO;
    private authPage?: AuthPagePO;

    constructor(page: Page) {
        this.page = page;
        this.chatPage = new ChatPagePO(this.page);
    }

    /**
     * Get the Chat Page Page Object instance
     * @returns Chat Page Page Object instance
     */
    getChatPage(): ChatPagePO {
        return this.chatPage;
    }

    /**
     * Get or create the Auth Page Page Object instance
     * @param authUrl - Mira auth entry URL (e.g. https://.../auth.html)
     * @returns Auth Page Page Object instance
     */
    getAuthPage(authUrl: string): AuthPagePO {
        if (!this.authPage) {
            this.authPage = new AuthPagePO(this.page, authUrl);
        }
        return this.authPage;
    }
}

