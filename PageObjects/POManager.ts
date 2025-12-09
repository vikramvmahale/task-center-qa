import { ChatPagePO } from './ChatPagePO';
import { AuthPagePO } from './AuthPagePO';
import { TaskCenterLoginPagePO } from './TaskCenterLoginPagePO';
import { TaskCenterHomePagePO } from './TaskCenterHomePagePO';
import { Page } from '@playwright/test';

export class POManager {
    private page: Page;
    private chatPage: ChatPagePO;
    private taskCenterLoginPage: TaskCenterLoginPagePO;
    private taskCenterHomePage: TaskCenterHomePagePO;
    private authPage?: AuthPagePO;

    constructor(page: Page) {
        this.page = page;
        this.chatPage = new ChatPagePO(this.page);
        this.taskCenterLoginPage = new TaskCenterLoginPagePO(this.page);
        this.taskCenterHomePage = new TaskCenterHomePagePO(this.page);
    }

    /**
     * Get the Chat Page Page Object instance
     * @returns Chat Page Page Object instance
     */
    getChatPage(): ChatPagePO {
        return this.chatPage;
    }

    /**
     * Get the Task Center Login Page Page Object instance
     * @returns Task Center Login Page Page Object instance
     */
    getTaskCenterLoginPage(): TaskCenterLoginPagePO {
        return this.taskCenterLoginPage;
    }

    /**
     * Get the Task Center Home Page Page Object instance
     * @returns Task Center Home Page Page Object instance
     */
    getTaskCenterHomePage(): TaskCenterHomePagePO {
        return this.taskCenterHomePage;
    }

    /**
     * Get or create the Auth Page Page Object instance
     * @param authUrl - Task Center auth entry URL (e.g. https://.../auth.html)
     * @returns Auth Page Page Object instance
     */
    getAuthPage(authUrl: string): AuthPagePO {
        if (!this.authPage) {
            this.authPage = new AuthPagePO(this.page, authUrl);
        }
        return this.authPage;
    }
}

