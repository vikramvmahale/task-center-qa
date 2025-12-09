import { ApiClient, ApiResponse } from '../ApiClient';
import { APIRequestContext } from '@playwright/test';

/**
 * Chat Stream API request body interface
 */
export interface ChatStreamRequest {
    question: string;
    uuid: string;
    username: string;
    is_first_message: boolean;
    exp_system_key: number;
    conversation_history: Array<{
        question: string;
        answer: string;
        sql_query: string;
        table_used: string;
    }>;
}

/**
 * Chat Stream API endpoint class for Mira Agent Platform
 * Handles chat stream operations
 */
export class ChatStreamApi {
    apiClient: ApiClient;

    constructor(request: APIRequestContext) {
        this.apiClient = new ApiClient(request);
    }

    /**
     * Send a chat stream request
     * @param requestBody - The chat stream request body
     * @returns Chat stream response (raw text)
     */
    async chatStream(requestBody: ChatStreamRequest): Promise<ApiResponse> {
        const endpoint = '/chat_stream';
        return await this.apiClient.post(endpoint, requestBody);
    }

    /**
     * Create a chat stream request body.
     * All fields are mandatory for this endpoint.
     *
     * @param question - The question to ask
     * @param uuid - The UUID for the conversation
     * @param username - The username
     * @param is_first_message - Whether this is the first message in the conversation
     * @param exp_system_key - The EXP system key
     * @param conversation_history - Prior Q/A history for this conversation
     * @returns Chat stream request body
     */
    createChatStreamRequest(
        question: string,
        uuid: string,
        username: string,
        is_first_message: boolean,
        exp_system_key: number,
        conversation_history: Array<{
            question: string;
            answer: string;
            sql_query: string;
            table_used: string;
        }>
    ): ChatStreamRequest {
        return {
            question,
            uuid,
            username,
            is_first_message,
            exp_system_key,
            conversation_history
        };
    }

    /**
     * Helper to create the standard/base chat stream request body with
     * the commonly used default values for this project.
     *
     * Defaults:
     *  - is_first_message: true
     *  - exp_system_key: 1
     *  - conversation_history: []
     */
    createDefaultChatStreamRequest(
        question: string,
        uuid: string,
        username: string
    ): ChatStreamRequest {
        return this.createChatStreamRequest(
            question,
            uuid,
            username,
            true, // is_first_message
            1,    // exp_system_key
            []    // conversation_history
        );
    }

    /**
     * Validate chat stream response
     * @param response - The API response
     * @returns True if response is valid
     */
    validateChatStreamResponse(response: ApiResponse): boolean {
        if (!response || response.status !== 200) {
            return false;
        }

        // Mira API returns raw text, so we just check that we have data
        return typeof response.data === 'string' && response.data.length > 0;
    }

    /**
     * Extract the response text
     * @param response - The API response
     * @returns The response text
     */
    extractResponseText(response: ApiResponse): string {
        if (!this.validateChatStreamResponse(response)) {
            throw new Error('Invalid chat stream response');
        }
        return response.data;
    }
}

