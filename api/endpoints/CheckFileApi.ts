import { APIRequestContext } from '@playwright/test';
import { getEnvironmentConfig } from '../../utils/config/environment-config';

/**
 * Check File API Response interface
 * Based on the actual response structure from the check_file endpoint
 */
export interface CheckFileResponse {
    request_time_stamp: number;
    id: number;
    transaction_type: string;
    listing_guid: string | null;
    sale_guid: string;
    property_address: string;
    city: string;
    state: string;
    zip: string;
    status: string;
    stage_name: string;
    agent_name: string;
    agent_guid: string;
    co_listing_agent_name: string | null;
    mls_number: string;
    office_name: string;
    email: string;
    year_built: string;
    close_of_escrow: string;
    sales_price: number;
    buyer: string;
    seller: string;
    listing_commission: number | null;
    sale_commission: number | null;
    office_gross_commission: number;
    admin_brokerage_commission: number | null;
    referral_type: string | null;
    referral_amount: number;
    referral_agent: string;
    referral_brokerage_name: string | null;
    comments: string | null;
    custom_attrs: any | null;
    is_communication_enabled: boolean;
    locked_fields: any[];
    uuid: string;
    created_at: string;
    updated_at: string;
    sale_commission_percentage: number;
    listing_commission_percentage: number;
    raw_event_data: string;
    last_updated_at: {
        created_at: string;
        raw_event_data: string;
        close_of_escrow: string;
    };
    dismissed: boolean;
    county: string;
    deeplink_url: string;
    checklist_type: string | null;
    buyer_company: string;
    seller_company: string;
    incorrect_state: boolean;
    doc_ai_file_type: string;
    sky_slope_source: string;
    transaction_guid: string;
    escrow_number: string | null;
    tasks: Array<{
        id: number;
        to_do_template_id: number | null;
        to_do_list_id: number;
        uuid: string;
        task: string;
        due_days: number;
        user_type: string;
        due_date: string;
        user_id: number;
        status: string;
        date_time: string;
        position: number;
        parent_task_id: number | null;
        task_origin: string;
        created_at: string;
        updated_at: string;
        completed_at: string | null;
        [key: string]: any; // Allow for additional fields
    }>;
}

/**
 * API Response structure for JSON responses
 */
export interface JsonApiResponse {
    status: number;
    data: CheckFileResponse;
    headers: Record<string, string>;
}

/**
 * Check File API endpoint class for Task Center
 * Handles check_file operations to retrieve file/transaction information
 */
export class CheckFileApi {
    private request: APIRequestContext;
    private baseUrl: string;
    private authKey: string;

    constructor(request: APIRequestContext) {
        this.request = request;
        const env = getEnvironmentConfig();
        
        // Check if the environment has Task Center API configuration
        if ('taskCenterApiBaseUrl' in env && 'taskCenterAuthKey' in env) {
            this.baseUrl = (env as any).taskCenterApiBaseUrl;
            this.authKey = (env as any).taskCenterAuthKey;
        } else {
            throw new Error('Task Center API base URL and auth key not configured for this environment');
        }
    }

    /**
     * Get file information by SaleGuid
     * @param saleGuid - The SaleGuid to query
     * @returns Check File API response (JSON)
     */
    async checkFile(saleGuid: string): Promise<JsonApiResponse> {
        const endpoint = '/check_file';
        const url = `${this.baseUrl}${endpoint}?SaleGuid=${saleGuid}`;
        const headers = {
            'Authorization': this.authKey
        };

        console.log('📤 Task Center Check File API GET Request:', {
            url: url,
            headers: { 'Authorization': '***masked***' },
            timestamp: new Date().toISOString()
        });

        try {
            const response = await this.request.get(url, {
                headers
            });

            console.log('📥 Task Center Check File API Response:', {
                status: response.status(),
                statusText: response.statusText(),
                timestamp: new Date().toISOString()
            });

            if (!response.ok()) {
                throw new Error(`Task Center Check File API request failed: ${response.status()} ${response.statusText()}`);
            }

            // Task Center Check File API returns JSON
            const data: CheckFileResponse = await response.json();
            
            console.log('📊 Response Data:', {
                sale_guid: data.sale_guid,
                property_address: data.property_address,
                status: data.status,
                tasks_count: data.tasks?.length || 0,
                timestamp: new Date().toISOString()
            });

            return {
                status: response.status(),
                data: data,
                headers: response.headers()
            };
        } catch (error: any) {
            console.log('❌ Task Center Check File API Error:', {
                error: error.message,
                url: url,
                timestamp: new Date().toISOString()
            });
            throw new Error(`Task Center Check File API GET request failed: ${error.message}`);
        }
    }

    /**
     * Validate check file response
     * @param response - The API response
     * @returns True if response is valid
     */
    validateCheckFileResponse(response: JsonApiResponse): boolean {
        if (!response || response.status !== 200) {
            return false;
        }

        // Check that we have the required fields
        const data = response.data;
        return (
            data !== undefined &&
            typeof data.sale_guid === 'string' &&
            data.sale_guid.length > 0 &&
            typeof data.property_address === 'string'
        );
    }

    /**
     * Extract the sale GUID from the response
     * @param response - The API response
     * @returns The sale GUID
     */
    extractSaleGuid(response: JsonApiResponse): string {
        if (!this.validateCheckFileResponse(response)) {
            throw new Error('Invalid check file response');
        }
        return response.data.sale_guid;
    }

    /**
     * Extract the property address from the response
     * @param response - The API response
     * @returns The property address
     */
    extractPropertyAddress(response: JsonApiResponse): string {
        if (!this.validateCheckFileResponse(response)) {
            throw new Error('Invalid check file response');
        }
        return response.data.property_address;
    }

    /**
     * Get the tasks array from the response
     * @param response - The API response
     * @returns Array of tasks
     */
    extractTasks(response: JsonApiResponse): CheckFileResponse['tasks'] {
        if (!this.validateCheckFileResponse(response)) {
            throw new Error('Invalid check file response');
        }
        return response.data.tasks || [];
    }
}

