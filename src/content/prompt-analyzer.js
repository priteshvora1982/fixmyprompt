/**
 * FixMyPrompt - PromptAnalyzer Module
 * Hybrid analysis orchestrator combining local + backend analysis
 * Implements all 7 safeguards for robust operation
 */

import { GapFinder } from "../shared/gap-finder.js";
import { PromptScorer } from "../shared/prompt-scorer.js";
import { SuggestionFormatter } from "../shared/suggestion-formatter.js";
import { BackendAnalyzer } from "./backend-analyzer.js";
import { domainDetector } from "../shared/domain-detector.js";

class PromptAnalyzer {
    constructor(options = {}) {
        // Import analysis components
        try {
            this.gapFinder = new GapFinder();
        } catch (e) {
            console.error('[PromptAnalyzer] Failed to initialize GapFinder:', e.message);
            this.gapFinder = null;
        }
        
        try {
            this.promptScorer = new PromptScorer();
        } catch (e) {
            console.error('[PromptAnalyzer] Failed to initialize PromptScorer:', e.message);
            this.promptScorer = null;
        }
        
        try {
            this.suggestionFormatter = new SuggestionFormatter();
        } catch (e) {
            console.error('[PromptAnalyzer] Failed to initialize DownsideGenerator:', e.message);
            this.suggestionFormatter = null;
        }
        
        // DomainDetector is a singleton instance, not a class
        try {
            this.domainDetector = domainDetector;
            if (!this.domainDetector) {
                console.error('[PromptAnalyzer] DomainDetector instance not available');
            }
        } catch (e) {
            console.error('[PromptAnalyzer] Failed to access DomainDetector:', e.message);
            this.domainDetector = null;
        }
        
        try {
            this.backendAnalyzer = new BackendAnalyzer(options.backendConfig || {});
        } catch (e) {
            console.error('[PromptAnalyzer] Failed to initialize BackendAnalyzer:', e.message);
            this.backendAnalyzer = null;
        }

        // Safeguard 1: Debouncing
        this.lastAnalysisTime = 0;
        this.minAnalysisInterval = options.minAnalysisInterval || 2000; // 2 seconds

        // Safeguard 2: Deduplication
        this.lastAnalyzedText = '';

        // Safeguard 3: Timeout
        this.analysisTimeout = options.analysisTimeout || 5000; // 5 seconds

        // Safeguard 4: Cancel on button click
        this.currentAnalysisPromise = null;
        this.currentAnalysisAbortController = null;

        // Safeguard 5: "Analyzing..." indicator
        this.isAnalyzing = false;

        // Safeguard 6: Comprehensive logging
        this.enableDetailedLogging = options.enableDetailedLogging !== false;

        // Safeguard 7: Graceful error handling
        this.fallbackToLocal = options.fallbackToLocal !== false;

        // Event listeners
        this.listeners = {
            onAnalysisStart: [],
            onAnalysisComplete: [],
            onAnalysisError: [],
            onAnalysisUpdate: []
        };

        this.log('[PromptAnalyzer] Initialized with all 7 safeguards');
    }

