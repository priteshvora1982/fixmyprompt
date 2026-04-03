/**
 * FixMyPrompt - Service Worker (Complete Implementation)
 * Includes retry logic, detailed scoring, validation, and comprehensive error handling
 */

import backendAPI from "../shared/backend-api.js";
// Change type definitions
const CHANGE_TYPES = {
    ADD_STRUCTURE: {
        id: "add_structure",
        name: "Add Structure",
        description: "Break prompt into clear sections (goal, context, constraints, output format)"
    },
    CLARIFY_GOAL: {
        id: "clarify_goal",
        name: "Clarify Goal/Outcome",
        description: "Make success criteria explicit and measurable"
    },
    INJECT_GUARDRAILS: {
        id: "inject_guardrails",
        name: "Inject Guardrails",
        description: "Add behavioral constraints to reduce hallucinations and improve reliability"
    },
    EXPERT_FRAMING: {
        id: "expert_framing",
        name: "Expert-Hat Framing",
        description: "Reframed from user perspective to expert practitioner perspective"
    }
};

// Scoring configuration
const SCORING_CONFIG = {
    dimensions: {
        clarity: { weight: 0.25, maxScore: 25 },
        structure: { weight: 0.25, maxScore: 25 },
        ambiguityReduction: { weight: 0.25, maxScore: 25 },
        halluccinationRisk: { weight: 0.25, maxScore: 25 }
    },
    minPromptLength: 10,
    maxPromptLength: 2000,
    vagueBadWords: [
        "good", "bad", "nice", "better", "worse", "great", "terrible",
        "something", "somehow", "some", "maybe", "perhaps", "probably",
        "try", "attempt", "see", "look", "check", "consider"
    ],
    guardrailKeywords: [
        "avoid", "ensure", "must", "should", "verify", "check", "confirm",
        "accurate", "reliable", "professional", "expert", "senior"
    ],
    structureIndicators: [
        "goal", "context", "constraint", "output", "format", "step",
        "section", "requirement", "criteria", "success", "objective"
    ]
};

// Backend configuration
const DEFAULT_BACKEND_URL = "https://web-production-b82f2.up.railway.app";
const STORAGE_KEY = "fixmyprompt_config";
const MAX_RETRIES = 2;
const API_TIMEOUT = 30000; // 30 seconds

// Session state
const state = {
    lastImprovement: null,
    sessionId: generateSessionId()
};

/**
 * Generate unique session ID
 */
function generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get backend URL from storage or use default
 */
async function getBackendURL() {
    return new Promise((resolve) => {
        try {
            chrome.storage.sync.get(STORAGE_KEY, (result) => {
                const config = result[STORAGE_KEY] || {};
                const url = config.backendURL || DEFAULT_BACKEND_URL;
                resolve(url);
            });
        } catch (error) {
            console.warn("[FixMyPrompt] Failed to get backend URL from storage, using default");
            resolve(DEFAULT_BACKEND_URL);
        }
    });
}

/**
 * Format error message for user display
 */
function formatErrorMessage(error) {
    if (!error) return "An unexpected error occurred. Please try again.";
    
    const message = (error.message || error.toString()).toLowerCase();
    
    if (message.includes("network") || message.includes("fetch")) {
        return "Network error. Please check your internet connection and try again.";
    }
    if (message.includes("timeout") || message.includes("abort")) {
        return "The server is taking too long to respond. Please try again.";
    }
    if (message.includes("401") || message.includes("unauthorized")) {
        return "Authentication error. Please check the API key configuration.";
    }
    if (message.includes("429") || message.includes("rate limit")) {
        return "Too many requests. Please wait a moment and try again.";
    }
    if (message.includes("500") || message.includes("internal server")) {
        return "Server error. Please try again in a moment.";
    }
    if (message.includes("503") || message.includes("unavailable")) {
        return "The service is temporarily unavailable. Please try again later.";
    }
    if (message.includes("empty") || message.includes("cannot be empty")) {
        return "Please enter a prompt before clicking Fix My Prompt.";
    }
    if (message.includes("too short")) {
        return "Your prompt is too short. Please write at least a few words.";
    }
    if (message.includes("too long") || message.includes("exceeds maximum")) {
        return "Your prompt is too long. Please keep it under 2000 characters.";
    }
    if (message.includes("identical to original")) {
        return "The improvement was too similar to the original. Please try a different prompt.";
    }
    
    return "Unable to improve your prompt. Please try again.";
}

