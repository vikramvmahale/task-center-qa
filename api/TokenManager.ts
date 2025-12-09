/**
 * Token Manager for Mira Agent Platform API
 * Handles fetching and managing Bearer tokens from OAuth endpoint
 */

import { APIRequestContext } from '@playwright/test';
import { getEnvironmentConfig } from '../utils/config/environment-config';

interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
}

export class TokenManager {
    private tokenUrl: string;
    private clientId: string;
    private clientSecret: string;
    private currentToken: string | null = null;
    private tokenExpiry: number | null = null;
    private request: APIRequestContext;

    constructor(request: APIRequestContext) {
        const env = getEnvironmentConfig();
        this.tokenUrl = env.tokenUrl;
        this.clientId = env.clientId;
        this.clientSecret = env.clientSecret;
        this.request = request;
    }

    /**
     * Fetch a new Bearer token from the OAuth endpoint
     * @returns The access token (without "Bearer " prefix)
     */
    async fetchToken(): Promise<string> {
        const params = new URLSearchParams();
        params.append('client_id', this.clientId);
        params.append('client_secret', this.clientSecret);
        params.append('grant_type', 'client_credentials');

        console.log('🔑 Fetching Bearer token from OAuth endpoint...');

        try {
            const response = await this.request.post(this.tokenUrl, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: params.toString()
            });

            if (!response.ok()) {
                throw new Error(`Token request failed: ${response.status()} ${response.statusText()}`);
            }

            const tokenData: TokenResponse = await response.json();

            if (!tokenData.access_token) {
                throw new Error('No access_token in token response');
            }

            // Store token and calculate expiry time
            this.currentToken = tokenData.access_token;
            // Set expiry to 5 minutes before actual expiry for safety
            const expiryBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
            this.tokenExpiry = Date.now() + (tokenData.expires_in * 1000) - expiryBuffer;

            console.log('✅ Bearer token fetched successfully');
            return this.currentToken;
        } catch (error: any) {
            console.log('❌ Token fetch error:', error.message);
            throw new Error(`Failed to fetch Bearer token: ${error.message}`);
        }
    }

    /**
     * Get a valid Bearer token, fetching a new one if needed
     * @param forceRefresh - Force a new token fetch even if current token is valid
     * @returns The access token (without "Bearer " prefix)
     */
    async getValidToken(forceRefresh: boolean = false): Promise<string> {
        // Check if we have a valid token
        if (!forceRefresh && this.currentToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.currentToken;
        }

        // Fetch a new token
        return await this.fetchToken();
    }

    /**
     * Check if the current token is valid (not expired)
     * @returns True if token exists and is not expired
     */
    isTokenValid(): boolean {
        if (!this.currentToken || !this.tokenExpiry) {
            return false;
        }
        return Date.now() < this.tokenExpiry;
    }

    /**
     * Clear the current token (force refresh on next request)
     */
    clearToken(): void {
        this.currentToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Get the current token (may be expired)
     * @returns The current token or null
     */
    getCurrentToken(): string | null {
        return this.currentToken;
    }
}

