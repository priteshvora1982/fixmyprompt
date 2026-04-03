/**
 * FixMyPrompt - Context Manager (v0.2.0)
 * Manages conversational memory and context accumulation for v0.2.0
 * 
 * Features:
 * - Saves context with EVERY prompt (not just improved ones)
 * - Accumulates context in localStorage (7-day expiry)
 * - Extracts key details from prompts
 * - Tracks questions already asked
 * - Provides context for backend API calls
 */

import { CONTEXT, API } from "./constants.js";

class ContextManager {
    constructor() {
        this.contextCache = new Map();
        this.conversationId = null;
        this.currentContext = null;
    }

    /**
     * Extract conversation ID from the current page
     * For ChatGPT: Extract from URL or page structure
     * For Claude: Extract from URL or page structure
     */
    extractConversationId() {
        // Try to get from URL first (works for both ChatGPT and Claude)
        const url = window.location.href;
        
        // ChatGPT: /c/{conversationId}
        const chatgptMatch = url.match(/\/c\/([a-f0-9-]+)/);
        if (chatgptMatch) {
            return `chatgpt-${chatgptMatch[1]}`;
        }
        
        // Claude: /conversation/{conversationId}
        const claudeMatch = url.match(/\/conversation\/([a-f0-9-]+)/);
        if (claudeMatch) {
            return `claude-${claudeMatch[1]}`;
        }
        
        // Fallback: Generate a session-based ID
        return `session-${Date.now()}`;
    }

    /**
     * Get current conversation ID
     */
    getConversationId() {
        if (!this.conversationId) {
            this.conversationId = this.extractConversationId();
        }
        return this.conversationId;
    }

    /**
     * Generate localStorage key for context
     */
    getStorageKey() {
        const conversationId = this.getConversationId();
        return `${CONTEXT.STORAGE_KEY}_${conversationId}`;
    }

    /**
     * Extract key details from a prompt
     * Identifies important concepts and topics
     */
    extractKeyDetails(prompt) {
        const details = [];
        
        // Extract capitalized phrases (likely important concepts)
        const capitalizedPhrases = prompt.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
        details.push(...capitalizedPhrases.slice(0, 3));
        
        // Extract key action words
        const actionWords = ['build', 'create', 'develop', 'improve', 'learn', 'understand', 'analyze', 'design', 'implement', 'optimize'];
        const foundActions = actionWords.filter(word => prompt.toLowerCase().includes(word));
        details.push(...foundActions);
        
        // Extract domain-related keywords
        const domainKeywords = prompt.match(/\b(finance|investment|wealth|business|technical|creative_writing|creative_media|creative|academic|career|health|fitness|wellness)\b/gi) || [];
        details.push(...domainKeywords);
        
        // Remove duplicates and return unique details
        return [...new Set(details.filter(d => d && d.length > 0))].slice(0, 10);
    }

    /**
     * Detect conversation topic from accumulated prompts
     */
    detectConversationTopic(previousPrompts) {
        if (!previousPrompts || previousPrompts.length === 0) {
            return null;
        }
        
        // Combine all prompts and extract key terms
        const allText = previousPrompts.map(p => p.original || p).join(' ');
        const words = allText.toLowerCase().split(/\s+/);
        
        // Find most common meaningful words (length > 4)
        const wordFreq = {};
        words.forEach(word => {
            if (word.length > 4 && !['about', 'would', 'could', 'should', 'please', 'thank'].includes(word)) {
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });
        
        const topWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([word]) => word);
        
        return topWords.length > 0 ? topWords.join(', ') : null;
    }

    /**
     * Load context from localStorage
     */
    loadContextFromStorage() {
        try {
            const storageKey = this.getStorageKey();
            const stored = localStorage.getItem(storageKey);
            
            if (!stored) {
                return null;
            }
            
            const context = JSON.parse(stored);
            
            // Check if context has expired
            if (context.expiresAt && Date.now() > context.expiresAt) {
                console.log(`[FixMyPrompt] Context expired, clearing`);
                localStorage.removeItem(storageKey);
                return null;
            }
            
            console.log(`[FixMyPrompt] Context loaded from storage (${context.previousPrompts?.length || 0} prompts)`);
            return context;
        } catch (error) {
            console.error("[FixMyPrompt] Error loading context from storage:", error);
            return null;
        }
    }

