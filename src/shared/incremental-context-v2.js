/**
 * Incremental Context Manager v2
 * Handles prompt capture, storage, and context building for the FixMyPrompt extension
 * 
 * Flow:
 * 1. Every prompt is captured and stored in localStorage
 * 2. On improve click, retrieve all prompts + last improvement + last 10 messages
 * 3. Send to backend with full context
 * 4. Store the new improvement as baseline for next improve
 */

class IncrementalContextManager {
  constructor() {
    this.conversationId = this.generateConversationId();
    this.currentContext = this.loadContext();
    this.setupPromptCapture();
  }

  generateConversationId() {
    // Extract conversation ID from ChatGPT URL
    // URL format: https://chatgpt.com/c/[conversation-id]
    const url = window.location.href;
    const match = url.match(/\/c\/([a-z0-9-]+)/i);
    
    if (match && match[1]) {
      const chatgptConvId = match[1];
      console.log('[EXT] FixMyPrompt Extracted ChatGPT conversation ID from URL:', chatgptConvId);
      return `chatgpt-${chatgptConvId}`;
    }
    
    // Fallback: Generate random ID if not on ChatGPT conversation page
    console.log('[EXT] FixMyPrompt Not on ChatGPT conversation page, generating random ID');
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  loadContext() {
    const key = `fixmyprompt_context_${this.conversationId}`;
    const stored = localStorage.getItem(key);
    
    if (stored) {
      console.log('[EXT] FixMyPrompt Loaded existing context from localStorage');
      return JSON.parse(stored);
    }

    console.log('[EXT] FixMyPrompt Creating new context session');
    return {
      conversationId: this.conversationId,
      initialPrompt: null,
      initialDomain: null,
      prompts: [],
      lastImprovement: null,
      conversationHistory: [],
      createdAt: Date.now()
    };
  }

  saveContext() {
    const key = `fixmyprompt_context_${this.conversationId}`;
    localStorage.setItem(key, JSON.stringify(this.currentContext));
    console.log('[EXT] FixMyPrompt Context saved to localStorage');
  }

  /**
   * Add a new prompt to the context
   * Called every time user types and sends a message
   */
  addPrompt(promptText) {
    console.log('[FixMyPrompt DEBUG] addPrompt() called');
    console.log('[FixMyPrompt DEBUG] Prompt text:', promptText.substring(0, 50) + '...');
    console.log('[FixMyPrompt DEBUG] Current prompts count:', this.currentContext.prompts.length);
    
    if (!promptText || promptText.trim().length === 0) {
      console.log('[FixMyPrompt DEBUG] Empty prompt, skipping');
      return;
    }

    // Set initial prompt and domain on first prompt
    if (this.currentContext.prompts.length === 0) {
      this.currentContext.initialPrompt = promptText;
      console.log('[FixMyPrompt DEBUG] Initial prompt set:', promptText);
    }

    // Add prompt to array
    const prompt = {
      text: promptText,
      timestamp: Date.now(),
      order: this.currentContext.prompts.length + 1
    };

    this.currentContext.prompts.push(prompt);
    console.log('[FixMyPrompt DEBUG] Prompt added to array');
    console.log('[FixMyPrompt DEBUG] Prompt object - text length:', prompt.text.length, 'timestamp:', prompt.timestamp, 'order:', prompt.order);
    console.log('[FixMyPrompt DEBUG] Total prompts after add:', this.currentContext.prompts.length);
    console.log('[FixMyPrompt DEBUG] All prompts:', this.currentContext.prompts.map(p => p.text.substring(0, 30)));

    this.saveContext();
    console.log('[FixMyPrompt DEBUG] Context saved to localStorage');
  }

  /**
   * Wrapper method: Add prompt to context with domain
   * Called from button.js when improve is clicked
   */
  addPromptToContext(promptText, domain) {
    console.log('[FixMyPrompt DEBUG] addPromptToContext() wrapper called');
    console.log('[FixMyPrompt DEBUG] Prompt:', promptText.substring(0, 50) + '...');
    console.log('[FixMyPrompt DEBUG] Domain:', domain);
    
    // Add the prompt
    this.addPrompt(promptText);
    
    // Set domain if not already set
    if (!this.currentContext.initialDomain) {
      this.setInitialDomain(domain);
    }
    
    console.log('[FixMyPrompt DEBUG] addPromptToContext() completed');
  }

  /**
   * Set the initial domain (detected by frontend)
   */
  setInitialDomain(domain) {
    this.currentContext.initialDomain = domain;
    console.log('[EXT] FixMyPrompt Initial domain set:', domain);
    this.saveContext();
  }

  /**
   * Update conversation history (last 10 messages from ChatGPT)
   */
  updateConversationHistory(messages) {
    this.currentContext.conversationHistory = messages;
    console.log('[EXT] FixMyPrompt Conversation history updated with', messages.length, 'messages');
    this.saveContext();
  }

  /**
   * Store the improvement result as baseline for next improve
   */
  storeImprovement(improvementResult) {
    this.currentContext.lastImprovement = {
      ...improvementResult,
      timestamp: Date.now()
    };
    console.log('[EXT] FixMyPrompt Improvement stored as baseline context');
    this.saveContext();
  }

  /**
   * Get last N prompts (default 10)
   */
  getLastPrompts(count = 10) {
    const prompts = this.currentContext.prompts.slice(-count);
    console.log(`[EXT] FixMyPrompt Retrieved last ${prompts.length} prompts`);
    return prompts;
  }

  /**
   * Build the context object to send to backend
   * Called when improve button is clicked
   */
  buildContextForAPI(currentPrompt, currentDomain) {
    console.log('[FixMyPrompt DEBUG] buildContextForAPI() called');
    console.log('[FixMyPrompt DEBUG] Current prompt:', currentPrompt.substring(0, 50) + '...');
    console.log('[FixMyPrompt DEBUG] Current domain:', currentDomain);
    
    // Get all stored prompts
    const allStoredPrompts = this.currentContext.prompts || [];
    console.log('[FixMyPrompt DEBUG] All stored prompts count:', allStoredPrompts.length);
    console.log('[FixMyPrompt DEBUG] All stored prompts:', allStoredPrompts.map(p => p.text.substring(0, 30)));
    
    // Filter out the current prompt and get last 10 previous prompts
    const previousPrompts = allStoredPrompts
      .filter(p => p.text !== currentPrompt)
      .slice(-10)
      .map(p => ({
        original: p.text,
        domain: this.currentContext.initialDomain
      }));

    console.log('[FixMyPrompt DEBUG] Previous prompts after filtering:', previousPrompts.length);
    console.log('[FixMyPrompt DEBUG] Previous prompts:', previousPrompts.map(p => p.original.substring(0, 30)));

    const contextObject = {
      prompt: currentPrompt,
      domain: currentDomain,
      context: {
        previousPrompts: previousPrompts,
        conversationHistory: this.currentContext.conversationHistory,
        conversationTopic: this.currentContext.initialPrompt,
        lastImprovement: this.currentContext.lastImprovement
      }
    };

    console.log('[FixMyPrompt DEBUG] Context object built:');
    console.log('[FixMyPrompt DEBUG]   - Current prompt:', currentPrompt.substring(0, 50));
    console.log('[FixMyPrompt DEBUG]   - Previous prompts:', previousPrompts.length);
    console.log('[FixMyPrompt DEBUG]   - Conversation history:', this.currentContext.conversationHistory.length, 'messages');
    console.log('[FixMyPrompt DEBUG]   - Last improvement:', this.currentContext.lastImprovement ? 'Yes' : 'No');
    console.log('[FixMyPrompt DEBUG]   - Domain:', this.currentContext.initialDomain);
    console.log('[FixMyPrompt DEBUG] Full context object keys:', Object.keys(contextObject));
    console.log('[FixMyPrompt DEBUG] Context.context keys:', Object.keys(contextObject.context));

    return contextObject;
  }

  /**
   * Setup prompt capture using MutationObserver
   * Detects when new messages are added to the conversation
   */
  setupPromptCapture() {
    // Wait for the chat container to be available
    const checkForChat = setInterval(() => {
      const chatContainer = document.querySelector('[data-testid="conversation-container"]') ||
                           document.querySelector('.react-scroll-to-bottom') ||
                           document.querySelector('[role="main"]');

      if (chatContainer) {
        clearInterval(checkForChat);
        this.observeNewMessages(chatContainer);
        console.log('[EXT] FixMyPrompt Prompt capture observer initialized');
      }
    }, 1000);
  }

  /**
   * Observe the chat container for new user messages
   */
  observeNewMessages(container) {
    const observer = new MutationObserver(() => {
      this.detectNewPrompt();
    });

    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  /**
   * Detect and capture new user prompts
   * Debounced to avoid duplicates
   */
  detectNewPrompt() {
    clearTimeout(this.promptDetectionTimeout);
    
    this.promptDetectionTimeout = setTimeout(() => {
      // Find all user message elements
      const userMessages = document.querySelectorAll('[data-message-author-role="user"]');
      
      if (userMessages.length === 0) return;

      // Get the last user message
      const lastMessage = userMessages[userMessages.length - 1];
      const messageText = lastMessage.textContent?.trim();

      if (!messageText) return;

      // Check if this prompt is already stored
      const lastStoredPrompt = this.currentContext.prompts[this.currentContext.prompts.length - 1];
      
      if (lastStoredPrompt && lastStoredPrompt.text === messageText) {
        console.log('[EXT] FixMyPrompt Prompt already stored, skipping duplicate');
        return;
      }

      // Add the new prompt
      this.addPrompt(messageText);
    }, 1000); // 1 second debounce to avoid rapid captures
  }

  /**
   * Get all context data for debugging
   */
  getDebugInfo() {
    return {
      conversationId: this.currentContext.conversationId,
      totalPrompts: this.currentContext.prompts.length,
      initialDomain: this.currentContext.initialDomain,
      prompts: this.currentContext.prompts,
      lastImprovement: this.currentContext.lastImprovement,
      conversationHistoryCount: this.currentContext.conversationHistory.length
    };
  }
}

// Export singleton instance
export const incrementalContextManager = new IncrementalContextManager();

// Also export the class for testing
export default IncrementalContextManager;
