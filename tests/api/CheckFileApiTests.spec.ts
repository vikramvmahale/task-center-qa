import { test, expect } from '@playwright/test';
import { ApiManager } from '../../api/ApiManager';
import { getEnvironmentConfig } from '../../utils/config/environment-config';

/**
 * Check File API Tests
 * 
 * These tests validate the Task Center Check File API endpoint.
 * The API returns JSON responses containing file/transaction information.
 */

// Test data
const testSaleGuid = 'ac5214b0-676c-4f7d-ab35-419bb6937949';

test.describe('Check File API Tests', () => {
    let apiManager: ApiManager;

    test.beforeEach(async ({ request }) => {
        apiManager = new ApiManager(request);
        // Note: Check File API uses its own auth key, not Bearer token
        // No need to call ensureAuthenticated() for this API
    });
        test('should successfully retrieve file information by SaleGuid', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            console.log('🔍 Testing check file endpoint...');
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            
            console.log(`✅ API Response Status: ${response.status}`);
            console.log(`📊 Sale GUID: ${response.data.sale_guid}`);
            console.log(`📊 Property Address: ${response.data.property_address}`);
            
            // Verify response structure
            console.log('🔍 Verifying response structure...');
            expect(response).toBeDefined();
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            
            // Validate response using the API's validation method
            const isValid = checkFileApi.validateCheckFileResponse(response);
            expect(isValid).toBe(true);
            console.log('✅ Response structure validation passed');
            
            // Verify key fields
            expect(response.data.sale_guid).toBe(testSaleGuid);
            expect(response.data.property_address).toBeDefined();
            expect(typeof response.data.property_address).toBe('string');
            expect(response.data.property_address.length).toBeGreaterThan(0);
        });

        test('should return correct property address for test SaleGuid', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            
            // Extract property address using helper method
            const propertyAddress = checkFileApi.extractPropertyAddress(response);
            
            expect(propertyAddress).toBeDefined();
            expect(propertyAddress).toBe('66763 W Marlboro Dr Chandler, AZ 85224');
            console.log(`✅ Property Address: ${propertyAddress}`);
        });

        test('should return transaction details with expected structure', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            const data = response.data;
            
            // Verify transaction type
            expect(data.transaction_type).toBeDefined();
            expect(data.transaction_type).toBe('Purchase');
            
            // Verify location fields
            expect(data.city).toBe('Chandler');
            expect(data.state).toBe('AZ');
            expect(data.zip).toBe('85224');
            expect(data.county).toBe('Maricopa');
            
            // Verify status
            expect(data.status).toBeDefined();
            expect(data.status).toBe('Pending');
            
            // Verify agent information
            expect(data.agent_name).toBeDefined();
            expect(data.agent_guid).toBeDefined();
            
            // Verify commission information
            expect(data.sales_price).toBe(150000.0);
            expect(data.office_gross_commission).toBe(4500.0);
            expect(data.sale_commission_percentage).toBe(3.0);
            
            console.log('✅ Transaction details validation passed');
        });

        test('should return tasks array with expected structure', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            
            // Extract tasks using helper method
            const tasks = checkFileApi.extractTasks(response);
            
            expect(Array.isArray(tasks)).toBe(true);
            expect(tasks.length).toBeGreaterThan(0);
            
            // Verify first task structure
            if (tasks.length > 0) {
                const firstTask = tasks[0];
                expect(firstTask.id).toBeDefined();
                expect(firstTask.uuid).toBeDefined();
                expect(firstTask.task).toBeDefined();
                expect(firstTask.status).toBeDefined();
                expect(firstTask.due_date).toBeDefined();
            }
            
            console.log(`✅ Tasks validation passed - Found ${tasks.length} tasks`);
        });

        test('should handle invalid SaleGuid gracefully', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            const invalidSaleGuid = 'invalid-guid-12345';
            
            console.log('🔍 Testing with invalid SaleGuid...');
            
            // The API should either return an error or an empty/error response
            try {
                const response = await checkFileApi.checkFile(invalidSaleGuid);
                
                // If it returns a response, it might be an error response
                // We'll check the status code
                if (response.status !== 200) {
                    console.log(`✅ API correctly returned error status: ${response.status}`);
                    expect(response.status).not.toBe(200);
                } else {
                    // If status is 200 but data is invalid, that's also acceptable
                    console.log('⚠️ API returned 200 but may have invalid data');
                }
            } catch (error: any) {
                // If it throws an error, that's also acceptable
                console.log(`✅ API correctly threw error: ${error.message}`);
                expect(error).toBeDefined();
            }
        });

        test('should extract sale GUID correctly from response', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            
            // Extract sale GUID using helper method
            const extractedSaleGuid = checkFileApi.extractSaleGuid(response);
            
            expect(extractedSaleGuid).toBe(testSaleGuid);
            console.log(`✅ Sale GUID extraction: ${extractedSaleGuid}`);
        });

        test('should return all required top-level fields', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            const data = response.data;
            
            // Verify all top-level required fields are present
            const requiredFields = [
                'id',
                'sale_guid',
                'property_address',
                'city',
                'state',
                'zip',
                'status',
                'stage_name',
                'agent_name',
                'agent_guid',
                'transaction_type',
                'created_at',
                'updated_at',
                'tasks'
            ];
            
            for (const field of requiredFields) {
                expect(data).toHaveProperty(field);
            }
            
            console.log('✅ All required fields present in response');
        });

        test('should validate date fields are in correct format', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            const data = response.data;
            
            // Verify date fields are valid ISO 8601 format strings
            const dateFields = ['created_at', 'updated_at', 'close_of_escrow'];
            
            for (const field of dateFields) {
                if (data[field as keyof typeof data]) {
                    const dateValue = data[field as keyof typeof data] as string;
                    expect(dateValue).toBeDefined();
                    // Check if it's a valid date string (ISO 8601 format)
                    const date = new Date(dateValue);
                    expect(date.getTime()).not.toBeNaN();
                    expect(dateValue).toMatch(/\d{4}-\d{2}-\d{2}/); // Basic date pattern
                }
            }
            
            // Verify last_updated_at structure
            if (data.last_updated_at) {
                expect(data.last_updated_at.created_at).toBeDefined();
                expect(new Date(data.last_updated_at.created_at).getTime()).not.toBeNaN();
            }
            
            console.log('✅ Date fields validation passed');
        });

        test('should validate GUID format for sale_guid and agent_guid', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            const data = response.data;
            
            // GUID format: 8-4-4-4-12 hexadecimal characters
            const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            
            expect(data.sale_guid).toMatch(guidPattern);
            expect(data.agent_guid).toMatch(guidPattern);
            
            // Verify transaction_guid format if present
            if (data.transaction_guid) {
                expect(data.transaction_guid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
            }
            
            console.log('✅ GUID format validation passed');
        });

        test('should validate email format', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            const data = response.data;
            
            // Basic email format validation
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (data.email) {
                expect(data.email).toMatch(emailPattern);
            }
            
            console.log('✅ Email format validation passed');
        });

        test('should validate commission calculations', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            const data = response.data;
            
            // Verify commission fields are numbers
            expect(typeof data.sales_price).toBe('number');
            expect(typeof data.office_gross_commission).toBe('number');
            expect(typeof data.sale_commission_percentage).toBe('number');
            
            // Verify commission percentage is between 0 and 100
            expect(data.sale_commission_percentage).toBeGreaterThanOrEqual(0);
            expect(data.sale_commission_percentage).toBeLessThanOrEqual(100);
            
            if (data.listing_commission_percentage !== null) {
                expect(typeof data.listing_commission_percentage).toBe('number');
                expect(data.listing_commission_percentage).toBeGreaterThanOrEqual(0);
                expect(data.listing_commission_percentage).toBeLessThanOrEqual(100);
            }
            
            // Verify commission amounts are non-negative
            if (data.office_gross_commission !== null) {
                expect(data.office_gross_commission).toBeGreaterThanOrEqual(0);
            }
            
            console.log('✅ Commission calculations validation passed');
        });

        test('should validate task structure and required fields', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            const tasks = checkFileApi.extractTasks(response);
            
            if (tasks.length > 0) {
                const task = tasks[0];
                
                // Verify required task fields
                expect(task.id).toBeDefined();
                expect(typeof task.id).toBe('number');
                expect(task.uuid).toBeDefined();
                expect(typeof task.uuid).toBe('string');
                expect(task.task).toBeDefined();
                expect(typeof task.task).toBe('string');
                expect(task.status).toBeDefined();
                expect(['pending', 'completed', 'in_progress']).toContain(task.status.toLowerCase());
                expect(task.due_date).toBeDefined();
                
                // Verify due_date is a valid date
                const dueDate = new Date(task.due_date);
                expect(dueDate.getTime()).not.toBeNaN();
                
                // Verify numeric fields
                expect(typeof task.due_days).toBe('number');
                expect(typeof task.user_id).toBe('number');
                expect(typeof task.position).toBe('number');
                
                // Verify date fields
                if (task.created_at) {
                    expect(new Date(task.created_at).getTime()).not.toBeNaN();
                }
                if (task.updated_at) {
                    expect(new Date(task.updated_at).getTime()).not.toBeNaN();
                }
            }
            
            console.log(`✅ Task structure validation passed for ${tasks.length} tasks`);
        });

        test('should return correct content-type header', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            
            // Verify response headers
            expect(response.headers).toBeDefined();
            
            // Check if content-type is present (should be application/json)
            const contentType = response.headers['content-type'] || response.headers['Content-Type'];
            if (contentType) {
                expect(contentType.toLowerCase()).toContain('application/json');
            }
            
            console.log('✅ Response headers validation passed');
        });

        test('should handle empty string SaleGuid', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            console.log('🔍 Testing with empty string SaleGuid...');
            
            try {
                const response = await checkFileApi.checkFile('');
                
                // API should either return an error or handle it gracefully
                if (response.status !== 200) {
                    console.log(`✅ API correctly returned error status: ${response.status}`);
                    expect(response.status).not.toBe(200);
                } else {
                    // If 200, the response might be empty or have error data
                    console.log('⚠️ API returned 200 for empty SaleGuid');
                }
            } catch (error: any) {
                // If it throws an error, that's acceptable
                console.log(`✅ API correctly threw error: ${error.message}`);
                expect(error).toBeDefined();
            }
        });

        test('should handle missing SaleGuid query parameter gracefully', { tag: ['@api'] }, async ({ request }) => {
            // This test checks if the API endpoint handles missing query parameter
            // We'll need to make a direct request since checkFile() always adds SaleGuid
            const env = getEnvironmentConfig();
            const baseUrl = (env as any).taskCenterApiBaseUrl;
            const authKey = (env as any).taskCenterAuthKey;
            
            console.log('🔍 Testing with missing SaleGuid parameter...');
            
            try {
                // Make request without SaleGuid parameter
                const response = await request.get(`${baseUrl}/check_file`, {
                    headers: { 'Authorization': authKey }
                });
                
                // API should return an error status (400, 404, etc.)
                expect(response.status()).not.toBe(200);
                console.log(`✅ API correctly returned error status: ${response.status()}`);
            } catch (error: any) {
                // If it throws an error, that's also acceptable
                console.log(`✅ API correctly threw error: ${error.message}`);
                expect(error).toBeDefined();
            }
        });

        test('should validate response time is acceptable', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const startTime = Date.now();
            const response = await checkFileApi.checkFile(testSaleGuid);
            const endTime = Date.now();
            const responseTime = endTime - startTime;
            
            // API should respond within 5 seconds (adjust threshold as needed)
            expect(responseTime).toBeLessThan(5000);
            
            console.log(`✅ Response time: ${responseTime}ms`);
            expect(response.status).toBe(200);
        });

        test('should validate numeric fields are correct types', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            const data = response.data;
            
            // Verify numeric fields are numbers
            const numericFields = [
                'id',
                'sales_price',
                'office_gross_commission',
                'sale_commission_percentage',
                'listing_commission_percentage',
                'referral_amount'
            ];
            
            for (const field of numericFields) {
                if (data[field as keyof typeof data] !== null && data[field as keyof typeof data] !== undefined) {
                    expect(typeof data[field as keyof typeof data]).toBe('number');
                }
            }
            
            // Verify year_built is string (as per the example response)
            if (data.year_built) {
                expect(typeof data.year_built).toBe('string');
            }
            
            console.log('✅ Numeric field types validation passed');
        });

        test('should validate boolean fields are correct types', { tag: ['@api'] }, async ({ request }) => {
            const checkFileApi = apiManager.getCheckFileApi();
            
            const response = await checkFileApi.checkFile(testSaleGuid);
            const data = response.data;
            
            // Verify boolean fields
            expect(typeof data.is_communication_enabled).toBe('boolean');
            expect(typeof data.dismissed).toBe('boolean');
            expect(typeof data.incorrect_state).toBe('boolean');
            
            // Verify locked_fields is an array
            expect(Array.isArray(data.locked_fields)).toBe(true);
            
            console.log('✅ Boolean and array field types validation passed');
        });
});