/**
 * Log error with timestamp
 */
function logError(error, context) {
    if (typeof window === "undefined") {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [FixMyPrompt] ${context}:`, error);
    } else {
        console.error(`[FixMyPrompt] ${context}:`, error);
    }
}

/**
 * Determine if error is retryable
 */
function isRetryableError(error) {
    const message = (error?.message || "").toLowerCase();
    return (
        message.includes("timeout") ||
        message.includes("429") ||
        message.includes("503") ||
        message.includes("network") ||
        message.includes("econnrefused") ||
        message.includes("econnreset")
    );
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(attempt) {
    return Math.min(1000 * Math.pow(2, attempt - 1), 10000);
}

/**
 * Transform prompt with LLM (with retry logic)
 * @param {string} prompt - The prompt to improve
 * @param {string} platform - The platform (chatgpt or claude)
 * @param {number} attempt - Current attempt number
 * @param {Object} context - Accumulated context from previous prompts (optional)
 */
async function transformPromptWithLLM(prompt, platform = "chatgpt", attempt = 1, context = null) {
    const attemptId = `attempt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    console.log(`[FixMyPrompt] [${attemptId}] transformPromptWithLLM called`);
    console.log(`[FixMyPrompt] [${attemptId}] Attempt: ${attempt}/${MAX_RETRIES + 1}`);
    console.log(`[FixMyPrompt] [${attemptId}] Platform: ${platform}`);
    console.log(`[FixMyPrompt] [${attemptId}] Prompt length: ${prompt?.length || 0}`);
    
    if (!prompt || prompt.trim().length === 0) {
        console.error(`[FixMyPrompt] [${attemptId}] Error: Empty prompt`);
        throw new Error("Prompt cannot be empty");
    }
    
    try {
        console.log(`[FixMyPrompt] [${attemptId}] Getting backend URL...`);
        const backendURL = await getBackendURL();
        console.log(`[FixMyPrompt] [${attemptId}] Backend URL: ${backendURL}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => {
            console.warn(`[FixMyPrompt] [${attemptId}] Timeout triggered after ${API_TIMEOUT}ms`);
            controller.abort();
        }, API_TIMEOUT);
        
        try {
            const requestPayload = {
                prompt: prompt.trim(),
                platform
            };
            
            // Add context if available
            if (context) {
                requestPayload.context = context;
                console.log(`[FixMyPrompt] [${attemptId}] Including context with ${context.previousPrompts?.length || 0} previous prompts`);
            }
            
            console.log(`[FixMyPrompt] [${attemptId}] Sending request to backend...`);
            console.log(`[FixMyPrompt] [${attemptId}] Request URL: ${backendURL}/api/improve-prompt`);
            console.log(`[FixMyPrompt] [${attemptId}] Request payload:`, {
                promptLength: requestPayload.prompt.length,
                platform: requestPayload.platform
            });
            
            const apiStartTime = Date.now();
            console.log("[FixMyPrompt] API Start Time: " + apiStartTime);
            
            const response = await fetch(`${backendURL}/api/improve-prompt`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestPayload),
                signal: controller.signal
            });
            
            clearTimeout(timeout);
            
            const apiEndTime = Date.now();
            const apiDuration = apiEndTime - apiStartTime;
            console.log("[FixMyPrompt] API End Time: " + apiEndTime);
            console.log("[FixMyPrompt] API Duration: " + apiDuration + "ms");
            
            console.log(`[FixMyPrompt] [${attemptId}] Response received`);
            console.log(`[FixMyPrompt] [${attemptId}] Status: ${response.status} ${response.statusText}`);
            console.log(`[FixMyPrompt] [${attemptId}] Headers:`, {
                contentType: response.headers.get("content-type"),
                corsHeaders: response.headers.get("access-control-allow-origin")
            });
            
            if (!response.ok) {
                console.warn(`[FixMyPrompt] [${attemptId}] Response not OK (status ${response.status})`);
                let errorData = {};
                try {
                    errorData = await response.json();
                    console.log(`[FixMyPrompt] [${attemptId}] Error response data:`, errorData);
                } catch {
                    console.warn(`[FixMyPrompt] [${attemptId}] Could not parse error response as JSON`);
                }
                const error = new Error(errorData.error || `Server error: ${response.status} ${response.statusText}`);
                error.status = response.status;
                throw error;
            }
            
            const data = await response.json();
            
            console.log(`[FixMyPrompt] [${attemptId}] Response data:`, {
                success: data.success,
                improvedLength: data.improved?.length || 0,
                hasError: !!data.error
            });
            
            if (!data.success || !data.improved) {
                console.error(`[FixMyPrompt] [${attemptId}] Invalid response:`, data);
                throw new Error(data.error || "Invalid response from backend");
            }
            
            console.log(`[FixMyPrompt] [${attemptId}] Transformation successful`);
            console.log(`[FixMyPrompt] [${attemptId}] Original: ${prompt.length} chars, Improved: ${data.improved.length} chars`);
            
            return data.improved;
        } catch (error) {
            clearTimeout(timeout);
            console.error(`[FixMyPrompt] [${attemptId}] Fetch error:`, {
                name: error.name,
                message: error.message,
                status: error.status
            });
            
            if (error.name === "AbortError") {
                console.error(`[FixMyPrompt] [${attemptId}] Request aborted (timeout)`);
                throw new Error("timeout: Request took too long to complete");
            }
            throw error;
        }
    } catch (error) {
        console.error(`[FixMyPrompt] [${attemptId}] Caught error:`, {
            name: error.name,
            message: error.message,
            isRetryable: isRetryableError(error),
            canRetry: attempt < MAX_RETRIES + 1
        });
        
        if (isRetryableError(error) && attempt < MAX_RETRIES + 1) {
            const delay = calculateBackoffDelay(attempt);
            console.warn(`[FixMyPrompt] [${attemptId}] Retrying in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return transformPromptWithLLM(prompt, platform, attempt + 1, context);
        }
        
        console.error(`[FixMyPrompt] [${attemptId}] No more retries available, throwing error`);
        logError(error, "Transformation error");
        throw error;
    }
}

/**
 * Validate improvement
 */
function validateImprovement(original, improved) {
    console.log("[FixMyPrompt] Validating improvement...");
    console.log("[FixMyPrompt] Original length:", original.length);
    console.log("[FixMyPrompt] Improved length:", improved.length);
    console.log("[FixMyPrompt] Length ratio:", (improved.length / original.length).toFixed(2));
    console.log("[FixMyPrompt] Length validation skipped (v1 - no restrictions)");
    console.log("[FixMyPrompt] Original: " + original.length + " chars, Improved: " + improved.length + " chars");
    console.log("[FixMyPrompt] Ratio: " + (improved.length / original.length).toFixed(2) + "x");
    
    if (improved.toLowerCase() === original.toLowerCase()) {
        console.warn("[FixMyPrompt] Validation failed: improved prompt identical to original");
        return {
            valid: false,
            error: "Generated prompt is identical to original"
        };
    }
    
    console.log("[FixMyPrompt] Validation passed - improvement is different from original");
    console.log("[FixMyPrompt] Validation passed");
    return { valid: true };
}

/**
 * Improve prompt orchestration
 * @param {string} prompt - The prompt to improve
 * @param {string} platform - The platform (chatgpt or claude)
 * @param {Object} context - Accumulated context from previous prompts (optional)
 */
async function improvePrompt(prompt, platform = "chatgpt", context = null) {
    const orchestrationId = `orch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    console.log(`[FixMyPrompt] [${orchestrationId}] improvePrompt orchestration started`);
    console.log(`[FixMyPrompt] [${orchestrationId}] Platform: ${platform}`);
    console.log(`[FixMyPrompt] [${orchestrationId}] Prompt length: ${prompt?.length || 0}`);
    
    if (!prompt || prompt.trim().length === 0) {
        console.error(`[FixMyPrompt] [${orchestrationId}] Input validation failed: empty prompt`);
        throw new Error("Prompt cannot be empty");
    }
    
    try {
        console.log(`[FixMyPrompt] [${orchestrationId}] Calling transformPromptWithLLM...`);
        if (context) {
            console.log(`[FixMyPrompt] [${orchestrationId}] Including context with ${context.previousPrompts?.length || 0} previous prompts`);
        }
        const improved = await transformPromptWithLLM(prompt, platform, 1, context);
        
        console.log(`[FixMyPrompt] [${orchestrationId}] Transformation complete`);
        console.log(`[FixMyPrompt] [${orchestrationId}] Validating improvement...`);
        
        const validation = validateImprovement(prompt, improved);
        if (!validation.valid) {
            console.error(`[FixMyPrompt] [${orchestrationId}] Validation failed:`, validation.error);
            throw new Error(validation.error);
        }
        
        console.log(`[FixMyPrompt] [${orchestrationId}] Improvement validated successfully`);
        
        const result = {
            success: true,
            original: prompt.trim(),
            improved: improved.trim(),
            timestamp: Date.now()
        };
        
        console.log(`[FixMyPrompt] [${orchestrationId}] Returning success:`, {
            originalLength: result.original.length,
            improvedLength: result.improved.length
        });
        
        return result;
    } catch (error) {
        console.error(`[FixMyPrompt] [${orchestrationId}] Orchestration failed:`, {
            errorName: error.name,
            errorMessage: error.message
        });
        logError(error, "Improvement failed");
        
        const userFriendlyError = formatErrorMessage(error);
        console.log(`[FixMyPrompt] [${orchestrationId}] User-friendly error:`, userFriendlyError);
        
        return {
            success: false,
            error: userFriendlyError,
            technicalError: error.message
        };
    }
}

/**
 * Calculate detailed score for a prompt
 */
function calculateDetailedScore(prompt) {
    if (!prompt || prompt.trim().length === 0) {
        return {
            dimensions: {
                clarity: 0,
                structure: 0,
                ambiguityReduction: 0,
                halluccinationRisk: 0
            },
            total: 0
        };
    }
    
    const clarity = scoreClarityDimension(prompt);
    const structure = scoreStructureDimension(prompt);
    const ambiguityReduction = scoreAmbiguityReductionDimension(prompt);
    const halluccinationRisk = scoreHalluccinationRiskDimension(prompt);
    
    const total = clarity + structure + ambiguityReduction + halluccinationRisk;
    
    return {
        dimensions: {
            clarity,
            structure,
            ambiguityReduction,
            halluccinationRisk
        },
        total: Math.min(100, Math.max(0, total))
    };
}

/**
 * Score clarity dimension
 */
function scoreClarityDimension(prompt) {
    let score = 0;
    const lower = prompt.toLowerCase();
    
    if (["goal", "objective", "aim", "purpose", "want", "need"].some(word => lower.includes(word))) {
        score += 5;
    }
    if (["success", "criteria", "outcome", "result", "expect", "should"].some(word => lower.includes(word))) {
        score += 5;
    }
    if (["specific", "concrete", "example", "detailed", "precisely", "exactly"].some(word => lower.includes(word))) {
        score += 5;
    }
    if (/^\d+\.|^-|^•/m.test(prompt)) {
        score += 5;
    }
    if (prompt.includes("?")) {
        score += 5;
    }
    
    return Math.min(25, score);
}

/**
 * Score structure dimension
 */
function scoreStructureDimension(prompt) {
    let score = 0;
    const lower = prompt.toLowerCase();
    
    const structureKeywords = ["goal", "context", "constraint", "output", "format", "step", "requirement", "criteria"];
    const foundKeywords = structureKeywords.filter(keyword => lower.includes(keyword)).length;
    score += Math.min(10, foundKeywords * 2);
    
    if (/^\d+\./m.test(prompt)) {
        score += 5;
    }
    if (/^[-•*]\s/m.test(prompt)) {
        score += 5;
    }
    if (prompt.split("\n").length > 3) {
        score += 5;
    }
    
    return Math.min(25, score);
}

/**
 * Score ambiguity reduction dimension
 */
function scoreAmbiguityReductionDimension(prompt) {
    let score = 15;
    
    const vagueWordsFound = SCORING_CONFIG.vagueBadWords.filter(word => 
        new RegExp(`\\b${word}\\b`, "i").test(prompt)
    ).length;
    score -= Math.min(15, vagueWordsFound * 2);
    
    if (prompt.includes("example") || prompt.includes("such as") || prompt.includes("like")) {
        score += 5;
    }
    if (prompt.includes("constraint") || prompt.includes("limit") || prompt.includes("maximum") || prompt.includes("minimum")) {
        score += 5;
    }
    if (prompt.includes("specific") || prompt.includes("exactly") || prompt.includes("precisely")) {
        score += 5;
    }
    
    return Math.min(25, Math.max(0, score));
}

/**
 * Score hallucination risk dimension
 */
function scoreHalluccinationRiskDimension(prompt) {
    let score = 0;
    const lower = prompt.toLowerCase();
    
    const guardrailsFound = SCORING_CONFIG.guardrailKeywords.filter(keyword => lower.includes(keyword)).length;
    score += Math.min(10, guardrailsFound);
    
    if (lower.includes("accurate") || lower.includes("verify") || lower.includes("reliable") || lower.includes("fact")) {
        score += 5;
    }
    if (lower.includes("professional") || lower.includes("expert") || lower.includes("senior") || lower.includes("experienced")) {
        score += 5;
    }
    if (lower.includes("bias") || lower.includes("objective") || lower.includes("neutral")) {
        score += 5;
    }
    
    return Math.min(25, score);
}

/**
 * Analyze structure changes
 */
function analyzeStructureChanges(original, improved) {
    const originalStructure = countStructureIndicators(original);
    const improvedStructure = countStructureIndicators(improved);
    const applied = improvedStructure > originalStructure;
    const confidence = applied ? Math.min(1, (improvedStructure - originalStructure) / 10) : 0;
    return { applied, confidence };
}

/**
 * Analyze clarity changes
 */
function analyzeClarityChanges(original, improved) {
    const originalClarity = countClarityIndicators(original);
    const improvedClarity = countClarityIndicators(improved);
    const applied = improvedClarity > originalClarity;
    const confidence = applied ? Math.min(1, (improvedClarity - originalClarity) / 5) : 0;
    return { applied, confidence };
}

/**
 * Analyze guardrail changes
 */
function analyzeGuardrailChanges(original, improved) {
    const originalGuardrails = countGuardrailKeywords(original);
    const improvedGuardrails = countGuardrailKeywords(improved);
    const applied = improvedGuardrails > originalGuardrails;
    const confidence = applied ? Math.min(1, (improvedGuardrails - originalGuardrails) / 8) : 0;
    return { applied, confidence };
}

/**
 * Analyze expert framing changes
 */
function analyzeExpertFramingChanges(original, improved) {
    const originalExpert = countExpertKeywords(original);
    const improvedExpert = countExpertKeywords(improved);
    const applied = improvedExpert > originalExpert;
    const confidence = applied ? Math.min(1, (improvedExpert - originalExpert) / 4) : 0;
    return { applied, confidence };
}

/**
 * Count structure indicators
 */
function countStructureIndicators(text) {
    let count = 0;
    if (/^(goal|objective|context|constraint|output|format|step|requirement|criteria):/im.test(text)) count += 3;
    if (/^\d+\./m.test(text)) count += 2;
    if (/^[-•*]\s/m.test(text)) count += 2;
    if (text.split("\n").length > 3) count += 1;
    return count;
}

/**
 * Count clarity indicators
 */
function countClarityIndicators(text) {
    let count = 0;
    const lower = text.toLowerCase();
    const keywords = ["goal", "objective", "aim", "purpose", "want", "need", "outcome", "result", "success", "criteria", "should", "must"];
    keywords.forEach(keyword => {
        if (lower.includes(keyword)) count += 1;
    });
    return count;
}

/**
 * Count guardrail keywords
 */
function countGuardrailKeywords(text) {
    let count = 0;
    const lower = text.toLowerCase();
    const keywords = ["avoid", "ensure", "must", "should", "verify", "check", "confirm", "accurate", "reliable", "professional", "expert", "senior", "ground", "fact", "bias", "objective", "neutral"];
    keywords.forEach(keyword => {
        if (lower.includes(keyword)) count += 1;
    });
    return count;
}

/**
 * Count expert keywords
 */
function countExpertKeywords(text) {
    let count = 0;
    const lower = text.toLowerCase();
    const keywords = ["professional", "expert", "senior", "experienced", "operator", "coach", "master", "practitioner", "specialist"];
    keywords.forEach(keyword => {
        if (lower.includes(keyword)) count += 1;
    });
    return count;
}

/**
 * Count section headers
 */
function countSectionHeaders(text) {
    const matches = text.match(/^(goal|objective|context|constraint|output|format|step|requirement|criteria):/gim);
    return matches ? matches.length : 0;
}

/**
 * Generate change explanations
 */
function generateChangeExplanations(rulesApplied, original, improved) {
    const explanations = [];
    
    const structureApplied = rulesApplied.includes(CHANGE_TYPES.ADD_STRUCTURE.id);
    const clarityApplied = rulesApplied.includes(CHANGE_TYPES.CLARIFY_GOAL.id);
    const guardrailsApplied = rulesApplied.includes(CHANGE_TYPES.INJECT_GUARDRAILS.id);
    const expertApplied = rulesApplied.includes(CHANGE_TYPES.EXPERT_FRAMING.id);
    
    if (structureApplied) {
        const sectionCount = countSectionHeaders(improved);
        if (sectionCount > 0) {
            explanations.push(`Organized into ${sectionCount} clear sections (Goal, Context, Constraints, Output Format)`);
        } else {
            explanations.push("Added structure with clear sections and hierarchy");
        }
    }
    
    if (clarityApplied) {
        if (/success|criteria|outcome|should|must/i.test(improved)) {
            explanations.push("Made success criteria explicit and measurable");
        } else {
            explanations.push("Clarified goals and desired outcomes");
        }
    }
    
    if (guardrailsApplied) {
        const guardrailsBefore = countGuardrailKeywords(original);
        const guardrailsAfter = countGuardrailKeywords(improved);
        if (guardrailsAfter - guardrailsBefore > 2) {
            explanations.push("Added multiple guardrails to reduce hallucinations and improve reliability");
        } else {
            explanations.push("Added behavioral constraints to improve reliability");
        }
    }
    
    if (expertApplied) {
        explanations.push("Reframed from user perspective to experienced practitioner perspective");
    }
    
    if (explanations.length === 0) {
        explanations.push("Improved prompt for clarity and effectiveness");
    }
    
    return explanations.slice(0, 3);
}

/**
 * Analyze changes between original and improved
 */
function analyzeChanges(original, improved) {
    const structure = analyzeStructureChanges(original, improved);
    const clarity = analyzeClarityChanges(original, improved);
    const guardrails = analyzeGuardrailChanges(original, improved);
    const expert = analyzeExpertFramingChanges(original, improved);
    
    const rulesApplied = [];
    const confidences = [];
    
    if (structure.applied) {
        rulesApplied.push(CHANGE_TYPES.ADD_STRUCTURE.id);
        confidences.push(structure.confidence);
    }
    if (clarity.applied) {
        rulesApplied.push(CHANGE_TYPES.CLARIFY_GOAL.id);
        confidences.push(clarity.confidence);
    }
    if (guardrails.applied) {
        rulesApplied.push(CHANGE_TYPES.INJECT_GUARDRAILS.id);
        confidences.push(guardrails.confidence);
    }
    if (expert.applied) {
        rulesApplied.push(CHANGE_TYPES.EXPERT_FRAMING.id);
        confidences.push(expert.confidence);
    }
    
    const averageConfidence = confidences.length > 0 ? confidences.reduce((a, b) => a + b, 0) / confidences.length : 0;
    const explanations = generateChangeExplanations(rulesApplied, original, improved);
    
    return {
        rulesApplied,
        explanations: explanations.length > 0 ? explanations : ["Prompt improved for clarity and effectiveness"],
        confidence: Math.min(1, averageConfidence)
    };
}

/**
 * Handle messages from content script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[FixMyPrompt] Message received from content script");
    console.log("[FixMyPrompt] Action:", message.action);
    console.log("[FixMyPrompt] Request data:", {
        promptLength: message.prompt?.length || 0,
        platform: message.platform,
        hasContext: !!message.context
    });
    
    if (message.action === "fixPrompt") {
        console.log("[FixMyPrompt] Routing to handleFixPromptRequest");
        (async () => {
            try {
                await handleFixPromptRequest(message, sender, sendResponse);
            } catch (error) {
                console.error("[FixMyPrompt] Unhandled error in message listener:", error);
                sendResponse({
                    success: false,
                    error: error.message || "An unexpected error occurred"
                });
            }
        })();
        return true;
    }
    
    console.warn("[FixMyPrompt] Unknown action:", message.action);
    sendResponse({
        success: false,
        error: "Unknown action"
    });
});

/**
 * Handle fix prompt request
 */
async function handleFixPromptRequest(message, sender, sendResponse) {
    const requestId = `req-${Date.now()}`;
    console.log(`[FixMyPrompt] [${requestId}] Starting handleFixPromptRequest`);
    
    try {
        const { prompt, platform, context } = message;
        
        console.log(`[FixMyPrompt] [${requestId}] Request details:`, {
            promptLength: prompt?.length || 0,
            platform,
            hasContext: !!context,
            contextPrompts: context?.previousPrompts?.length || 0,
            contextKeys: Object.keys(context || {})
        });
        
        // Validate prompt
        if (!prompt || prompt.trim().length === 0) {
            console.warn(`[FixMyPrompt] [${requestId}] Validation failed: empty prompt`);
            sendResponse({
                success: false,
                error: "Prompt cannot be empty"
            });
            return;
        }
        
        // Validate platform
        if (!platform || !["chatgpt", "claude"].includes(platform)) {
            console.warn(`[FixMyPrompt] [${requestId}] Validation failed: invalid platform`);
            sendResponse({
                success: false,
                error: "Invalid platform"
            });
            return;
        }
        
        console.log(`[FixMyPrompt] [${requestId}] Validation passed`);
        console.log(`[FixMyPrompt] [${requestId}] Step 1: Calling improvePrompt (trying backend first)...`);
        
        // Try backend API first, fallback to local
        let improveResult = null;
        let scoreBefore = null;
        let scoreAfter = null;
        let scoreSource = 'local';
        
        try {
            console.log(`[FixMyPrompt] [${requestId}] Attempting backend /api/improve-prompt...`);
            const backendResult = await backendAPI.improvePrompt(prompt, platform, null, context);
            
            if (backendResult && backendResult.improved) {
                console.log(`[FixMyPrompt] [${requestId}] Backend improvement successful`);
                improveResult = {
                    success: true,
                    original: prompt.trim(),
                    improved: backendResult.improved.trim()
                };
                
                // Use backend scores if available
                if (backendResult.score && typeof backendResult.score === 'object' && backendResult.score.before !== undefined && backendResult.score.after !== undefined) {
                    scoreBefore = backendResult.score.before;
                    scoreAfter = backendResult.score.after;
                    scoreSource = 'backend';
                    console.log(`[FixMyPrompt] [${requestId}] Using backend scores: before=${scoreBefore}, after=${scoreAfter}`);
                }
            } else {
                console.log(`[FixMyPrompt] [${requestId}] Backend returned no improvement, falling back to local`);
            }
        } catch (backendError) {
            console.log(`[FixMyPrompt] [${requestId}] Backend API failed, falling back to local:`, backendError.message);
        }
        
        // Fallback to local improvePrompt if backend failed
        if (!improveResult) {
            console.log(`[FixMyPrompt] [${requestId}] Using local improvePrompt...`);
            improveResult = await improvePrompt(prompt, platform, context);
            scoreSource = 'local';
        }
        
        if (!improveResult.success) {
            console.error(`[FixMyPrompt] [${requestId}] Improvement failed:`, improveResult.error);
            sendResponse({
                success: false,
                error: improveResult.error
            });
            return;
        }
        
        const { original, improved } = improveResult;
        
        console.log(`[FixMyPrompt] [${requestId}] Improvement successful`);
        console.log(`[FixMyPrompt] [${requestId}] Original length: ${original.length}, Improved length: ${improved.length}`);
        console.log(`[FixMyPrompt] [${requestId}] Step 2: Scoring prompts (source: ${scoreSource})...`);
        
        // Use backend scores if available, otherwise calculate locally
        let originalScore, improvedScore;
        if (scoreBefore !== null && scoreAfter !== null) {
            console.log(`[FixMyPrompt] [${requestId}] Using backend scores`);
            originalScore = { total: scoreBefore, dimensions: {} };
            improvedScore = { total: scoreAfter, dimensions: {} };
        } else {
            console.log(`[FixMyPrompt] [${requestId}] Calculating local scores`);
            originalScore = calculateDetailedScore(original);
            improvedScore = calculateDetailedScore(improved);
        }
        
        console.log(`[FixMyPrompt] [${requestId}] Original score:`, {
            clarity: originalScore.dimensions.clarity,
            structure: originalScore.dimensions.structure,
            ambiguity: originalScore.dimensions.ambiguityReduction,
            hallucination: originalScore.dimensions.halluccinationRisk,
            total: originalScore.total
        });
        
        console.log(`[FixMyPrompt] [${requestId}] Improved score:`, {
            clarity: improvedScore.dimensions.clarity,
            structure: improvedScore.dimensions.structure,
            ambiguity: improvedScore.dimensions.ambiguityReduction,
            hallucination: improvedScore.dimensions.halluccinationRisk,
            total: improvedScore.total
        });
        
        console.log(`[FixMyPrompt] [${requestId}] Step 3: Generating change summary...`);
        
        // Analyze changes
        const changeAnalysis = analyzeChanges(original, improved);
        
        console.log(`[FixMyPrompt] [${requestId}] Changes:`, changeAnalysis.explanations);
        console.log(`[FixMyPrompt] [${requestId}] Step 4: Storing state for undo...`);
        
        // Store state
        state.lastImprovement = {
            original,
            improved,
            timestamp: Date.now(),
            platform,
            context,
            requestId
        };
        
        console.log(`[FixMyPrompt] [${requestId}] Step 5: Sending response to content script...`);
        
        // Prepare response
        const response = {
            success: true,
            original,
            improved,
            score: {
                before: Math.round(originalScore.total),
                after: Math.round(improvedScore.total)
            },
            changes: changeAnalysis.explanations,
            timestamp: Date.now(),
            requestId
        };
        
        console.log(`[FixMyPrompt] [${requestId}] Response prepared:`, {
            success: response.success,
            scoreBefore: response.score.before,
            scoreAfter: response.score.after,
            changesCount: response.changes.length
        });
        
        sendResponse(response);
        
        console.log(`[FixMyPrompt] [${requestId}] Response sent successfully`);
    } catch (error) {
        console.error(`[FixMyPrompt] [${requestId}] Unexpected error:`, error);
        console.error(`[FixMyPrompt] [${requestId}] Error message:`, error.message);
        console.error(`[FixMyPrompt] [${requestId}] Error stack:`, error.stack);
        
        sendResponse({
            success: false,
            error: error.message || "An unexpected error occurred"
        });
    }
}

/**
 * Handle extension installation
 */
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        console.log("[FixMyPrompt] Extension installed");
        console.log("[FixMyPrompt] Session ID:", state.sessionId);
    } else if (details.reason === "update") {
        console.log("[FixMyPrompt] Extension updated");
        console.log("[FixMyPrompt] Session ID:", state.sessionId);
    }
});

console.log("[FixMyPrompt] Service worker initialized");
console.log("[FixMyPrompt] Session ID:", state.sessionId);
console.log("[FixMyPrompt] Ready to receive messages from content script");
