/**
 * FixMyPrompt - Message Extractor (v0.2.0)
 * Extracts recent messages from ChatGPT/Claude conversations
 * 
 * Features:
 * - Extracts last 10 messages from conversation
 * - Handles both user and assistant messages
 * - Cleans and normalizes message text
 * - Works with different UI versions
 */

/**
 * Extract messages from ChatGPT conversation
 * Returns array of last 10 messages with role and content
 */
export function extractChatGPTMessages() {
    try {
        const messages = [];
        
        // ChatGPT message selectors (multiple versions)
        const messageSelectors = [
            '[data-testid="message"]',
            '[data-testid="chat-message"]',
            '.group',
            '[role="article"]',
            '[data-message-id]'
        ];
        
        let messageElements = [];
        
        // Try each selector until we find messages
        for (const selector of messageSelectors) {
            messageElements = document.querySelectorAll(selector);
            if (messageElements.length > 0) {
                console.log(`[EXT] FixMyPrompt Found ${messageElements.length} messages using selector: ${selector}`);
                break;
            }
        }
        
        if (messageElements.length === 0) {
            console.warn("[EXT] FixMyPrompt No messages found in DOM");
            return [];
        }
        
        // Extract text and role from each message
        messageElements.forEach((element, index) => {
            try {
                let role = 'user';
                let content = '';
                
                // Determine role based on element structure
                // ChatGPT: User messages have different styling/classes than assistant
                const elementText = element.textContent || '';
                
                // Check for role indicators in data attributes
                if (element.getAttribute('data-role')) {
                    role = element.getAttribute('data-role');
                } else if (element.className && element.className.includes('user')) {
                    role = 'user';
                } else if (element.className && element.className.includes('assistant')) {
                    role = 'assistant';
                } else {
                    // Heuristic: Check if message contains "You" or similar indicators
                    // This is a fallback and may not be 100% accurate
                    const hasUserIndicator = element.querySelector('[class*="user"]') || 
                                            element.querySelector('[class*="from-user"]');
                    role = hasUserIndicator ? 'user' : 'assistant';
                }
                
                // Extract message content
                // Try multiple methods to get clean text
                const textElements = element.querySelectorAll('p, span, div[class*="text"]');
                
                if (textElements.length > 0) {
                    // Concatenate all text elements
                    const textParts = [];
                    textElements.forEach(el => {
                        const text = el.textContent?.trim();
                        if (text && !textParts.includes(text)) {
                            textParts.push(text);
                        }
                    });
                    content = textParts.join(' ').trim();
                } else {
                    // Fallback: use element's text content
                    content = element.textContent?.trim() || '';
                }
                
                // Clean up content (remove extra whitespace, newlines)
                content = content
                    .replace(/\n+/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                // Only add non-empty messages
                if (content && content.length > 0) {
                    messages.push({
                        role,
                        content,
                        timestamp: Date.now() - (messageElements.length - index) * 1000 // Approximate timestamps
                    });
                }
            } catch (error) {
                console.warn(`[EXT] FixMyPrompt Error extracting message ${index}:`, error);
            }
        });
        
        console.log(`[EXT] FixMyPrompt Extracted ${messages.length} messages from ChatGPT`);
        return messages;
    } catch (error) {
        console.error("[EXT] FixMyPrompt Error extracting ChatGPT messages:", error);
        return [];
    }
}

/**
 * Extract messages from Claude conversation
 * Returns array of last 10 messages with role and content
 */
export function extractClaudeMessages() {
    try {
        const messages = [];
        
        // Claude message selectors (multiple versions)
        const messageSelectors = [
            '[data-testid="message"]',
            '[data-testid="chat-message"]',
            '[role="article"]',
            '.message',
            '[class*="message"]'
        ];
        
        let messageElements = [];
        
        // Try each selector until we find messages
        for (const selector of messageSelectors) {
            messageElements = document.querySelectorAll(selector);
            if (messageElements.length > 0) {
                console.log(`[EXT] FixMyPrompt Found ${messageElements.length} messages using selector: ${selector}`);
                break;
            }
        }
        
        if (messageElements.length === 0) {
            console.warn("[EXT] FixMyPrompt No messages found in Claude DOM");
            return [];
        }
        
        // Extract text and role from each message
        messageElements.forEach((element, index) => {
            try {
                let role = 'user';
                let content = '';
                
                // Claude: Check for role in data attributes or classes
                if (element.getAttribute('data-role')) {
                    role = element.getAttribute('data-role');
                } else if (element.className && element.className.includes('user')) {
                    role = 'user';
                } else if (element.className && element.className.includes('assistant')) {
                    role = 'assistant';
                } else {
                    // Heuristic for Claude
                    const hasUserIndicator = element.querySelector('[class*="user"]');
                    role = hasUserIndicator ? 'user' : 'assistant';
                }
                
                // Extract message content
                const textElements = element.querySelectorAll('p, span, div[class*="text"]');
                
                if (textElements.length > 0) {
                    const textParts = [];
                    textElements.forEach(el => {
                        const text = el.textContent?.trim();
                        if (text && !textParts.includes(text)) {
                            textParts.push(text);
                        }
                    });
                    content = textParts.join(' ').trim();
                } else {
                    content = element.textContent?.trim() || '';
                }
                
                // Clean up content
                content = content
                    .replace(/\n+/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim();
                
                // Only add non-empty messages
                if (content && content.length > 0) {
                    messages.push({
                        role,
                        content,
                        timestamp: Date.now() - (messageElements.length - index) * 1000
                    });
                }
            } catch (error) {
                console.warn(`[EXT] FixMyPrompt Error extracting Claude message ${index}:`, error);
            }
        });
        
        console.log(`[EXT] FixMyPrompt Extracted ${messages.length} messages from Claude`);
        return messages;
    } catch (error) {
        console.error("[EXT] FixMyPrompt Error extracting Claude messages:", error);
        return [];
    }
}

/**
 * Extract recent messages from conversation
 * Automatically detects platform and extracts appropriate messages
 * 
 * @param {string} platform - 'chatgpt' or 'claude'
 * @param {number} limit - Maximum number of messages to extract (default: 10)
 * @returns {Array} Array of message objects with role and content
 */
export function extractRecentMessages(platform = 'chatgpt', limit = 10) {
    try {
        let messages = [];
        
        if (platform === 'chatgpt') {
            messages = extractChatGPTMessages();
        } else if (platform === 'claude') {
            messages = extractClaudeMessages();
        } else {
            console.warn(`[EXT] FixMyPrompt Unknown platform: ${platform}`);
            return [];
        }
        
        // Return only the last N messages
        const recentMessages = messages.slice(-limit);
        
        console.log(`[EXT] FixMyPrompt Returning ${recentMessages.length} recent messages (limit: ${limit})`);
        
        return recentMessages;
    } catch (error) {
        console.error("[EXT] FixMyPrompt Error extracting recent messages:", error);
        return [];
    }
}

/**
 * Format messages for context
 * Converts message array into a readable context string
 * 
 * @param {Array} messages - Array of message objects
 * @returns {string} Formatted context string
 */
export function formatMessagesForContext(messages) {
    try {
        if (!messages || messages.length === 0) {
            return '';
        }
        
        const formatted = messages
            .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
            .join('\n\n');
        
        return formatted;
    } catch (error) {
        console.error("[EXT] FixMyPrompt Error formatting messages for context:", error);
        return '';
    }
}

/**
 * Get conversation context
 * Combines recent messages with key details
 * 
 * @param {string} platform - 'chatgpt' or 'claude'
 * @param {number} limit - Maximum number of messages to extract
 * @returns {Object} Context object with messages and metadata
 */
export function getConversationContext(platform = 'chatgpt', limit = 10) {
    try {
        const messages = extractRecentMessages(platform, limit);
        
        return {
            messages,
            messageCount: messages.length,
            formattedContext: formatMessagesForContext(messages),
            extractedAt: Date.now()
        };
    } catch (error) {
        console.error("[EXT] FixMyPrompt Error getting conversation context:", error);
        return {
            messages: [],
            messageCount: 0,
            formattedContext: '',
            extractedAt: Date.now()
        };
    }
}
