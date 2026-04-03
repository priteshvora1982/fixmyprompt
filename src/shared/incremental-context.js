/**
 * FixMyPrompt - Incremental Context Manager (v0.3.0)
 * Manages incremental context accumulation for multi-prompt conversations
 * 
 * Features:
 * - Auto-captures all prompts without requiring improve button click
 * - Stores incremental context in localStorage
 * - Maintains conversation history and improvements
 * - Provides full context on improve click
 * - Fixed domain for entire session (determined by first prompt)
 */

import { CONTEXT, API } from "./constants.js";

class IncrementalContextManager {
    constructor() {
        this.contextCache = new Map();
        this.conversationId = null;
        this.currentContext = null;
        this.monitoringActive = false;
    }

    /**
     * Extract conversation ID from the current page
     */
    extractConversationId() {
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
            console.log('[FixMyPrompt] Conversation ID:', this.conversationId);
        }
        return this.conversationId;
    }

    /**
     * Generate localStorage key for context
     */
    getStorageKey() {
        const conversationId = this.getConversationId();
        return `${CONTEXT.STORAGE_KEY}_incremental_${conversationId}`;
    }

    /**
     * Initialize or retrieve existing context
     */
    initializeContext() {
        const storageKey = this.getStorageKey();
        const stored = localStorage.getItem(storageKey);
        
        if (stored) {
            try {
                this.currentContext = JSON.parse(stored);
                console.log('[FixMyPrompt] Loaded existing context:', this.currentContext.prompts.length, 'prompts');
                return this.currentContext;
            } catch (error) {
                console.error('[FixMyPrompt] Error parsing stored context:', error);
            }
        }
        
        // Create new context
        this.currentContext = {
            conversationId: this.getConversationId(),
            initialPrompt: null,
            initialDomain: null,
            initialTimestamp: null,
            prompts: [],
            improvements: [],
            lastConversationHistory: [],
            lastUpdated: Date.now(),
            improveCount: 0
        };
        
        console.log('[FixMyPrompt] Initialized new context');
        return this.currentContext;
    }

    /**
     * Save context to localStorage
     */
    saveContext() {
        try {
            const storageKey = this.getStorageKey();
            this.currentContext.lastUpdated = Date.now();
            localStorage.setItem(storageKey, JSON.stringify(this.currentContext));
            console.log('[FixMyPrompt] Context saved to localStorage');
        } catch (error) {
            console.error('[FixMyPrompt] Error saving context:', error);
        }
    }

    /**
     * Add a new prompt to context (auto-capture)
     * @param {string} prompt - The prompt text
     * @param {string} domain - The detected domain
     */
    addPromptToContext(prompt, domain) {
        if (!this.currentContext) {
            this.initializeContext();
        }

        // Initialize on first prompt
        if (this.currentContext.prompts.length === 0) {
            this.currentContext.initialPrompt = prompt;
            this.currentContext.initialDomain = domain;
            this.currentContext.initialTimestamp = Date.now();
            console.log('[FixMyPrompt] Initial prompt set:', prompt.substring(0, 50) + '...');
            console.log('[FixMyPrompt] Initial domain:', domain);
        }

        // Add new prompt
        const promptEntry = {
            text: prompt,
            timestamp: Date.now(),
            order: this.currentContext.prompts.length + 1
        };

        this.currentContext.prompts.push(promptEntry);
        console.log('[FixMyPrompt] Prompt added to context - Total:', this.currentContext.prompts.length);
        console.log('[FixMyPrompt] Prompts:', this.currentContext.prompts.map(p => p.text.substring(0, 30) + '...'));

        this.saveContext();
    }

    /**
     * Add improvement result to context
     * @param {number} promptOrder - Which prompt was improved
     * @param {object} improvementData - Score, timestamp, etc.
     */
    addImprovementToContext(promptOrder, improvementData) {
        if (!this.currentContext) {
            this.initializeContext();
        }

        const improvement = {
            promptOrder: promptOrder,
            originalScore: improvementData.originalScore || 0,
            improvedScore: improvementData.improvedScore || 0,
            timestamp: Date.now(),
            refinementApplied: improvementData.isRefinement || false
        };

        this.currentContext.improvements.push(improvement);
        this.currentContext.improveCount += 1;
        
        console.log('[FixMyPrompt] Improvement added - Total improvements:', this.currentContext.improvements.length);
        
        this.saveContext();
    }

    /**
     * Update conversation history
     * @param {array} messages - Last 10 conversation messages
     */
    updateConversationHistory(messages) {
        if (!this.currentContext) {
            this.initializeContext();
        }

        this.currentContext.lastConversationHistory = messages || [];
        console.log('[FixMyPrompt] Conversation history updated:', messages.length, 'messages');
        
        this.saveContext();
    }

    /**
     * Get context for API call (incremental)
     * Returns current prompt + all previous prompts + domain + history
     */
    getContextForAPI(currentPrompt) {
        if (!this.currentContext) {
            this.initializeContext();
        }

        const previousPrompts = this.currentContext.prompts
            .slice(0, -1) // All except current
            .map(p => ({ 
                original: p.text, 
                domain: this.currentContext.initialDomain || 'general' 
            }));

        const context = {
            prompt: currentPrompt,
            domain: this.currentContext.initialDomain || 'general',
            previousPrompts: previousPrompts,
            improvements: this.currentContext.improvements,
            conversationHistory: this.currentContext.lastConversationHistory,
            conversationTopic: this.currentContext.initialPrompt,
            improveCount: this.currentContext.improveCount
        };

        console.log('[FixMyPrompt] Context for API:');
        console.log('  - Current prompt:', currentPrompt.substring(0, 50) + '...');
        console.log('  - Domain:', context.domain);
        console.log('  - Previous prompts:', previousPrompts.length);
        console.log('  - Improvements:', context.improvements.length);
        console.log('  - Conversation history:', context.conversationHistory.length, 'messages');

        return context;
    }

    /**
     * Clear context (for new conversation)
     */
    clearContext() {
        const storageKey = this.getStorageKey();
        localStorage.removeItem(storageKey);
        this.currentContext = null;
        this.conversationId = null;
        console.log('[FixMyPrompt] Context cleared');
    }

    /**
     * Get all stored contexts (for debugging)
     */
    getAllContexts() {
        const contexts = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(CONTEXT.STORAGE_KEY + '_incremental_')) {
                try {
                    contexts.push(JSON.parse(localStorage.getItem(key)));
                } catch (error) {
                    console.error('[FixMyPrompt] Error parsing context:', key, error);
                }
            }
        }
        return contexts;
    }
}

// Export singleton instance
export const incrementalContextManager = new IncrementalContextManager();

export default {
    incrementalContextManager
};