    /**
     * Save context to localStorage
     * Called with EVERY prompt (not just improved ones)
     */
    saveContextToStorage(contextData) {
        try {
            const storageKey = this.getStorageKey();
            const expiresAt = Date.now() + (CONTEXT.EXPIRATION_DAYS * 24 * 60 * 60 * 1000);
            
            const contextWithExpiry = {
                ...contextData,
                expiresAt,
                savedAt: Date.now()
            };
            
            localStorage.setItem(storageKey, JSON.stringify(contextWithExpiry));
            console.log(`[FixMyPrompt] Context saved to storage (${contextData.previousPrompts?.length || 0} prompts)`);
            
            return true;
        } catch (error) {
            console.error("[FixMyPrompt] Error saving context to storage:", error);
            return false;
        }
    }

    /**
     * Add a prompt to the context
     * Called EVERY time user enters a prompt (whether improved or not)
     */
    addPromptToContext(prompt, domain, improvedData = null) {
        try {
            // Load existing context
            let context = this.loadContextFromStorage();
            
            if (!context) {
                // Create new context
                context = {
                    conversationId: this.getConversationId(),
                    domain,
                    previousPrompts: [],
                    keyDetails: [],
                    questionsAsked: [],
                    conversationTopic: null
                };
            }
            
            // Create prompt entry
            const promptEntry = {
                original: prompt,
                domain,
                timestamp: Date.now()
            };
            
            // Add improvement data if available
            if (improvedData) {
                promptEntry.improved = improvedData.improved;
                promptEntry.refined = improvedData.refined;
                promptEntry.score = improvedData.score;
                promptEntry.changes = improvedData.changes;
            }
            
            // Add to previous prompts
            context.previousPrompts.push(promptEntry);
            
            // Extract and add key details
            const newDetails = this.extractKeyDetails(prompt);
            context.keyDetails = [...new Set([...context.keyDetails, ...newDetails])];
            
            // Update conversation topic
            context.conversationTopic = this.detectConversationTopic(context.previousPrompts);
            
            // Update domain if not set
            if (!context.domain || context.domain === 'general') {
                context.domain = domain;
            }
            
            // Save to storage
            this.saveContextToStorage(context);
            
            // Cache in memory
            this.currentContext = context;
            
            console.log('[FixMyPrompt] ===== CONTEXT UPDATED =====');
            console.log('[FixMyPrompt] Total prompts now:', context.previousPrompts.length);
            console.log('[FixMyPrompt] All prompts:', context.previousPrompts.map(p => p.original));
            console.log('[FixMyPrompt] Conversation topic:', context.conversationTopic);
            
            return context;
        } catch (error) {
            console.error("[FixMyPrompt] Error adding prompt to context:", error);
            return null;
        }
    }

    /**
     * Get context for API call
     * Returns only relevant recent context to avoid huge payloads
     */
    getContextForAPI() {
        try {
            let context = this.currentContext || this.loadContextFromStorage();
            
            if (!context || context.previousPrompts.length === 0) {
                console.log('[FixMyPrompt] getContextForAPI - No context available');
                return null;
            }
            
            console.log('[FixMyPrompt] ===== CONTEXT FOR API =====');
            console.log('[FixMyPrompt] getContextForAPI - Total prompts in storage:', context.previousPrompts.length);
            console.log('[FixMyPrompt] getContextForAPI - All prompts:', context.previousPrompts.map(p => p.original));
            console.log('[FixMyPrompt] getContextForAPI - Conversation topic:', context.conversationTopic);
            console.log('[FixMyPrompt] getContextForAPI - Conversation ID:', context.conversationId);
            const promptsToSend = context.previousPrompts.slice(-5);
            console.log('[FixMyPrompt] getContextForAPI - Sending', promptsToSend.length, 'prompts to API');
            console.log('[FixMyPrompt] getContextForAPI - Prompts to send:', promptsToSend.map(p => p.original));
            promptsToSend.forEach((p, idx) => {
                console.log('[FixMyPrompt]   Prompt ' + (idx + 1) + ': "' + p.original.substring(0, 40) + '..." (domain: ' + p.domain + ')');
            });
            
            // Return last 5 prompts to avoid huge payloads
            // Include all accumulated key details and conversation topic
            return {
                previousPrompts: promptsToSend.map(p => ({
                    original: p.original,
                    improved: p.improved || null,
                    domain: p.domain,
                    timestamp: p.timestamp
                })),
                keyDetails: context.keyDetails,
                conversationTopic: context.conversationTopic,
                domain: context.domain,
                questionsAsked: context.questionsAsked || [],
                totalPromptsInStorage: context.previousPrompts.length
            };
        } catch (error) {
            console.error("[FixMyPrompt] Error getting context for API:", error);
            return null;
        }
    }

