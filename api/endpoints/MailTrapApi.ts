import { APIRequestContext } from '@playwright/test';
import { getEnvironmentConfig } from '../../utils/config/environment-config';
import { onboardingReportsConfig } from '../../utils/config/reports-config';

/**
 * MailTrap Message interface
 * Structure for individual email message from MailTrap API
 */
export interface MailTrapMessage {
    id: number;
    inbox_id: number;
    subject: string;
    sent_at: string;
    from_email: string;
    from_name: string;
    to_email: string;
    to_name: string;
    email_size: number;
    is_read: boolean;
    created_at: string;
    updated_at: string;
    html_body_size: number;
    text_body_size: number;
    human_size: string;
    [key: string]: any; // Allow for additional fields
}

/**
 * MailTrap Messages Response interface
 * Response structure for messages list endpoint
 */
export interface MailTrapMessagesResponse {
    status: number;
    data: MailTrapMessage[];
    headers: Record<string, string>;
}

/**
 * MailTrap Message Body Response interface
 * Response structure for message body endpoint
 */
export interface MailTrapMessageBodyResponse {
    status: number;
    data: string; // HTML body content
    headers: Record<string, string>;
}

/**
 * MailTrap API endpoint class
 * Handles MailTrap API operations to retrieve emails, filter by subject, extract report URLs, and download reports
 */
export class MailTrapApi {
    private request: APIRequestContext;
    private baseUrl: string;
    private accountId: string;
    private authToken: string;
    private inboxId: string;

    constructor(request: APIRequestContext) {
        this.request = request;
        const env = getEnvironmentConfig();
        
        // Check if the environment has MailTrap API configuration
        if ('mailTrapApiUrl' in env && 'mailTrapAccountId' in env && 
            'mailTrapAuthToken' in env && 'mailTrapInboxId' in env) {
            this.baseUrl = (env as any).mailTrapApiUrl;
            this.accountId = (env as any).mailTrapAccountId;
            this.authToken = (env as any).mailTrapAuthToken;
            this.inboxId = (env as any).mailTrapInboxId;
        } else {
            throw new Error('MailTrap API configuration not found for this environment');
        }
    }

    /**
     * Get all messages from MailTrap inbox
     * @returns List of email messages
     */
    async getMessages(): Promise<MailTrapMessagesResponse> {
        const endpoint = `/accounts/${this.accountId}/inboxes/${this.inboxId}/messages`;
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };

        console.log('📤 MailTrap API GET Request (Messages):', {
            url: url,
            headers: { 'Authorization': '***masked***' },
            timestamp: new Date().toISOString()
        });

