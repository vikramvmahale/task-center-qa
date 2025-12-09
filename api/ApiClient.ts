/**
 * Base API Client for Task Center API
 * Handles authentication, base URL configuration, and common HTTP operations
 */

import { APIRequestContext } from '@playwright/test';
import { getEnvironmentConfig } from '../utils/config/environment-config';

/**
 * API Response structure
 * Note: Task Center API returns raw text data, not JSON
 */
export interface ApiResponse {
    status: number;
    data: string; // Raw text response
    headers: Record<string, string>;
}

/**
 * Request options for API calls
 */
export interface ApiRequestOptions {
    headers?: Record<string, string>;
    [key: string]: any;
}

export class ApiClient {
    baseUrl: string;
    private bearerToken: string | null = null;
    private defaultHeaders: Record<string, string>;
    private request: APIRequestContext;

    constructor(request: APIRequestContext) {
        const env = getEnvironmentConfig();
        this.baseUrl = env.apiBaseUrl;
        this.defaultHeaders = {
            'Content-Type': 'application/json'
        };
        this.request = request;
    }

    /**
     * Make a GET request to the Task Center API
     * @param endpoint - The API endpoint (without base URL)
     * @param options - Additional options for the request
     * @returns The response data (raw text)
     */
    async get(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.buildHeaders(options.headers);

        console.log('📤 Task Center API GET Request:', {
            url: url,
            headers: { 'Authorization': '***masked***' },
            timestamp: new Date().toISOString()
        });

        try {
            const response = await this.request.get(url, {
                headers,
                ...options
            });

            console.log('📥 Task Center API Response:', {
                status: response.status(),
                statusText: response.statusText(),
                timestamp: new Date().toISOString()
            });

            // Task Center API returns raw text, not JSON
            let data: string;
            try {
                data = await response.text();
            } catch (parseError: any) {
                console.log('⚠️ Text parsing failed:', parseError.message);
                data = '';
            }
            
            console.log('📊 Response Data (text length):', {
                length: data.length,
                timestamp: new Date().toISOString()
            });

            return {
                status: response.status(),
                data: data,
                headers: response.headers()
            };
        } catch (error: any) {
            console.log('❌ Task Center API Error:', {
                error: error.message,
                url: url,
                timestamp: new Date().toISOString()
            });
            throw new Error(`Task Center API GET request failed: ${error.message}`);
        }
    }

    /**
     * Make a POST request to the Task Center API
     * @param endpoint - The API endpoint (without base URL)
     * @param body - Request body
     * @param options - Additional options for the request
     * @returns The response data (raw text)
     */
    async post(endpoint: string, body: any = {}, options: ApiRequestOptions = {}): Promise<ApiResponse> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.buildHeaders(options.headers);

        console.log('📤 Task Center API POST Request:', {
            url: url,
            headers: { 'Authorization': '***masked***' },
            timestamp: new Date().toISOString()
        });

        try {
            const response = await this.request.post(url, {
                headers,
                data: body,
                ...options
            });

            console.log('📥 Task Center API Response:', {
                status: response.status(),
                statusText: response.statusText(),
                timestamp: new Date().toISOString()
            });

            if (!response.ok()) {
                throw new Error(`Task Center API request failed: ${response.status()} ${response.statusText()}`);
            }

            // Task Center API returns raw text, not JSON
            const data = await response.text();
            
            console.log('📊 Response Data (text length):', {
                length: data.length,
                timestamp: new Date().toISOString()
            });

            return {
                status: response.status(),
                data: data,
                headers: response.headers()
            };
        } catch (error: any) {
            throw new Error(`Task Center API POST request failed: ${error.message}`);
        }
    }

    /**
     * Make a PUT request to the Task Center API
     * @param endpoint - The API endpoint (without base URL)
     * @param body - Request body
     * @param options - Additional options for the request
     * @returns The response data (raw text)
     */
    async put(endpoint: string, body: any = {}, options: ApiRequestOptions = {}): Promise<ApiResponse> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.buildHeaders(options.headers);

        try {
            const response = await this.request.put(url, {
                headers,
                data: body,
                ...options
            });

            if (!response.ok()) {
                throw new Error(`Task Center API request failed: ${response.status()} ${response.statusText()}`);
            }

            // Task Center API returns raw text, not JSON
            const data = await response.text();
            return {
                status: response.status(),
                data: data,
                headers: response.headers()
            };
        } catch (error: any) {
            throw new Error(`Task Center API PUT request failed: ${error.message}`);
        }
    }

    /**
     * Make a DELETE request to the Task Center API
     * @param endpoint - The API endpoint (without base URL)
     * @param options - Additional options for the request
     * @returns The response data (raw text)
     */
    async delete(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.buildHeaders(options.headers);

        try {
            const response = await this.request.delete(url, {
                headers,
                ...options
            });

            if (!response.ok()) {
                throw new Error(`Task Center API request failed: ${response.status()} ${response.statusText()}`);
            }

            // Task Center API returns raw text, not JSON
            const data = await response.text();
            return {
                status: response.status(),
                data: data,
                headers: response.headers()
            };
        } catch (error: any) {
            throw new Error(`Task Center API DELETE request failed: ${error.message}`);
        }
    }

    /**
     * Build headers with Bearer token authentication
     * @param additionalHeaders - Additional headers to include
     * @returns Complete headers object
     */
    private buildHeaders(additionalHeaders?: Record<string, string>): Record<string, string> {
        const headers: Record<string, string> = { ...this.defaultHeaders };
        
        if (this.bearerToken) {
            headers['Authorization'] = `Bearer ${this.bearerToken}`;
        }
        
        if (additionalHeaders) {
            Object.assign(headers, additionalHeaders);
        }
        
        return headers;
    }

    /**
     * Get the base URL
     * @returns The base URL
     */
    getBaseUrl(): string {
        return this.baseUrl;
    }

    /**
     * Set the Bearer token for authentication
     * @param token - The Bearer token (without "Bearer " prefix)
     */
    setBearerToken(token: string): void {
        this.bearerToken = token;
    }

    /**
     * Get the current Bearer token
     * @returns The Bearer token or null if not set
     */
    getBearerToken(): string | null {
        return this.bearerToken;
    }

    /**
     * Clear the Bearer token
     */
    clearBearerToken(): void {
        this.bearerToken = null;
    }
}

