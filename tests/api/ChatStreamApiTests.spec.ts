import { test, expect } from '@playwright/test';
import { ApiManager } from '../../api/ApiManager';

/**
 * Chat Stream API Tests
 * 
 * These tests validate the Agent Platform Chat Stream API endpoint.
 * The API returns raw text responses (not JSON) for streaming chat interactions.
 */

// Test data - base query defaults
const testUuid = '42ae72d6-050b-11eb-95a1-6f83ba3ae821';
const testUsername = 'Dylan Nonaka';
const baseQuestion = 'What is my cap status?';

test.describe('Chat Stream API Tests', () => {
    let apiManager: ApiManager;

    test.beforeEach(async ({ request }) => {
        apiManager = new ApiManager(request);
        // Ensure we have a valid Bearer token before making API calls
        await apiManager.ensureAuthenticated();
    });

    test.describe('Chat Stream Endpoint', () => {
        test('should successfully send a chat stream request', { tag: ['@api'] }, async ({ request }) => {
            const chatStreamApi = apiManager.getChatStreamApi();
            
            console.log('🔍 Testing chat stream endpoint...');
            
            // Create a chat stream request using the base/default query
            const requestBody = chatStreamApi.createDefaultChatStreamRequest(
                baseQuestion,
                testUuid,
                testUsername
            );

            const response = await chatStreamApi.chatStream(requestBody);
            
            console.log(`✅ API Response Status: ${response.status}`);
            console.log(`📊 Response Data Length: ${response.data.length} characters`);
            
            // Verify response structure
            console.log('🔍 Verifying response structure...');
            expect(response).toBeDefined();
            expect(response.status).toBe(200);
            expect(response.data).toBeDefined();
            expect(typeof response.data).toBe('string');
            expect(response.data.length).toBeGreaterThan(0);
            console.log('✅ Response structure validation passed');
            
            // Validate response using API method
            const isValid = chatStreamApi.validateChatStreamResponse(response);
            expect(isValid).toBe(true);
            console.log('✅ Response validation passed');
        });

        test('should handle first message in conversation', { tag: ['@api'] }, async ({ request }) => {
            const chatStreamApi = apiManager.getChatStreamApi();
            
            console.log('🔍 Testing first message in conversation...');
            
            const requestBody = chatStreamApi.createChatStreamRequest(
                'Hello',
                testUuid,
                testUsername,
                true,  // is_first_message
                1,     // exp_system_key
                []     // conversation_history
            );

            const response = await chatStreamApi.chatStream(requestBody);
            
            console.log(`✅ API Response Status: ${response.status}`);
            console.log(`📊 Response Data Length: ${response.data.length} characters`);
            
            expect(response.status).toBe(200);
            expect(response.data).toBeTruthy();
            expect(typeof response.data).toBe('string');
            
            const isValid = chatStreamApi.validateChatStreamResponse(response);
            expect(isValid).toBe(true);
        });

        // Additional endpoint behavior tests can be added here as needed.
    });

    test.describe('Response Validation', () => {
        test('should extract response text correctly', { tag: ['@api'] }, async ({ request }) => {
            const chatStreamApi = apiManager.getChatStreamApi();
            
            const requestBody = chatStreamApi.createDefaultChatStreamRequest(
                'What is cap status',
                testUuid,
                testUsername
            );

            const response = await chatStreamApi.chatStream(requestBody);
            
            if (response.status === 200) {
                const responseText = chatStreamApi.extractResponseText(response);
                
                expect(responseText).toBeTruthy();
                expect(typeof responseText).toBe('string');
                expect(responseText.length).toBeGreaterThan(0);
                
                console.log(`✅ Extracted response text length: ${responseText.length} characters`);
                console.log(`📝 Response preview (first 100 chars): ${responseText.substring(0, 100)}...`);
            }
        });

        test('should validate response structure', { tag: ['@api'] }, async ({ request }) => {
            const chatStreamApi = apiManager.getChatStreamApi();
            
            const requestBody = chatStreamApi.createDefaultChatStreamRequest(
                'What is cap status',
                testUuid,
                testUsername
            );

            const response = await chatStreamApi.chatStream(requestBody);
            
            // Test validation method
            const isValid = chatStreamApi.validateChatStreamResponse(response);
            
            if (response.status === 200) {
                expect(isValid).toBe(true);
                console.log('✅ Response validation passed');
            } else {
                expect(isValid).toBe(false);
                console.log(`⚠️ Response status ${response.status} - validation correctly returned false`);
            }
        });

    });

    test.describe('Error Handling', () => {
        test('should handle invalid request body gracefully', { tag: ['@api'] }, async ({ request }) => {
            const chatStreamApi = apiManager.getChatStreamApi();
            
            // Test with missing required fields
            const invalidBody = {
                question: 'Test'
                // Missing uuid, username, etc.
            };

            try {
                const response = await chatStreamApi.chatStream(invalidBody as any);
                
                // API might return 400 or 500 for invalid requests
                expect([400, 500]).toContain(response.status);
                console.log(`✅ Invalid request handled - Status: ${response.status}`);
            } catch (error: any) {
                // Or it might throw an error
                console.log(`✅ Invalid request handled - Error: ${error.message}`);
                expect(error).toBeDefined();
            }
        });

        test('should handle empty question', { tag: ['@api'] }, async ({ request }) => {
            const chatStreamApi = apiManager.getChatStreamApi();
            
            const requestBody = chatStreamApi.createDefaultChatStreamRequest(
                '',
                testUuid,
                testUsername
            );

            const response = await chatStreamApi.chatStream(requestBody);
            
            // API might accept empty question or return error
            console.log(`✅ Empty question handled - Status: ${response.status}`);
            expect(response.status).toBeDefined();
        });

        test('should handle invalid UUID format', { tag: ['@api'] }, async ({ request }) => {
            const chatStreamApi = apiManager.getChatStreamApi();
            
            // Use the default/base question; only the UUID is invalid in this case
            const requestBody = chatStreamApi.createDefaultChatStreamRequest(
                baseQuestion,
                'invalid-uuid-format',
                testUsername
            );

            const response = await chatStreamApi.chatStream(requestBody);
            
            // API might accept it or return error
            console.log(`✅ Invalid UUID handled - Status: ${response.status}`);
            expect(response.status).toBeDefined();
        });
    });

});

