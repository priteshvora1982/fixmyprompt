/**
 * FixMyPrompt - Validation Utilities
 * Input validation and sanitization
 */

import { SCORING, ERROR_MESSAGES } from "./constants.js";

/**
 * Validate prompt length
 * @param {string} prompt - Prompt text to validate
 * @returns {Object} - Validation result {valid, message, truncated}
 */
export function validatePromptLength(prompt) {
    if (!prompt || typeof prompt !== "string") {
        return {
            valid: false,
            message: ERROR_MESSAGES.UNKNOWN_ERROR,
            truncated: false
        };
    }
    
    const trimmed = prompt.trim();
    
    if (trimmed.length < SCORING.minPromptLength) {
        return {
            valid: false,
            message: ERROR_MESSAGES.TOO_SHORT,
            truncated: false
        };
    }
    
    if (trimmed.length > SCORING.maxPromptLength) {
        return {
            valid: true,
            message: ERROR_MESSAGES.TOO_LONG,
            truncated: true,
            truncatedText: trimmed.substring(0, SCORING.maxPromptLength)
        };
    }
    
    return {
        valid: true,
        message: null,
        truncated: false
    };
}

/**
 * Sanitize prompt text
 * @param {string} prompt - Prompt text to sanitize
 * @returns {string} - Sanitized prompt
 */
export function sanitizePrompt(prompt) {
    if (!prompt || typeof prompt !== "string") {
        return "";
    }
    
    return prompt
        .trim()
        .replace(/\s+/g, " ") // Normalize whitespace
        .substring(0, SCORING.maxPromptLength); // Truncate if needed
}

/**
 * Validate API response
 * @param {Object} response - Response object to validate
 * @returns {Object} - Validation result
 */
export function validateAPIResponse(response) {
    if (!response || typeof response !== "object") {
        return {
            valid: false,
            error: "Invalid response format"
        };
    }
    
    if (!response.success) {
        return {
            valid: false,
            error: response.message || "API error"
        };
    }
    
    if (!response.original || typeof response.original !== "string") {
        return {
            valid: false,
            error: "Missing original prompt"
        };
    }
    
    if (!response.improved || typeof response.improved !== "string") {
        return {
            valid: false,
            error: "Missing improved prompt"
        };
    }
    
    if (!response.score || typeof response.score !== "object") {
        return {
            valid: false,
            error: "Missing score information"
        };
    }
    
    if (typeof response.score.before !== "number" || typeof response.score.after !== "number") {
        return {
            valid: false,
            error: "Invalid score values"
        };
    }
    
    if (!Array.isArray(response.changes)) {
        return {
            valid: false,
            error: "Missing changes array"
        };
    }
    
    return {
        valid: true
    };
}

/**
 * Check if text is empty or whitespace only
 * @param {string} text - Text to check
 * @returns {boolean} - True if empty
 */
export function isEmpty(text) {
    return !text || text.trim().length === 0;
}

/**
 * Check if text is too short
 * @param {string} text - Text to check
 * @returns {boolean} - True if too short
 */
export function isTooShort(text) {
    return isEmpty(text) || text.trim().length < SCORING.minPromptLength;
}

/**
 * Check if text is too long
 * @param {string} text - Text to check
 * @returns {boolean} - True if too long
 */
export function isTooLong(text) {
    return text && text.length > SCORING.maxPromptLength;
}

export default {
    validatePromptLength,
    sanitizePrompt,
    validateAPIResponse,
    isEmpty,
    isTooShort,
    isTooLong
};