        try {
            const response = await this.request.get(url, {
                headers
            });

            console.log('📥 MailTrap API Response:', {
                status: response.status(),
                statusText: response.statusText(),
                timestamp: new Date().toISOString()
            });

            if (!response.ok()) {
                throw new Error(`MailTrap API request failed: ${response.status()} ${response.statusText()}`);
            }

            // MailTrap API returns JSON array of messages
            const data: MailTrapMessage[] = await response.json();
            
            console.log('📊 Messages Retrieved:', {
                count: data.length,
                timestamp: new Date().toISOString()
            });

            return {
                status: response.status(),
                data: data,
                headers: response.headers()
            };
        } catch (error: any) {
            console.log('❌ MailTrap API Error:', {
                error: error.message,
                url: url,
                timestamp: new Date().toISOString()
            });
            throw new Error(`MailTrap API GET messages request failed: ${error.message}`);
        }
    }

    /**
     * Get message body (HTML) by message ID
     * @param messageId - The message ID to retrieve body for
     * @returns HTML body content
     */
    async getMessageBody(messageId: number): Promise<MailTrapMessageBodyResponse> {
        const endpoint = `/accounts/${this.accountId}/inboxes/${this.inboxId}/messages/${messageId}/body.html`;
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };

        console.log('📤 MailTrap API GET Request (Message Body):', {
            url: url,
            messageId: messageId,
            headers: { 'Authorization': '***masked***' },
            timestamp: new Date().toISOString()
        });

        try {
            const response = await this.request.get(url, {
                headers
            });

            console.log('📥 MailTrap API Response (Message Body):', {
                status: response.status(),
                statusText: response.statusText(),
                timestamp: new Date().toISOString()
            });

            if (!response.ok()) {
                throw new Error(`MailTrap API request failed: ${response.status()} ${response.statusText()}`);
            }

            // MailTrap API returns HTML body as text
            const data = await response.text();
            
            console.log('📊 Message Body Retrieved:', {
                messageId: messageId,
                bodyLength: data.length,
                timestamp: new Date().toISOString()
            });

            return {
                status: response.status(),
                data: data,
                headers: response.headers()
            };
        } catch (error: any) {
            console.log('❌ MailTrap API Error:', {
                error: error.message,
                url: url,
                messageId: messageId,
                timestamp: new Date().toISOString()
            });
            throw new Error(`MailTrap API GET message body request failed: ${error.message}`);
        }
    }

    /**
     * Filter messages by subject and time window
     * @param messages - Array of messages to filter
     * @param targetSubject - Subject to match (case-insensitive)
     * @param minutesAgo - Number of minutes ago to look back (default: 3)
     * @returns Filtered messages matching the criteria
     */
    filterMessagesBySubject(messages: MailTrapMessage[], targetSubject: string, minutesAgo: number = 3): MailTrapMessage[] {
        const now = new Date();
        const cutoffTime = new Date(now.getTime() - minutesAgo * 60 * 1000);

        const filtered = messages.filter(message => {
            // Check if subject matches (case-insensitive, contains targetSubject)
            const subjectMatches = message.subject && 
                message.subject.toLowerCase().includes(targetSubject.toLowerCase());
            
            // Check if message was sent within the time window
            const sentAt = new Date(message.sent_at);
            const isWithinTimeWindow = sentAt >= cutoffTime;

            return subjectMatches && isWithinTimeWindow;
        });

        // Sort by sent_at descending (most recent first)
        filtered.sort((a, b) => {
            const dateA = new Date(a.sent_at).getTime();
            const dateB = new Date(b.sent_at).getTime();
            return dateB - dateA;
        });

        console.log(`🔍 Filtered ${filtered.length} message(s) matching subject "${targetSubject}" within last ${minutesAgo} minutes`);

        return filtered;
    }

    /**
     * Get the latest message from a list of messages
     * @param messages - Array of messages
     * @returns The most recent message
     */
    getLatestMessage(messages: MailTrapMessage[]): MailTrapMessage | null {
        if (messages.length === 0) {
            return null;
        }

        // Sort by sent_at descending (most recent first)
        const sorted = [...messages].sort((a, b) => {
            const dateA = new Date(a.sent_at).getTime();
            const dateB = new Date(b.sent_at).getTime();
            return dateB - dateA;
        });

        return sorted[0];
    }

    /**
     * Wait for an email with the specified subject to arrive
     * Polls the MailTrap API every 30 seconds until a matching email is found or timeout is reached
     * @param targetSubject - Subject to match (Report Name)
     * @param minutesAgo - Number of minutes ago to look back (default: 3)
     * @param timeoutMs - Maximum time to wait in milliseconds (default: 30 minutes = 1800000ms)
     * @returns The matching message
     */
    async waitForEmailWithSubject(
        targetSubject: string, 
        minutesAgo: number = 3, 
        timeoutMs: number = 1800000
    ): Promise<MailTrapMessage> {
        const startTime = Date.now();
        const pollInterval = 30000; // 30 seconds
        const initialCutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);

        console.log(`⏳ Waiting for email with subject "${targetSubject}"...`);
        console.log(`   Timeout: ${timeoutMs / 1000 / 60} minutes`);
        console.log(`   Poll interval: ${pollInterval / 1000} seconds`);

        while (Date.now() - startTime < timeoutMs) {
            try {
                const response = await this.getMessages();
                const messages = response.data;

                // Filter messages by subject and time window
                const filtered = this.filterMessagesBySubject(messages, targetSubject, minutesAgo);

                if (filtered.length > 0) {
                    const latestMessage = this.getLatestMessage(filtered);
                    if (latestMessage) {
                        console.log(`✅ Found matching email with subject "${targetSubject}"`);
                        console.log(`   Message ID: ${latestMessage.id}`);
                        console.log(`   Sent at: ${latestMessage.sent_at}`);
                        return latestMessage;
                    }
                }

                // Calculate remaining time
                const elapsed = Date.now() - startTime;
                const remaining = timeoutMs - elapsed;
                const remainingMinutes = Math.floor(remaining / 1000 / 60);
                const remainingSeconds = Math.floor((remaining % 60000) / 1000);

                console.log(`⏳ No matching email found yet. Waiting... (${remainingMinutes}m ${remainingSeconds}s remaining)`);

                // Wait before next poll (unless we're about to timeout)
                if (remaining > pollInterval) {
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                } else {
                    // Wait for remaining time
                    await new Promise(resolve => setTimeout(resolve, remaining));
                }
            } catch (error: any) {
                console.log(`⚠️ Error while polling for email: ${error.message}`);
                // Continue polling even if there's an error
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }

        throw new Error(
            `Timeout waiting for email with subject "${targetSubject}" after ${timeoutMs / 1000 / 60} minutes`
        );
    }

    /**
     * Extract report download URL from HTML email body
     * @param htmlBody - HTML content of the email
     * @param targetSubject - Subject/Report Name to help identify the correct link
     * @returns Report download URL or null if not found
     */
    extractReportUrlFromHtml(htmlBody: string, targetSubject: string): string | null {
        // Try to find a link that looks like a report download URL
        // Common patterns: CSV download links, report URLs, etc.
        
        // Pattern 1: Look for links containing "report", "download", "csv", or similar keywords
        const linkPatterns = [
            /href=["']([^"']*report[^"']*\.csv[^"']*)["']/i,
            /href=["']([^"']*download[^"']*\.csv[^"']*)["']/i,
            /href=["']([^"']*\.csv[^"']*)["']/i,
            /href=["']([^"']*report[^"']*)["']/i,
            /href=["']([^"']*download[^"']*)["']/i
        ];

        for (const pattern of linkPatterns) {
            const match = htmlBody.match(pattern);
            if (match && match[1]) {
                const url = match[1];
                // Validate it looks like a URL
                if (url.startsWith('http://') || url.startsWith('https://')) {
                    console.log(`✅ Found report URL: ${url}`);
                    return url;
                }
            }
        }

        // Pattern 2: Look for any absolute URL in the HTML
        const absoluteUrlPattern = /https?:\/\/[^\s<>"']+/gi;
        const urls = htmlBody.match(absoluteUrlPattern);
        if (urls && urls.length > 0) {
            // Prefer URLs that contain report-related keywords
            const reportUrls = urls.filter(url => 
                /report|download|csv|export/i.test(url)
            );
            if (reportUrls.length > 0) {
                console.log(`✅ Found report URL: ${reportUrls[0]}`);
                return reportUrls[0];
            }
            // Fallback to first URL if no report-specific URL found
            console.log(`✅ Found URL (may be report link): ${urls[0]}`);
            return urls[0];
        }

        console.log(`⚠️ Could not find report URL in email body`);
        return null;
    }

    /**
     * Download report CSV from URL
     * @param reportUrl - URL of the report to download
     * @returns CSV content as string
     */
    async downloadReport(reportUrl: string, maxRetries: number = 3): Promise<string> {
        console.log(`📥 Downloading report from: ${reportUrl}`);

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                if (attempt > 1) {
                    console.log(`🔄 Retry attempt ${attempt}/${maxRetries} for downloading report...`);
                    // Wait before retry (exponential backoff)
                    await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
                }

                // Make request with increased timeout and explicit redirect handling
                // Playwright should automatically follow redirects, but we set maxRedirects explicitly
                const response = await this.request.get(reportUrl, {
                    timeout: 180000, // 3 minutes timeout (increased for large files)
                    maxRedirects: 10, // Allow up to 10 redirects (for S3 redirects)
                });

                // Handle redirects manually if Playwright didn't follow them automatically
                if (response.status() >= 300 && response.status() < 400) {
                    const location = response.headers()['location'];
                    if (location) {
                        console.log(`🔄 Detected redirect (${response.status()}), following to: ${location.substring(0, 100)}...`);
                        // Follow the redirect URL directly
                        const redirectResponse = await this.request.get(location, {
                            timeout: 180000,
                            maxRedirects: 10,
                        });
                        
                        if (!redirectResponse.ok()) {
                            throw new Error(`Failed to download report after redirect: ${redirectResponse.status()} ${redirectResponse.statusText()}`);
                        }

                        const csvContent = await redirectResponse.text();
                        
                        // Validate that we got actual CSV content
                        if (!csvContent || csvContent.trim().length === 0) {
                            throw new Error('Downloaded CSV content is empty after redirect');
                        }
                        
                        console.log(`✅ Report downloaded successfully after redirect (${csvContent.length} characters)`);
                        return csvContent;
                    }
                }

                if (!response.ok()) {
                    throw new Error(`Failed to download report: ${response.status()} ${response.statusText()}`);
                }

                const csvContent = await response.text();
                
                // Validate that we got actual CSV content
                if (!csvContent || csvContent.trim().length === 0) {
                    throw new Error('Downloaded CSV content is empty');
                }
                
                console.log(`✅ Report downloaded successfully (${csvContent.length} characters)`);

                return csvContent;
            } catch (error: any) {
                lastError = error;
                const errorMessage = error.message || String(error);
                
                console.log(`❌ Download attempt ${attempt}/${maxRetries} failed:`, {
                    error: errorMessage,
                    url: reportUrl.substring(0, 100) + (reportUrl.length > 100 ? '...' : ''),
                    timestamp: new Date().toISOString()
                });

                // Check if it's a retryable error (network issues)
                const isRetryableError = errorMessage.includes('socket hang up') || 
                    errorMessage.includes('ECONNRESET') || 
                    errorMessage.includes('ETIMEDOUT') ||
                    errorMessage.includes('timeout') ||
                    errorMessage.includes('ECONNREFUSED') ||
                    errorMessage.includes('ENOTFOUND');

                if (isRetryableError && attempt < maxRetries) {
                    console.log(`⚠️ Network error detected (${errorMessage}), will retry...`);
                    continue;
                }

                // If we've exhausted retries or it's not a retryable error, throw
                if (attempt === maxRetries) {
                    throw new Error(`Failed to download report after ${maxRetries} attempts: ${errorMessage}`);
                }
                
                // For non-retryable errors, throw immediately
                throw new Error(`Failed to download report: ${errorMessage}`);
            }
        }

        // If we get here, all retries failed
        throw new Error(`Failed to download report after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
    }

    /**
     * Complete workflow: Wait for email, extract report URL, and download report
     * @param targetSubject - Report Name to match in email subject
     * @param minutesAgo - Number of minutes ago to look back (default: 3)
     * @param timeoutMs - Maximum time to wait in milliseconds (default: 30 minutes)
     * @returns CSV content of the downloaded report
     */
    async waitForEmailAndDownloadReport(
        targetSubject: string,
        minutesAgo: number = 3,
        timeoutMs: number = 1800000
    ): Promise<string> {
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📧 MAIL TRAP: Starting report retrieval for "${targetSubject}"`);
        console.log(`${'='.repeat(80)}`);
        
        // Step 1: Wait for email with matching subject
        console.log(`📬 Step 1: Waiting for email with subject "${targetSubject}"...`);
        const message = await this.waitForEmailWithSubject(targetSubject, minutesAgo, timeoutMs);
        console.log(`✅ Email found:`);
        console.log(`   - Message ID: ${message.id}`);
        console.log(`   - Subject: ${message.subject}`);
        console.log(`   - From: ${message.from_email} (${message.from_name})`);
        console.log(`   - To: ${message.to_email}`);
        console.log(`   - Sent at: ${message.sent_at}`);
        console.log(`   - Email size: ${message.human_size}`);

        // Step 2: Get message body (HTML)
        console.log(`\n📄 Step 2: Retrieving email body (HTML)...`);
        const bodyResponse = await this.getMessageBody(message.id);
        console.log(`✅ Email body retrieved (${bodyResponse.data.length} characters)`);

        // Step 3: Extract report URL from HTML
        console.log(`\n🔗 Step 3: Extracting report download URL from email body...`);
        const reportUrl = this.extractReportUrlFromHtml(bodyResponse.data, targetSubject);
        if (!reportUrl) {
            throw new Error(`Could not find report URL in email body for subject "${targetSubject}"`);
        }
        console.log(`✅ Report URL extracted: ${reportUrl.substring(0, 100)}${reportUrl.length > 100 ? '...' : ''}`);

        // Step 4: Download the report
        console.log(`\n📥 Step 4: Downloading CSV report...`);
        const csvContent = await this.downloadReport(reportUrl);
        
        // Log CSV details
        const rows = csvContent.split('\n').filter(row => row.trim().length > 0);
        console.log(`\n✅ CSV Report downloaded successfully:`);
        console.log(`   - File size: ${csvContent.length} characters (${(csvContent.length / 1024).toFixed(2)} KB)`);
        console.log(`   - Total lines: ${rows.length}`);
        console.log(`   - Data rows: ${rows.length > 1 ? rows.length - 1 : 0} (excluding header)`);
        console.log(`${'='.repeat(80)}\n`);

        return csvContent;
    }

    /**
     * Validate CSV headers against expected headers
     * @param csvContent - CSV content as string
     * @param expectedHeaders - Array of expected header names
     * @returns Object with validation result and details
     */
    validateCsvHeaders(csvContent: string, expectedHeaders: string[]): {
        isValid: boolean;
        actualHeaders: string[];
        missingHeaders: string[];
        extraHeaders: string[];
    } {
        if (!csvContent || csvContent.trim().length === 0) {
            throw new Error('CSV content is empty');
        }

        // Parse CSV headers (first line)
        const lines = csvContent.split('\n').filter(line => line.trim().length > 0);
        if (lines.length === 0) {
            throw new Error('CSV file has no content');
        }

        // Parse first line as headers
        // Handle CSV format: split by comma, handle quoted values
        const parseCsvLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
            return result;
        };

        const actualHeaders = parseCsvLine(lines[0]).map(h => h.trim());

        // Normalize headers for comparison (case-insensitive, trim)
        const normalizeHeader = (header: string): string => header.toLowerCase().trim();
        const normalizedActual = actualHeaders.map(normalizeHeader);
        const normalizedExpected = expectedHeaders.map(normalizeHeader);

        // Find missing headers
        const missingHeaders: string[] = [];
        expectedHeaders.forEach((expected, index) => {
            if (!normalizedActual.includes(normalizedExpected[index])) {
                missingHeaders.push(expected);
            }
        });

        // Find extra headers (optional - for informational purposes)
        const extraHeaders: string[] = [];
        actualHeaders.forEach((actual, index) => {
            if (!normalizedExpected.includes(normalizedActual[index])) {
                extraHeaders.push(actual);
            }
        });

        const isValid = missingHeaders.length === 0;

        console.log('📊 CSV Header Validation:', {
            isValid: isValid,
            expectedCount: expectedHeaders.length,
            actualCount: actualHeaders.length,
            missingHeaders: missingHeaders,
            extraHeaders: extraHeaders.length > 0 ? extraHeaders : 'none'
        });

        return {
            isValid,
            actualHeaders,
            missingHeaders,
            extraHeaders
        };
    }

    /**
     * Validate CSV data for Account Solutions Communication Report
     * Validates specific column rules:
     * - Module Name: must be "account_solution" and not empty
     * - Invoice Number: must not be empty
     * - Communication Type: must not be empty and must be one of: Automated SMS, Automated Email, Manual Email, or Manual SMS
     * - Sending User: must not be empty
     * - Send Date / Time: must contain last Saturday in PST and not be empty
     * - Task ID: must not be empty
     * @param csvContent - CSV content as string
     * @returns Validation result with details
     */
    validateAccountSolutionsCommunicationReport(csvContent: string): {
        isValid: boolean;
        errors: string[];
        rowErrors: Array<{ row: number; errors: string[] }>;
    } {
        const errors: string[] = [];
        const rowErrors: Array<{ row: number; errors: string[] }> = [];

        if (!csvContent || csvContent.trim().length === 0) {
            return {
                isValid: false,
                errors: ['CSV content is empty'],
                rowErrors: []
            };
        }

        // Improved CSV parser that handles multi-line quoted values
        // This parser processes the entire CSV content character-by-character
        // to properly handle quoted fields that may contain newlines
        const parseCsvRows = (csvText: string): string[][] => {
            const rows: string[][] = [];
            const currentRow: string[] = [];
            let currentField = '';
            let inQuotes = false;
            let i = 0;

            while (i < csvText.length) {
                const char = csvText[i];
                const nextChar = i + 1 < csvText.length ? csvText[i + 1] : '';

                if (char === '"') {
                    if (inQuotes && nextChar === '"') {
                        // Escaped quote (double quote) - add single quote to field
                        currentField += '"';
                        i += 2;
                        continue;
                    } else {
                        // Toggle quote state
                        inQuotes = !inQuotes;
                        i++;
                        continue;
                    }
                }

                if (char === ',' && !inQuotes) {
                    // End of field (only when not in quotes)
                    currentRow.push(currentField.trim());
                    currentField = '';
                    i++;
                    continue;
                }

                // Handle newlines - only end row if not in quotes
                if ((char === '\n' || (char === '\r' && nextChar !== '\n')) && !inQuotes) {
                    // End of row (handle both \n and \r\n)
                    currentRow.push(currentField.trim());
                    if (currentRow.some(field => field !== '')) {
                        // Only add non-empty rows
                        rows.push([...currentRow]);
                    }
                    currentRow.length = 0;
                    currentField = '';
                    // Skip \r\n combination
                    if (char === '\r' && nextChar === '\n') {
                        i += 2;
                    } else {
                        i++;
                    }
                    continue;
                }

                // Skip \r if it's part of \r\n (already handled above)
                if (char === '\r' && nextChar === '\n') {
                    i++;
                    continue;
                }

                // Regular character - add to current field
                currentField += char;
                i++;
            }

            // Handle last field/row
            if (currentField.trim() !== '' || currentRow.length > 0) {
                currentRow.push(currentField.trim());
                if (currentRow.some(field => field !== '')) {
                    rows.push([...currentRow]);
                }
            }

            return rows;
        };

        // Parse CSV rows using the improved parser
        const rows = parseCsvRows(csvContent);
        
        if (rows.length < 2) {
            return {
                isValid: false,
                errors: ['CSV file must have at least a header row and one data row'],
                rowErrors: []
            };
        }

        const headers = rows[0].map(h => h.trim());
        
        // Find column indices
        const moduleNameIndex = headers.findIndex(h => h.toLowerCase() === 'module name');
        const invoiceNumberIndex = headers.findIndex(h => h.toLowerCase() === 'invoice number');
        const communicationTypeIndex = headers.findIndex(h => h.toLowerCase() === 'communication type');
        const sendingUserIndex = headers.findIndex(h => h.toLowerCase() === 'sending user');
        const sendDateTimeIndex = headers.findIndex(h => h.toLowerCase().includes('send date') || h.toLowerCase().includes('send date / time'));
        const taskIdIndex = headers.findIndex(h => h.toLowerCase() === 'task id');

        // Validate headers exist
        if (moduleNameIndex === -1) errors.push('Module Name column not found');
        if (invoiceNumberIndex === -1) errors.push('Invoice Number column not found');
        if (communicationTypeIndex === -1) errors.push('Communication Type column not found');
        if (sendingUserIndex === -1) errors.push('Sending User column not found');
        if (sendDateTimeIndex === -1) errors.push('Send Date / Time column not found');
        if (taskIdIndex === -1) errors.push('Task ID column not found');

        if (errors.length > 0) {
            return { isValid: false, errors, rowErrors };
        }

        // Calculate date range: last Friday to upcoming Thursday (same as used in the report)
        const getLastFridayPST = (): Date => {
            const now = new Date();
            
            // Get current date components in PST
            const pstDateStr = now.toLocaleString('en-US', { 
                timeZone: 'America/Los_Angeles',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            // Parse PST date
            const [month, day, year] = pstDateStr.split(/[/, ]/).filter(Boolean);
            const pstNow = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            
            // Find last Friday (Friday is day 5, 0 = Sunday)
            const currentDay = pstNow.getDay();
            let daysToSubtract: number;
            
            if (currentDay === 5) {
                // Today is Friday, go back 7 days
                daysToSubtract = 7;
            } else if (currentDay > 5) {
                // Saturday (6) or Sunday (0), go back (currentDay - 5) days
                daysToSubtract = currentDay - 5;
            } else {
                // Monday (1) through Thursday (4), go back (currentDay + 2) days
                daysToSubtract = currentDay + 2;
            }
            
            const lastFriday = new Date(pstNow);
            lastFriday.setDate(pstNow.getDate() - daysToSubtract);
            return lastFriday;
        };

        const getUpcomingThursdayPST = (): Date => {
            const now = new Date();
            
            // Get current date components in PST
            const pstDateStr = now.toLocaleString('en-US', { 
                timeZone: 'America/Los_Angeles',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            
            // Parse PST date
            const [month, day, year] = pstDateStr.split(/[/, ]/).filter(Boolean);
            const pstNow = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            
            // Find upcoming Thursday (Thursday is day 4, 0 = Sunday)
            const currentDay = pstNow.getDay();
            let daysToAdd: number;
            
            if (currentDay === 4) {
                // Today is Thursday, go forward 7 days
                daysToAdd = 7;
            } else if (currentDay < 4) {
                // Sunday (0) through Wednesday (3), go forward (4 - currentDay) days
                daysToAdd = 4 - currentDay;
            } else {
                // Friday (5) or Saturday (6), go forward (4 - currentDay + 7) days
                daysToAdd = 4 - currentDay + 7;
            }
            
            const upcomingThursday = new Date(pstNow);
            upcomingThursday.setDate(pstNow.getDate() + daysToAdd);
            return upcomingThursday;
        };

        const startDate = getLastFridayPST();
        const endDate = getUpcomingThursdayPST();
        
        // Set time to start of day for startDate and end of day for endDate
        const startDateOnly = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            startDate.getDate(),
            0, 0, 0, 0
        );
        const endDateOnly = new Date(
            endDate.getFullYear(),
            endDate.getMonth(),
            endDate.getDate(),
            23, 59, 59, 999
        );
        
        const startDateStr = startDateOnly.toLocaleDateString('en-US', { 
            timeZone: 'America/Los_Angeles',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
        const endDateStr = endDateOnly.toLocaleDateString('en-US', { 
            timeZone: 'America/Los_Angeles',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });

        // Validate data rows
        const validCommunicationTypes = ['Automated SMS', 'Automated Email', 'Manual Email', 'Manual SMS'];

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowErrorsList: string[] = [];
            const rowNumber = i + 1; // 1-indexed for user-friendly reporting

            // Validate Module Name
            if (moduleNameIndex < row.length) {
                const moduleName = row[moduleNameIndex]?.trim();
                if (!moduleName || moduleName === '') {
                    rowErrorsList.push('Module Name cannot be empty');
                } else if (moduleName !== 'account_solution') {
                    rowErrorsList.push(`Module Name must be "account_solution" but found "${moduleName}"`);
                }
            }

            // Validate Invoice Number
            if (invoiceNumberIndex < row.length) {
                const invoiceNumber = row[invoiceNumberIndex]?.trim();
                if (!invoiceNumber || invoiceNumber === '') {
                    rowErrorsList.push('Invoice Number cannot be empty');
                }
            }

            // Validate Communication Type
            if (communicationTypeIndex < row.length) {
                const communicationType = row[communicationTypeIndex]?.trim();
                if (!communicationType || communicationType === '') {
                    rowErrorsList.push('Communication Type cannot be empty');
                } else if (!validCommunicationTypes.includes(communicationType)) {
                    rowErrorsList.push(`Communication Type must be one of: ${validCommunicationTypes.join(', ')} but found "${communicationType}"`);
                }
            }

            // Validate Sending User
            if (sendingUserIndex < row.length) {
                const sendingUser = row[sendingUserIndex]?.trim();
                if (!sendingUser || sendingUser === '') {
                    rowErrorsList.push('Sending User cannot be empty');
                }
            }

            // Validate Send Date / Time is within the selected date range
            if (sendDateTimeIndex < row.length) {
                const sendDateTime = row[sendDateTimeIndex]?.trim();
                if (!sendDateTime || sendDateTime === '') {
                    rowErrorsList.push('Send Date / Time cannot be empty');
                } else {
                    // Try to extract date from the datetime string
                    // Handle various formats: MM/DD/YYYY, YYYY-MM-DD, etc.
                    const dateMatch = sendDateTime.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                        let dateStr = dateMatch[0];
                        let rowDate: Date;
                        
                        if (dateStr.includes('/')) {
                            // MM/DD/YYYY format
                            const [month, day, year] = dateStr.split('/').map(Number);
                            rowDate = new Date(year, month - 1, day);
                        } else {
                            // YYYY-MM-DD format
                            const [year, month, day] = dateStr.split('-').map(Number);
                            rowDate = new Date(year, month - 1, day);
                        }
                        
                        // Compare with date range (date only, ignore time)
                        const rowDateOnly = new Date(
                            rowDate.getFullYear(),
                            rowDate.getMonth(),
                            rowDate.getDate(),
                            0, 0, 0, 0
                        );
                        
                        // Check if date is within range (inclusive)
                        if (rowDateOnly.getTime() < startDateOnly.getTime() || rowDateOnly.getTime() > endDateOnly.getTime()) {
                            rowErrorsList.push(`Send Date / Time should be within the selected date range (${startDateStr} to ${endDateStr}) but found "${dateStr}"`);
                        }
                    } else {
                        // If we can't parse the date, log a warning but don't fail
                        // This handles edge cases where date format might be different
                        console.log(`⚠️ Could not parse date from Send Date / Time: "${sendDateTime}"`);
                    }
                }
            }

            // Validate Task ID
            // Task ID can be empty if Communication Type is "Manual SMS" or "Manual Email"
            if (taskIdIndex < row.length) {
                const taskId = row[taskIdIndex]?.trim();
                const communicationType = communicationTypeIndex < row.length ? row[communicationTypeIndex]?.trim() : '';
                
                // Check if Task ID is required based on Communication Type
                const isManualCommunication = communicationType === 'Manual SMS' || communicationType === 'Manual Email';
                const isTaskIdRequired = !isManualCommunication;
                
                if (isTaskIdRequired && (!taskId || taskId === '')) {
                    // Debug logging for problematic rows
                    if (rowNumber === 142 || rowNumber === 283) {
                        console.log(`\n🔍 Debug Row ${rowNumber} - Task ID Validation:`, {
                            totalColumns: row.length,
                            expectedColumns: headers.length,
                            taskIdIndex: taskIdIndex,
                            taskIdRawValue: row[taskIdIndex] || '(undefined)',
                            taskIdValueAfterTrim: taskId || '(empty after trim)',
                            taskIdColumnExists: taskIdIndex < row.length,
                            communicationType: communicationType || 'N/A',
                            isManualCommunication: isManualCommunication,
                            isTaskIdRequired: isTaskIdRequired,
                            columnIndices: {
                                moduleName: moduleNameIndex,
                                invoiceNumber: invoiceNumberIndex,
                                communicationType: communicationTypeIndex,
                                sendingUser: sendingUserIndex,
                                sendDateTime: sendDateTimeIndex,
                                taskId: taskIdIndex
                            },
                            sampleValues: {
                                moduleName: moduleNameIndex < row.length ? row[moduleNameIndex] : 'N/A',
                                invoiceNumber: invoiceNumberIndex < row.length ? row[invoiceNumberIndex] : 'N/A',
                                communicationType: communicationType || 'N/A',
                                sendingUser: sendingUserIndex < row.length ? row[sendingUserIndex] : 'N/A',
                                taskId: row[taskIdIndex] || 'N/A'
                            },
                            allColumns: row.map((col, idx) => ({
                                index: idx,
                                header: headers[idx] || `Column ${idx}`,
                                value: col,
                                isEmpty: !col || col.trim() === ''
                            }))
                        });
                    }
                    
                    // Provide context about the row to help understand why Task ID might be empty
                    const context: string[] = [];
                    if (communicationType) {
                        context.push(`Communication Type: "${communicationType}"`);
                    }
                    if (invoiceNumberIndex < row.length && row[invoiceNumberIndex]?.trim()) {
                        context.push(`Invoice Number: "${row[invoiceNumberIndex].trim()}"`);
                    }
                    if (sendingUserIndex < row.length && row[sendingUserIndex]?.trim()) {
                        context.push(`Sending User: "${row[sendingUserIndex].trim()}"`);
                    }
                    const contextStr = context.length > 0 ? ` (${context.join(', ')})` : '';
                    rowErrorsList.push(`Task ID cannot be empty for Communication Type "${communicationType}"${contextStr}`);
                }
            } else {
                // Debug logging if Task ID column doesn't exist in row
                if (rowNumber === 142 || rowNumber === 283) {
                    console.log(`\n🔍 Debug Row ${rowNumber} - Task ID Column Missing:`, {
                        totalColumns: row.length,
                        expectedColumns: headers.length,
                        taskIdIndex: taskIdIndex,
                        columnMismatch: `Row has ${row.length} columns but Task ID is at index ${taskIdIndex}`,
                        allColumns: row.map((col, idx) => ({
                            index: idx,
                            header: headers[idx] || `Column ${idx}`,
                            value: col
                        }))
                    });
                }
            }

            if (rowErrorsList.length > 0) {
                rowErrors.push({ row: rowNumber, errors: rowErrorsList });
            }
        }

        const isValid = errors.length === 0 && rowErrors.length === 0;

        console.log('📊 Account Solutions Communication Report Validation:', {
            isValid: isValid,
            totalRows: rows.length - 1,
            errors: errors.length,
            rowsWithErrors: rowErrors.length,
            rowErrors: rowErrors.slice(0, 5) // Log first 5 row errors
        });

        return {
            isValid,
            errors,
            rowErrors
        };
    }

    /**
     * Parse CSV rows handling multi-line quoted values
     * Shared helper method for all CSV validations
     */
    private parseCsvRows(csvText: string): string[][] {
        const rows: string[][] = [];
        const currentRow: string[] = [];
        let currentField = '';
        let inQuotes = false;
        let i = 0;

        while (i < csvText.length) {
            const char = csvText[i];
            const nextChar = i + 1 < csvText.length ? csvText[i + 1] : '';

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentField += '"';
                    i += 2;
                    continue;
                } else {
                    inQuotes = !inQuotes;
                    i++;
                    continue;
                }
            }

            if (char === ',' && !inQuotes) {
                currentRow.push(currentField.trim());
                currentField = '';
                i++;
                continue;
            }

            if ((char === '\n' || (char === '\r' && nextChar !== '\n')) && !inQuotes) {
                currentRow.push(currentField.trim());
                if (currentRow.some(field => field !== '')) {
                    rows.push([...currentRow]);
                }
                currentRow.length = 0;
                currentField = '';
                if (char === '\r' && nextChar === '\n') {
                    i += 2;
                } else {
                    i++;
                }
                continue;
            }

            if (char === '\r' && nextChar === '\n') {
                i++;
                continue;
            }

            currentField += char;
            i++;
        }

        if (currentField.trim() !== '' || currentRow.length > 0) {
            currentRow.push(currentField.trim());
            if (currentRow.some(field => field !== '')) {
                rows.push([...currentRow]);
            }
        }

        return rows;
    }

    /**
     * Validate Onboarding Specialist Productivity Report
     * Validates headers and checks that ALL rows contain "AZ" in State column if data exists
     */
    validateOnboardingSpecialistProductivityReport(csvContent: string, expectedHeaders: string[]): {
        isValid: boolean;
        errors: string[];
        rowErrors: Array<{ row: number; errors: string[] }>;
    } {
        const errors: string[] = [];
        const rowErrors: Array<{ row: number; errors: string[] }> = [];

        // Validate headers first
        const headerValidation = this.validateCsvHeaders(csvContent, expectedHeaders);
        if (!headerValidation.isValid) {
            return {
                isValid: false,
                errors: headerValidation.missingHeaders,
                rowErrors: []
            };
        }

        const rows = this.parseCsvRows(csvContent);
        if (rows.length < 2) {
            return { isValid: true, errors: [], rowErrors: [] }; // Empty report is valid
        }

        const headers = rows[0].map(h => h.trim());
        const stateIndex = headers.findIndex(h => h.toLowerCase() === 'state');

        if (stateIndex === -1) {
            errors.push('State column not found');
            return { isValid: false, errors, rowErrors };
        }

        // Check if State column contains expected state code in ALL rows (if data exists)
        const expectedStateCode = onboardingReportsConfig.testData.states['Onboarding Specialist Productivity Report'].code;
        const expectedStateName = onboardingReportsConfig.testData.states['Onboarding Specialist Productivity Report'].displayName;
        
        // Check ALL rows - every row must contain the expected state code
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowErrorsForThisRow: string[] = [];
            
            if (stateIndex < row.length && row[stateIndex]?.trim()) {
                const stateValue = row[stateIndex].trim().toUpperCase();
                if (!stateValue.includes(expectedStateCode) && stateValue !== expectedStateName.toUpperCase()) {
                    rowErrorsForThisRow.push(`State must contain "${expectedStateCode}" but found "${row[stateIndex].trim()}"`);
                }
            } else {
                // Empty State is also invalid
                rowErrorsForThisRow.push(`State cannot be empty`);
            }
            
            if (rowErrorsForThisRow.length > 0) {
                rowErrors.push({
                    row: i + 1, // Row number (1-indexed, accounting for header row)
                    errors: rowErrorsForThisRow
                });
            }
        }

        if (rowErrors.length > 0) {
            errors.push(`State column validation failed. ${rowErrors.length} row(s) do not contain "${expectedStateCode}"`);
        }

        return {
            isValid: errors.length === 0 && rowErrors.length === 0,
            errors,
            rowErrors
        };
    }

    /**
     * Validate Onboarding Specialist Report
     * Validates headers and checks that ALL rows contain "Auto OB Specialist" in User Name column if data exists
     */
    validateOnboardingSpecialistReport(csvContent: string, expectedHeaders: string[]): {
        isValid: boolean;
        errors: string[];
        rowErrors: Array<{ row: number; errors: string[] }>;
    } {
        const errors: string[] = [];
        const rowErrors: Array<{ row: number; errors: string[] }> = [];

        const headerValidation = this.validateCsvHeaders(csvContent, expectedHeaders);
        if (!headerValidation.isValid) {
            return {
                isValid: false,
                errors: headerValidation.missingHeaders,
                rowErrors: []
            };
        }

        const rows = this.parseCsvRows(csvContent);
        if (rows.length < 2) {
            return { isValid: true, errors: [], rowErrors: [] };
        }

        const headers = rows[0].map(h => h.trim());
        const userNameIndex = headers.findIndex(h => h.toLowerCase() === 'user name');

        if (userNameIndex === -1) {
            errors.push('User Name column not found');
            return { isValid: false, errors, rowErrors };
        }

        const expectedSpecialistName = onboardingReportsConfig.testData.specialists['Onboarding Specialist Report'];
        
        // Check ALL rows - every row must contain the expected specialist name
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowErrorsForThisRow: string[] = [];
            
            if (userNameIndex < row.length && row[userNameIndex]?.trim()) {
                const userName = row[userNameIndex].trim();
                if (!userName.includes(expectedSpecialistName)) {
                    rowErrorsForThisRow.push(`User Name must contain "${expectedSpecialistName}" but found "${userName}"`);
                }
            } else {
                // Empty User Name is also invalid
                rowErrorsForThisRow.push(`User Name cannot be empty`);
            }
            
            if (rowErrorsForThisRow.length > 0) {
                rowErrors.push({
                    row: i + 1, // Row number (1-indexed, accounting for header row)
                    errors: rowErrorsForThisRow
                });
            }
        }

        if (rowErrors.length > 0) {
            errors.push(`User Name column validation failed. ${rowErrors.length} row(s) do not contain "${expectedSpecialistName}"`);
        }

        return {
            isValid: errors.length === 0 && rowErrors.length === 0,
            errors,
            rowErrors
        };
    }

    /**
     * Validate Brokerage Ops Report
     * Validates headers and checks that ASA Name column is not empty
     */
    validateBrokerageOpsReport(csvContent: string, expectedHeaders: string[]): {
        isValid: boolean;
        errors: string[];
        rowErrors: Array<{ row: number; errors: string[] }>;
    } {
        const errors: string[] = [];
        const rowErrors: Array<{ row: number; errors: string[] }> = [];

        const headerValidation = this.validateCsvHeaders(csvContent, expectedHeaders);
        if (!headerValidation.isValid) {
            return {
                isValid: false,
                errors: headerValidation.missingHeaders,
                rowErrors: []
            };
        }

        const rows = this.parseCsvRows(csvContent);
        if (rows.length < 2) {
            return { isValid: true, errors: [], rowErrors: [] };
        }

        const headers = rows[0].map(h => h.trim());
        const asaNameIndex = headers.findIndex(h => h.toLowerCase() === 'asa name');

        if (asaNameIndex === -1) {
            errors.push('ASA Name column not found');
            return { isValid: false, errors, rowErrors };
        }

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowErrorsList: string[] = [];

            if (asaNameIndex < row.length) {
                const asaName = row[asaNameIndex]?.trim();
                if (!asaName || asaName === '') {
                    rowErrorsList.push('ASA Name cannot be empty');
                }
            }

            if (rowErrorsList.length > 0) {
                rowErrors.push({ row: i + 1, errors: rowErrorsList });
            }
        }

        return {
            isValid: errors.length === 0 && rowErrors.length === 0,
            errors,
            rowErrors
        };
    }

    /**
     * Validate Completed Tasks Report
     * Validates headers, required columns, and date range
     */
    validateCompletedTasksReport(csvContent: string, expectedHeaders: string[], startDate: string, endDate: string): {
        isValid: boolean;
        errors: string[];
        rowErrors: Array<{ row: number; errors: string[] }>;
    } {
        const errors: string[] = [];
        const rowErrors: Array<{ row: number; errors: string[] }> = [];

        const headerValidation = this.validateCsvHeaders(csvContent, expectedHeaders);
        if (!headerValidation.isValid) {
            return {
                isValid: false,
                errors: headerValidation.missingHeaders,
                rowErrors: []
            };
        }

        const rows = this.parseCsvRows(csvContent);
        if (rows.length < 2) {
            return { isValid: true, errors: [], rowErrors: [] };
        }

        const headers = rows[0].map(h => h.trim());
        const requiredColumns = [
            'Task Completer User Name',
            'Task Completer User Email',
            'Completed Task Create Date',
            'Completed Task Completed Date',
            'Completed Task Due Date',
            'Completed Task Name',
            'Completed Task Primary Attribute'
        ];

        const columnIndices: Record<string, number> = {};
        for (const colName of requiredColumns) {
            const index = headers.findIndex(h => h.toLowerCase() === colName.toLowerCase());
            if (index === -1) {
                errors.push(`${colName} column not found`);
            } else {
                columnIndices[colName] = index;
            }
        }

        const completedDateIndex = columnIndices['Completed Task Completed Date'];

        // Parse date range
        const parseDate = (dateStr: string): Date => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        const startDateObj = parseDate(startDate);
        const endDateObj = parseDate(endDate);

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowErrorsList: string[] = [];

            // Check required columns
            for (const [colName, index] of Object.entries(columnIndices)) {
                if (index < row.length) {
                    const value = row[index]?.trim();
                    if (!value || value === '') {
                        rowErrorsList.push(`${colName} cannot be empty`);
                    }
                }
            }

            // Validate Completed Task Completed Date is within range
            if (completedDateIndex !== undefined && completedDateIndex < row.length) {
                const completedDateStr = row[completedDateIndex]?.trim();
                if (completedDateStr) {
                    const dateMatch = completedDateStr.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                        let dateStr = dateMatch[0];
                        let rowDate: Date;
                        
                        if (dateStr.includes('/')) {
                            const [month, day, year] = dateStr.split('/').map(Number);
                            rowDate = new Date(year, month - 1, day);
                        } else {
                            const [year, month, day] = dateStr.split('-').map(Number);
                            rowDate = new Date(year, month - 1, day);
                        }
                        
                        const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
                        const startDateOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
                        const endDateOnly = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
                        
                        if (rowDateOnly < startDateOnly || rowDateOnly > endDateOnly) {
                            rowErrorsList.push(`Completed Task Completed Date "${dateStr}" is not within range ${startDate} to ${endDate}`);
                        }
                    }
                }
            }

            if (rowErrorsList.length > 0) {
                rowErrors.push({ row: i + 1, errors: rowErrorsList });
            }
        }

        return {
            isValid: errors.length === 0 && rowErrors.length === 0,
            errors,
            rowErrors
        };
    }

    /**
     * Validate Custom Data Export Tasks Report
     * Validates headers, required columns, and date range
     */
    validateCustomDataExportTasksReport(csvContent: string, expectedHeaders: string[], startDate: string, endDate: string): {
        isValid: boolean;
        errors: string[];
        rowErrors: Array<{ row: number; errors: string[] }>;
    } {
        const errors: string[] = [];
        const rowErrors: Array<{ row: number; errors: string[] }> = [];

        const headerValidation = this.validateCsvHeaders(csvContent, expectedHeaders);
        if (!headerValidation.isValid) {
            return {
                isValid: false,
                errors: headerValidation.missingHeaders,
                rowErrors: []
            };
        }

        const rows = this.parseCsvRows(csvContent);
        if (rows.length < 2) {
            return { isValid: true, errors: [], rowErrors: [] };
        }

        const headers = rows[0].map(h => h.trim());
        const requiredColumns = [
            'Task Template Name',
            'Task Name',
            'Task Primary Attribute',
            'Task Create Date',
            'Task Due Date',
            'Task Status'
        ];

        const columnIndices: Record<string, number> = {};
        for (const colName of requiredColumns) {
            const index = headers.findIndex(h => h.toLowerCase() === colName.toLowerCase());
            if (index === -1) {
                errors.push(`${colName} column not found`);
            } else {
                columnIndices[colName] = index;
            }
        }

        const createDateIndex = columnIndices['Task Create Date'];

        const parseDate = (dateStr: string): Date => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        const startDateObj = parseDate(startDate);
        const endDateObj = parseDate(endDate);

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowErrorsList: string[] = [];

            // Check required columns
            for (const [colName, index] of Object.entries(columnIndices)) {
                if (index < row.length) {
                    const value = row[index]?.trim();
                    if (!value || value === '') {
                        rowErrorsList.push(`${colName} cannot be empty`);
                    }
                }
            }

            // Validate Task Create Date is within range
            if (createDateIndex !== undefined && createDateIndex < row.length) {
                const createDateStr = row[createDateIndex]?.trim();
                if (createDateStr) {
                    const dateMatch = createDateStr.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                        let dateStr = dateMatch[0];
                        let rowDate: Date;
                        
                        if (dateStr.includes('/')) {
                            const [month, day, year] = dateStr.split('/').map(Number);
                            rowDate = new Date(year, month - 1, day);
                        } else {
                            const [year, month, day] = dateStr.split('-').map(Number);
                            rowDate = new Date(year, month - 1, day);
                        }
                        
                        const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
                        const startDateOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
                        const endDateOnly = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
                        
                        if (rowDateOnly < startDateOnly || rowDateOnly > endDateOnly) {
                            rowErrorsList.push(`Task Create Date "${dateStr}" is not within range ${startDate} to ${endDate}`);
                        }
                    }
                }
            }

            if (rowErrorsList.length > 0) {
                rowErrors.push({ row: i + 1, errors: rowErrorsList });
            }
        }

        return {
            isValid: errors.length === 0 && rowErrors.length === 0,
            errors,
            rowErrors
        };
    }

    /**
     * Validate Onboarding Communication Report
     * Validates headers and content rules
     */
    validateOnboardingCommunicationReport(csvContent: string, expectedHeaders: string[], startDate: string, endDate: string): {
        isValid: boolean;
        errors: string[];
        rowErrors: Array<{ row: number; errors: string[] }>;
    } {
        const errors: string[] = [];
        const rowErrors: Array<{ row: number; errors: string[] }> = [];

        const headerValidation = this.validateCsvHeaders(csvContent, expectedHeaders);
        if (!headerValidation.isValid) {
            return {
                isValid: false,
                errors: headerValidation.missingHeaders,
                rowErrors: []
            };
        }

        const rows = this.parseCsvRows(csvContent);
        if (rows.length < 2) {
            return { isValid: true, errors: [], rowErrors: [] };
        }

        const headers = rows[0].map(h => h.trim());
        const moduleNameIndex = headers.findIndex(h => h.toLowerCase() === 'module name');
        const agentNameIndex = headers.findIndex(h => h.toLowerCase() === 'agent name');
        const communicationTypeIndex = headers.findIndex(h => h.toLowerCase() === 'communication type');
        const sendDateTimeIndex = headers.findIndex(h => h.toLowerCase().includes('send date') || h.toLowerCase().includes('send date / time'));
        const sentStatusIndex = headers.findIndex(h => h.toLowerCase() === 'sent status');

        const validCommunicationTypes = ['Automated SMS', 'Automated Email', 'Manual SMS', 'Manual Email'];

        const parseDate = (dateStr: string): Date => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        const startDateObj = parseDate(startDate);
        const endDateObj = parseDate(endDate);

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowErrorsList: string[] = [];

            // Module Name must be "onboarding" and not empty
            if (moduleNameIndex !== -1 && moduleNameIndex < row.length) {
                const moduleName = row[moduleNameIndex]?.trim();
                if (!moduleName || moduleName === '') {
                    rowErrorsList.push('Module Name cannot be empty');
                } else if (moduleName.toLowerCase() !== 'onboarding') {
                    rowErrorsList.push(`Module Name must be "onboarding" but found "${moduleName}"`);
                }
            }

            // Agent Name cannot be empty
            if (agentNameIndex !== -1 && agentNameIndex < row.length) {
                const agentName = row[agentNameIndex]?.trim();
                if (!agentName || agentName === '') {
                    rowErrorsList.push('Agent Name cannot be empty');
                }
            }

            // Communication Type validation
            if (communicationTypeIndex !== -1 && communicationTypeIndex < row.length) {
                const communicationType = row[communicationTypeIndex]?.trim();
                if (!communicationType || communicationType === '') {
                    rowErrorsList.push('Communication Type cannot be empty');
                } else if (!validCommunicationTypes.includes(communicationType)) {
                    rowErrorsList.push(`Communication Type must be one of: ${validCommunicationTypes.join(', ')} but found "${communicationType}"`);
                }
            }

            // Send Date / Time validation
            if (sendDateTimeIndex !== -1 && sendDateTimeIndex < row.length) {
                const sendDateTime = row[sendDateTimeIndex]?.trim();
                if (!sendDateTime || sendDateTime === '') {
                    rowErrorsList.push('Send Date / Time cannot be empty');
                } else {
                    const dateMatch = sendDateTime.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                        let dateStr = dateMatch[0];
                        let rowDate: Date;
                        
                        if (dateStr.includes('/')) {
                            const [month, day, year] = dateStr.split('/').map(Number);
                            rowDate = new Date(year, month - 1, day);
                        } else {
                            const [year, month, day] = dateStr.split('-').map(Number);
                            rowDate = new Date(year, month - 1, day);
                        }
                        
                        const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
                        const startDateOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
                        const endDateOnly = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
                        
                        if (rowDateOnly < startDateOnly || rowDateOnly > endDateOnly) {
                            rowErrorsList.push(`Send Date / Time "${dateStr}" is not within range ${startDate} to ${endDate}`);
                        }
                    }
                }
            }

            // Sent Status must be "Success" and not empty
            if (sentStatusIndex !== -1 && sentStatusIndex < row.length) {
                const sentStatus = row[sentStatusIndex]?.trim();
                if (!sentStatus || sentStatus === '') {
                    rowErrorsList.push('Sent Status cannot be empty');
                } else if (sentStatus !== 'Success') {
                    rowErrorsList.push(`Sent Status must be "Success" but found "${sentStatus}"`);
                }
            }

            if (rowErrorsList.length > 0) {
                rowErrors.push({ row: i + 1, errors: rowErrorsList });
            }
        }

        return {
            isValid: errors.length === 0 && rowErrors.length === 0,
            errors,
            rowErrors
        };
    }

    /**
     * Validate Onboarding Module Agents Report
     * Validates headers and conditional content rules
     */
    validateOnboardingModuleAgentsReport(csvContent: string, expectedHeaders: string[], startDate: string, endDate: string): {
        isValid: boolean;
        errors: string[];
        rowErrors: Array<{ row: number; errors: string[] }>;
    } {
        const errors: string[] = [];
        const rowErrors: Array<{ row: number; errors: string[] }> = [];

        const headerValidation = this.validateCsvHeaders(csvContent, expectedHeaders);
        if (!headerValidation.isValid) {
            return {
                isValid: false,
                errors: headerValidation.missingHeaders,
                rowErrors: []
            };
        }

        const rows = this.parseCsvRows(csvContent);
        if (rows.length < 2) {
            return { isValid: true, errors: [], rowErrors: [] };
        }

        const headers = rows[0].map(h => h.trim());
        const requiredColumns = [
            'Agent Name',
            'Agent Type',
            'Business Entity',
            'Join Agent Status',
            'Primary Licensed State',
            'Join Application Complete Date/Timestamp'
        ];

        const conditionalColumns = [
            'Review Complete Date/Timestamp',
            'License Transfer Date/Timestamp',
            'Agent Active Date',
            'Agent Active Date Added At'
        ];

        const columnIndices: Record<string, number> = {};
        for (const colName of [...requiredColumns, ...conditionalColumns]) {
            const index = headers.findIndex(h => h.toLowerCase() === colName.toLowerCase());
            if (index !== -1) {
                columnIndices[colName] = index;
            }
        }

        const joinAppDateIndex = columnIndices['Join Application Complete Date/Timestamp'];
        const joinStatusIndex = columnIndices['Join Agent Status'];

        const parseDate = (dateStr: string): Date => {
            const [year, month, day] = dateStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        };

        const startDateObj = parseDate(startDate);
        const endDateObj = parseDate(endDate);

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const rowErrorsList: string[] = [];

            // Check required columns
            for (const colName of requiredColumns) {
                const index = columnIndices[colName];
                if (index !== undefined && index < row.length) {
                    const value = row[index]?.trim();
                    if (!value || value === '') {
                        rowErrorsList.push(`${colName} cannot be empty`);
                    }
                }
            }

            // Check Join Application Complete Date/Timestamp is within range
            if (joinAppDateIndex !== undefined && joinAppDateIndex < row.length) {
                const joinAppDateStr = row[joinAppDateIndex]?.trim();
                if (joinAppDateStr) {
                    const dateMatch = joinAppDateStr.match(/(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/);
                    if (dateMatch) {
                        let dateStr = dateMatch[0];
                        let rowDate: Date;
                        
                        if (dateStr.includes('/')) {
                            const [month, day, year] = dateStr.split('/').map(Number);
                            rowDate = new Date(year, month - 1, day);
                        } else {
                            const [year, month, day] = dateStr.split('-').map(Number);
                            rowDate = new Date(year, month - 1, day);
                        }
                        
                        const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
                        const startDateOnly = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
                        const endDateOnly = new Date(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
                        
                        if (rowDateOnly < startDateOnly || rowDateOnly > endDateOnly) {
                            rowErrorsList.push(`Join Application Complete Date/Timestamp "${dateStr}" is not within range ${startDate} to ${endDate}`);
                        }
                    }
                }
            }

            // Conditional validation: If Join Agent Status is "Active", conditional columns cannot be empty
            if (joinStatusIndex !== undefined && joinStatusIndex < row.length) {
                const joinStatus = row[joinStatusIndex]?.trim();
                if (joinStatus && joinStatus.toLowerCase() === 'active') {
                    for (const colName of conditionalColumns) {
                        const index = columnIndices[colName];
                        if (index !== undefined && index < row.length) {
                            const value = row[index]?.trim();
                            if (!value || value === '') {
                                rowErrorsList.push(`${colName} cannot be empty when Join Agent Status is "Active"`);
                            }
                        }
                    }
                }
            }

            if (rowErrorsList.length > 0) {
                rowErrors.push({ row: i + 1, errors: rowErrorsList });
            }
        }

        return {
            isValid: errors.length === 0 && rowErrors.length === 0,
            errors,
            rowErrors
        };
    }
}

