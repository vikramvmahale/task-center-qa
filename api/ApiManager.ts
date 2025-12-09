import { ChatStreamApi } from './endpoints/ChatStreamApi';
import { TokenManager } from './TokenManager';
import { APIRequestContext } from '@playwright/test';

/**
 * API Manager - Centralized access to all Task Center API endpoints
 * Similar to POManager but for API operations
 * 
 * This manager handles Bearer token authentication automatically.
 * Tokens are fetched and refreshed as needed.
 */
export class ApiManager {
    private chatStreamApi: ChatStreamApi;
    // Use a static TokenManager so that all ApiManager instances in the same
    // Playwright worker share a single cached token instead of fetching a new
    // token for every test.
    private static tokenManager: TokenManager | null = null;
    private request: APIRequestContext;

    constructor(request: APIRequestContext) {
        this.request = request;

        // Initialize the shared TokenManager once per worker
        if (!ApiManager.tokenManager) {
            ApiManager.tokenManager = new TokenManager(request);
        }

        this.chatStreamApi = new ChatStreamApi(request);
    }

    /**
     * Ensure a valid Bearer token is set on all API clients
     * This should be called before making API requests
     * @param forceRefresh - Force a new token fetch even if current token is valid
     */
    async ensureAuthenticated(forceRefresh: boolean = false): Promise<void> {
        if (!ApiManager.tokenManager) {
            // Safety fallback; should not happen because we initialize in constructor
            ApiManager.tokenManager = new TokenManager(this.request);
        }

        const token = await ApiManager.tokenManager.getValidToken(forceRefresh);
        
        // Set token on all API clients
        this.chatStreamApi.apiClient.setBearerToken(token);
    }

    /**
     * Get the Chat Stream API instance
     * Note: Call ensureAuthenticated() first to set up Bearer token
     * @returns Chat Stream API instance
     */
    getChatStreamApi(): ChatStreamApi {
        return this.chatStreamApi;
    }

    /**
     * Get the Token Manager instance
     * @returns Token Manager instance
     */
    getTokenManager(): TokenManager {
        if (!ApiManager.tokenManager) {
            ApiManager.tokenManager = new TokenManager(this.request);
        }
        return ApiManager.tokenManager;
    }
}

