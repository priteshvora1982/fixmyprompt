/**
 * Backend API Wrapper (Phase 6 - Incremental Testing)
 * Handles all communication with FixMyPrompt backend
 * Includes error handling, fallback logic, and retry mechanism
 */

const BACKEND_URL = "https://web-production-b82f2.up.railway.app";
const TIMEOUT = 8000; // 8 second timeout
const MAX_RETRIES = 2;

class BackendAPI {
  constructor() {
    this.isOnline = true;
    this.failureCount = 0;
    this.maxFailures = 5; // Fallback after 5 consecutive failures
  }

  /**
   * Generic API call with error handling and retry logic
   */
  async call(endpoint, data, retries = 0) {
    try {
      // If backend is offline, skip to fallback
      if (!this.isOnline && this.failureCount >= this.maxFailures) {
        console.log(`[BackendAPI] Backend offline, using fallback for ${endpoint}`);
        return null;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Reset failure count on success
      this.failureCount = 0;
      this.isOnline = true;

      return result;
    } catch (error) {
      this.failureCount++;
      console.error(`[BackendAPI] Error calling ${endpoint}:`, error.message);

      // Retry logic
      if (retries < MAX_RETRIES) {
        console.log(`[BackendAPI] Retrying ${endpoint} (${retries + 1}/${MAX_RETRIES})...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        return this.call(endpoint, data, retries + 1);
      }

      // Mark backend as offline after max failures
      if (this.failureCount >= this.maxFailures) {
        this.isOnline = false;
        console.warn(`[BackendAPI] Backend appears to be offline, using fallback logic`);
      }

      return null;
    }
  }

  /**
   * Detect domain of prompt
   * Fallback: Uses local domain detector
   */
  async detectDomain(prompt) {
    console.log(`[BackendAPI] Calling /api/detect-domain for prompt: "${prompt.substring(0, 50)}..."`);

    const data = { prompt };
    const result = await this.call("/api/detect-domain", data);

    if (result && result.success && result.domain) {
      console.log(`[BackendAPI] Domain detected: ${result.domain}`);
      return {
        domain: result.domain,
        confidence: result.confidence || 0,
        source: "backend"
      };
    }

    console.log(`[BackendAPI] Domain detection failed, will use local fallback`);
    return null;
  }

  /**
   * Generate refinement questions
   * Fallback: Uses local question generator
   */
  async generateQuestions(prompt, domain) {
    console.log(`[BackendAPI] Calling /api/generate-questions for domain: ${domain}, prompt: "${prompt.substring(0, 60)}..."`);

    // Send full prompt text as both 'prompt' and 'context' so backend generates
    // contextually relevant questions, not generic domain-level questions
    const data = { prompt, domain, context: prompt };
    const result = await this.call("/api/generate-questions", data);

    if (result && result.success && result.questions) {
      console.log(`[BackendAPI] Generated ${result.questions.length} questions`);
      return {
        questions: result.questions,
        source: "backend"
      };
    }

    console.log(`[BackendAPI] Question generation failed, will use local fallback`);
    return null;
  }

  /**
   * Improve prompt with optional refinement answers
   * Fallback: Uses local improvement logic
   * 
   * IMPORTANT: Backend returns score as single number, but extension expects { before, after }
   * This wrapper converts the format
   */
  async improvePrompt(prompt, platform = "chatgpt", domain = null, context = null, refinementAnswers = null) {
    console.log(`[BackendAPI] Calling /api/improve-prompt`);

    const data = {
      prompt,
      platform,
      domain,
      context,
      refinementAnswers
    };

    const result = await this.call("/api/improve-prompt", data);

    console.log(`[BackendAPI] Backend response:`, {
      success: result?.success,
      hasImproved: !!result?.improved,
      score: result?.score,
      hasQuestions: !!result?.questions,
      timestamp: result?.timestamp
    });

    if (result && result.success && result.improved) {
      console.log(`[BackendAPI] Prompt improved successfully`);
      console.log(`[BackendAPI] Backend score object:`, result.score);
      
      // Handle score format from backend
      // Backend calculatePromptScore returns 0-100; normalize to 0-10 to match
      // MockBackendAnalyzer scale used everywhere else in the extension.
      let scoreObj = { before: 0, after: 0, improvement: 0 };

      const normalize = (n) => parseFloat((Math.min(n, 100) / 10).toFixed(1));

      if (result.score && typeof result.score === 'object') {
        // Backend returns { before, after, improvement } on 0-100 scale
        const before = normalize(result.score.before || 0);
        const after  = normalize(result.score.after  || 0);
        scoreObj = { before, after, improvement: parseFloat((after - before).toFixed(1)) };
        console.log(`[BackendAPI] Normalized score (0-10):`, scoreObj);
      } else if (result.score && typeof result.score === 'number') {
        // Legacy: single number on 0-100 scale
        const after  = normalize(result.score);
        const before = parseFloat(Math.max(0.1, after - 0.3).toFixed(1));
        scoreObj = { before, after, improvement: parseFloat((after - before).toFixed(1)) };
        console.log(`[BackendAPI] Normalized legacy score (0-10):`, scoreObj);
      }

      console.log(`[BackendAPI] Final score object sent to extension:`, scoreObj);
      
      return {
        improved: result.improved,
        score: scoreObj,
        timestamp: result.timestamp,
        questions: result.questions || [],
        source: "backend"
      };
    }

    // Fallback to local improvement logic
    console.log(`[BackendAPI] Falling back to local improvement logic`);
    return null;
  }

  /**
   * Save context for conversation
   */
  async saveContext(conversationId, context) {
    console.log(`[BackendAPI] Saving context for conversation: ${conversationId}`);

    const result = await this.call("/api/context", { conversationId, context });

    if (result && result.success) {
      console.log(`[BackendAPI] Context saved successfully`);
      return true;
    }

    console.warn(`[BackendAPI] Failed to save context`);
    return false;
  }

  /**
   * Retrieve context for conversation
   */
  async getContext(conversationId) {
    console.log(`[BackendAPI] Retrieving context for conversation: ${conversationId}`);

    const result = await this.call("/api/context", {});

    if (result && result.success && result.found) {
      console.log(`[BackendAPI] Context retrieved successfully`);
      return result.context;
    }

    console.log(`[BackendAPI] Context not found or backend unavailable`);
    return null;
  }

  /**
   * Check backend health
   */
  async healthCheck() {
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: "GET",
        timeout: 5000
      });
      this.isOnline = response.ok;
      return this.isOnline;
    } catch (error) {
      this.isOnline = false;
      return false;
    }
  }
}

// Export singleton instance
const backendAPI = new BackendAPI();

if (typeof module !== "undefined" && module.exports) {
  module.exports = backendAPI;
}

export default backendAPI;
