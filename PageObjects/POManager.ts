import { AuthPagePO } from './AuthPagePO';
import { TaskCenterLoginPagePO } from './TaskCenterLoginPagePO';
import { TaskCenterHomePagePO } from './TaskCenterHomePagePO';
import { AccountSolutionsReportsPagePO } from './AccountSolutionsReportsPagePO';
import { OnboardingReportsPagePO } from './OnboardingReportsPagePO';
import { Page } from '@playwright/test';

export class POManager {
    private page: Page;
    private taskCenterLoginPage: TaskCenterLoginPagePO;
    private taskCenterHomePage: TaskCenterHomePagePO;
    private accountSolutionsReportsPage: AccountSolutionsReportsPagePO;
    private onboardingReportsPage: OnboardingReportsPagePO;
    private authPage?: AuthPagePO;

    constructor(page: Page) {
        this.page = page;
        this.taskCenterLoginPage = new TaskCenterLoginPagePO(this.page);
        this.taskCenterHomePage = new TaskCenterHomePagePO(this.page);
        this.accountSolutionsReportsPage = new AccountSolutionsReportsPagePO(this.page);
        this.onboardingReportsPage = new OnboardingReportsPagePO(this.page);
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
     * Get the Account Solutions Reports Page Page Object instance
     * @returns Account Solutions Reports Page Page Object instance
     */
    getReportsPage(): AccountSolutionsReportsPagePO {
        return this.accountSolutionsReportsPage;
    }

    /**
     * Get the Onboarding Reports Page Page Object instance
     * @returns Onboarding Reports Page Page Object instance
     */
    getOnboardingReportsPage(): OnboardingReportsPagePO {
        return this.onboardingReportsPage;
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

