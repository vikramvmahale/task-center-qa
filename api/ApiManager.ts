import { CheckFileApi } from './endpoints/CheckFileApi';
import { APIRequestContext } from '@playwright/test';

/**
 * API Manager - Centralized access to all Task Center API endpoints
 * Similar to POManager but for API operations
 */
export class ApiManager {
    private checkFileApi: CheckFileApi;
    private request: APIRequestContext;

    constructor(request: APIRequestContext) {
        this.request = request;
        this.checkFileApi = new CheckFileApi(request);
    }

    /**
     * Get the Check File API instance
     * Note: Check File API uses its own authentication (auth key in header)
     * @returns Check File API instance
     */
    getCheckFileApi(): CheckFileApi {
        return this.checkFileApi;
    }
}