    /**
     * Get full context (for debugging/display)
     */
    getFullContext() {
        return this.currentContext || this.loadContextFromStorage();
    }

    /**
     * Add recent messages to context for persistence (v0.2.3 fix)
     * Ensures conversation history is maintained AND prompts are accumulated
     */
    addRecentMessagesToContext(messages) {
        try {
            let context = this.currentContext || this.loadContextFromStorage();
            
            if (!context) {
                return;
            }
            
            if (!context.conversationHistory) {
                context.conversationHistory = [];
            }
            
            // Add messages to conversation history
            context.conversationHistory.push(...messages);
            
            // Keep only last 30 messages to avoid huge storage
            context.conversationHistory = context.conversationHistory.slice(-30);
            
            // CRITICAL FIX (v0.2.3): Extract user prompts and add to previousPrompts
            // This ensures context accumulation works properly
            messages.forEach(msg => {
                if (msg.role === 'user' && msg.content) {
                    const userPrompt = msg.content.trim();
                    
                    // Check if this prompt is already in previousPrompts
                    const isDuplicate = context.previousPrompts.some(p => p.original === userPrompt);
                    
                    if (!isDuplicate && userPrompt.length > 10) {
                        // Add to previousPrompts for backend context
                        context.previousPrompts.push({
                            original: userPrompt,
                            timestamp: new Date().toISOString()
                        });
                        console.log(`[FixMyPrompt] Added prompt to previousPrompts: "${userPrompt.substring(0, 50)}..."`);
                    }
                }
            });
            
            // Keep previousPrompts to reasonable size (last 10)
            if (context.previousPrompts.length > 10) {
                context.previousPrompts = context.previousPrompts.slice(-10);
            }
            
            // Save to storage
            this.saveContextToStorage(context);
            this.currentContext = context;
            
            console.log(`[FixMyPrompt] Context updated - Total prompts: ${context.previousPrompts.length}, Messages: ${messages.length}`);
        } catch (error) {
            console.error("[FixMyPrompt] Error adding recent messages to context:", error);
        }
    }

    /**
     * Add question to the list of asked questions
     * Prevents asking same questions twice
     */
    addAskedQuestion(question) {
        try {
            let context = this.currentContext || this.loadContextFromStorage();
            
            if (!context) {
                return;
            }
            
            if (!context.questionsAsked) {
                context.questionsAsked = [];
            }
            
            if (!context.questionsAsked.includes(question)) {
                context.questionsAsked.push(question);
                this.saveContextToStorage(context);
                this.currentContext = context;
            }
        } catch (error) {
            console.error("[FixMyPrompt] Error adding asked question:", error);
        }
    }

    /**
     * Clear context for current conversation
     */
    clearContext() {
        try {
            const storageKey = this.getStorageKey();
            localStorage.removeItem(storageKey);
            this.currentContext = null;
            console.log("[FixMyPrompt] Context cleared");
            return true;
        } catch (error) {
            console.error("[FixMyPrompt] Error clearing context:", error);
            return false;
        }
    }

    /**
     * Clear all expired contexts
     * Should be called periodically
     */
    clearExpiredContexts() {
        try {
            const now = Date.now();
            let cleared = 0;
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                if (key && key.startsWith(CONTEXT.STORAGE_KEY)) {
                    try {
                        const stored = localStorage.getItem(key);
                        const context = JSON.parse(stored);
                        
                        if (context.expiresAt && context.expiresAt < now) {
                            localStorage.removeItem(key);
                            cleared++;
                        }
                    } catch (e) {
                        // Skip malformed entries
                    }
                }
            }
            
            if (cleared > 0) {
                console.log(`[FixMyPrompt] Cleared ${cleared} expired contexts`);
            }
            
            return cleared;
        } catch (error) {
            console.error("[FixMyPrompt] Error clearing expired contexts:", error);
            return 0;
        }
    }

    /**
     * Reset context (for new conversation)
     */
    resetContext() {
        this.conversationId = null;
        this.currentContext = null;
        this.contextCache.clear();
        console.log("[FixMyPrompt] Context reset");
    }
}

// Export singleton instance
export const contextManager = new ContextManager();

// Clear expired contexts on load
contextManager.clearExpiredContexts();
