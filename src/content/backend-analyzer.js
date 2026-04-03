/**
 * FixMyPrompt - BackendAnalyzer Module
 * Communicates with backend API for LLM-based analysis
 * Runs in parallel with local analysis for verification and refinement
 */

class BackendAnalyzer {
    constructor(options = {}) {
        this.apiEndpoint = options.apiEndpoint || '/api/v1/analyze-prompt';
        this.timeout = options.timeout || 5000;
        this.maxRetries = options.maxRetries || 2;
        console.log('[BackendAnalyzer] Initialized with endpoint:', this.apiEndpoint);
    }

    /**
     * Analyze prompt using backend API
     * @param {string} prompt - The user's prompt
     * @returns {Promise<Object>} Analysis result from backend
     */
    async analyze(prompt) {
        if (!prompt || prompt.length === 0) {
            throw new Error('Prompt is empty');
        }

        console.log('[BackendAnalyzer] Sending prompt for analysis (length:', prompt.length + ')');

        try {
            const response = await this.sendRequest({
                prompt,
                mode: 'real-time' // Lighter analysis than full improvement
            });

            console.log('[BackendAnalyzer] Received response from backend');

            return {
                domain: response.domain || 'general',
                score: response.score || 5,
                gaps: response.gaps || [],
                downsides: response.downsides || [],
                confidence: response.confidence || 0.9,
                source: 'backend',
                timestamp: Date.now()
            };
        } catch (error) {
            console.error('[BackendAnalyzer] Analysis failed:', error.message);
            throw error;
        }
    }

    /**
     * Send request to backend API with retry logic
     * @param {Object} data - Request payload
     * @returns {Promise<Object>} Response from backend
     */
    async sendRequest(data, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-FixMyPrompt-Version': '0.1.0'
                },
                body: JSON.stringify(data),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                if (response.status === 429) {
                    // Rate limited
                    throw new Error('Backend rate limited (429)');
                } else if (response.status >= 500) {
                    // Server error - retry
                    if (retryCount < this.maxRetries) {
                        console.log('[BackendAnalyzer] Server error, retrying... (attempt', retryCount + 2 + ')');
                        await this.delay(1000 * (retryCount + 1)); // Exponential backoff
                        return this.sendRequest(data, retryCount + 1);
                    }
                    throw new Error(`Backend server error (${response.status})`);
                } else {
                    throw new Error(`API error: ${response.status} ${response.statusText}`);
                }
            }

            const result = await response.json();
            return result;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Backend analysis timeout');
            }
            throw error;
        }
    }

    /**
     * Delay helper for retry logic
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Check if backend is available (optional health check)
     * @returns {Promise<boolean>} True if backend is available
     */
    async isAvailable() {
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'OPTIONS',
                timeout: 2000
            });
            return response.ok;
        } catch (error) {
            console.warn('[BackendAnalyzer] Backend health check failed:', error.message);
            return false;
        }
    }

    /**
     * Set API endpoint
     * @param {string} endpoint - New API endpoint
     */
    setEndpoint(endpoint) {
        this.apiEndpoint = endpoint;
        console.log('[BackendAnalyzer] Endpoint updated to:', endpoint);
    }

    /**
     * Set timeout
     * @param {number} ms - Timeout in milliseconds
     */
    setTimeout(ms) {
        this.timeout = ms;
        console.log('[BackendAnalyzer] Timeout updated to:', ms + 'ms');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BackendAnalyzer;
}

// Make available globally for bundled scripts
if (typeof window !== 'undefined') {
    window.BackendAnalyzer = BackendAnalyzer;
}

export { BackendAnalyzer };