    /**
     * Main hybrid analysis method
     * Runs local analysis immediately, backend analysis in parallel
     * @param {string} prompt - The user's prompt
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeHybrid(prompt) {
        // Safeguard 1: Debouncing - skip if analyzed recently
        if (Date.now() - this.lastAnalysisTime < this.minAnalysisInterval) {
            this.log('[PromptAnalyzer] Skipping analysis - analyzed too recently');
            return null;
        }

        // Safeguard 2: Deduplication - skip if same text
        if (prompt === this.lastAnalyzedText) {
            this.log('[PromptAnalyzer] Skipping analysis - same text as last analysis');
            return null;
        }

        // Safeguard 5: Check if already analyzing
        if (this.isAnalyzing) {
            this.log('[PromptAnalyzer] Skipping analysis - already analyzing');
            return null;
        }

        // Validate input
        if (!prompt || prompt.length < 10) {
            this.log('[PromptAnalyzer] Skipping analysis - prompt too short');
            return null;
        }

        // Emit start event
        this.emit('onAnalysisStart', { prompt });

        try {
            this.isAnalyzing = true;
            this.lastAnalysisTime = Date.now();
            this.lastAnalyzedText = prompt;

            // Safeguard 3: Wrap in timeout
            const analysisPromise = this.performHybridAnalysis(prompt);
            this.currentAnalysisPromise = analysisPromise;

            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Analysis timeout')), this.analysisTimeout)
            );

            const result = await Promise.race([analysisPromise, timeoutPromise]);

            this.log('[PromptAnalyzer] Analysis complete', { score: result.score, source: result.source });
            this.emit('onAnalysisComplete', result);

            return result;
        } catch (error) {
            this.log('[PromptAnalyzer] Analysis error:', error.message, 'error');
            this.emit('onAnalysisError', { error: error.message });

            // Safeguard 7: Graceful error handling
            if (this.fallbackToLocal) {
                this.log('[PromptAnalyzer] Falling back to local analysis');
                return this.performLocalAnalysis(prompt);
            }

            return null;
        } finally {
            this.isAnalyzing = false;
            this.currentAnalysisPromise = null;
        }
    }

    /**
     * Perform hybrid analysis (local + backend)
     * @param {string} prompt - The prompt
     * @returns {Promise<Object>} Final analysis result
     */
    async performHybridAnalysis(prompt) {
        // Phase 1: Local analysis (immediate)
        const localAnalysis = this.performLocalAnalysis(prompt);
        this.log('[PromptAnalyzer] Local analysis complete', { score: localAnalysis.score });
        this.emit('onAnalysisUpdate', { analysis: localAnalysis, phase: 'local' });

        // Phase 2: Backend analysis (parallel, 500ms)
        const backendPromise = this.performBackendAnalysis(prompt);

        // Wait for backend with timeout
        try {
            const backendAnalysis = await Promise.race([
                backendPromise,
                new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Backend timeout')), 500)
                )
            ]);

            this.log('[PromptAnalyzer] Backend analysis complete', { score: backendAnalysis.score });

            // Phase 3: Compare and select best analysis
            const finalAnalysis = this.selectBestAnalysis(localAnalysis, backendAnalysis);
            this.log('[PromptAnalyzer] Selected analysis source:', finalAnalysis.source);
            this.emit('onAnalysisUpdate', { analysis: finalAnalysis, phase: 'backend' });

            return finalAnalysis;
        } catch (error) {
            this.log('[PromptAnalyzer] Backend analysis failed, keeping local:', error.message);
            return localAnalysis;
        }
    }

    /**
     * Perform local analysis only
     * @param {string} prompt - The prompt
     * @returns {Object} Local analysis result
     */
    performLocalAnalysis(prompt) {
        const domain = this.domainDetector.detectDomain(prompt);
        const gaps = this.gapFinder.findGaps(prompt, domain);
        const score = this.promptScorer.calculateScore(prompt, gaps, domain);
        const suggestions = {
            balloon: gaps.map(gap => this.suggestionFormatter.formatForBalloon(gap)),
            modal: this.suggestionFormatter.formatAllForModal(gaps)
        };

        return {
            domain,
            score,
            gaps, // Array of gap objects
            suggestions,
            confidence: 0.65,
            source: 'local',
            timestamp: Date.now()
        };
    }

    /**
     * Perform backend analysis
     * @param {string} prompt - The prompt
     * @returns {Promise<Object>} Backend analysis result
     */
    async performBackendAnalysis(prompt) {
        try {
            return await this.backendAnalyzer.analyze(prompt);
        } catch (error) {
            this.log('[PromptAnalyzer] Backend analysis error:', error.message);
            throw error;
        }
    }

    /**
     * Select best analysis based on score difference
     * @param {Object} localAnalysis - Local analysis result
     * @param {Object} backendAnalysis - Backend analysis result
     * @returns {Object} Selected analysis
     */
    selectBestAnalysis(localAnalysis, backendAnalysis) {
        const scoreDifference = Math.abs(backendAnalysis.score - localAnalysis.score);
        const domainDifference = backendAnalysis.domain !== localAnalysis.domain;

        // Use backend if score differs by > 2 points or domain is different
        if (scoreDifference > 2 || domainDifference) {
            this.log('[PromptAnalyzer] Using backend analysis (score diff:', scoreDifference + ')');
            return {
                ...backendAnalysis,
                localScore: localAnalysis.score,
                scoreDifference
            };
        }

        // Use local if similar
        this.log('[PromptAnalyzer] Using local analysis (score diff:', scoreDifference + ')');
        return {
            ...localAnalysis,
            backendScore: backendAnalysis.score,
            scoreDifference
        };
    }

    /**
     * Cancel current analysis (Safeguard 4)
     */
    cancelCurrentAnalysis() {
        if (this.currentAnalysisPromise) {
            this.log('[PromptAnalyzer] Canceling current analysis');
            if (this.currentAnalysisAbortController) {
                this.currentAnalysisAbortController.abort();
            }
            this.currentAnalysisPromise = null;
            this.isAnalyzing = false;
        }
    }

    /**
     * Register event listener
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    on(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * Emit event
     * @param {string} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    this.log('[PromptAnalyzer] Event listener error:', error.message, 'error');
                }
            });
        }
    }

    /**
     * Comprehensive logging (Safeguard 6)
     * @param {string} message - Log message
     * @param {Object} data - Additional data
     * @param {string} level - Log level (log, warn, error)
     */
    log(message, data = {}, level = 'log') {
        if (!this.enableDetailedLogging) return;

        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;

        if (level === 'error') {
            console.error(logMessage, data);
        } else if (level === 'warn') {
            console.warn(logMessage, data);
        } else {
            console.log(logMessage, data);
        }
    }

    /**
     * Set minimum analysis interval (Safeguard 1)
     * @param {number} ms - Milliseconds
     */
    setMinAnalysisInterval(ms) {
        this.minAnalysisInterval = ms;
        this.log('[PromptAnalyzer] Min analysis interval updated to:', ms + 'ms');
    }

    /**
     * Set analysis timeout (Safeguard 3)
     * @param {number} ms - Milliseconds
     */
    setAnalysisTimeout(ms) {
        this.analysisTimeout = ms;
        this.log('[PromptAnalyzer] Analysis timeout updated to:', ms + 'ms');
    }

    /**
     * Get analysis statistics
     * @returns {Object} Statistics
     */
    getStats() {
        return {
            lastAnalysisTime: this.lastAnalysisTime,
            isAnalyzing: this.isAnalyzing,
            minAnalysisInterval: this.minAnalysisInterval,
            analysisTimeout: this.analysisTimeout
        };
    }
}
// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptAnalyzer;
}

// Make available globally for bundled scripts
if (typeof window !== 'undefined') {
    window.PromptAnalyzer = PromptAnalyzer;
}

export { PromptAnalyzer };
