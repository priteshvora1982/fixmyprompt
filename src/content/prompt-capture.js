/**
 * FixMyPrompt - Prompt Capture
 * Capture user prompts from ChatGPT and Claude
 */

import { PLATFORMS } from "../shared/constants.js";
import { detectPlatform } from "../shared/platform.js";
import { isElementVisible, getElementText } from "../shared/dom-utils.js";

/**
 * Find the prompt input element
 * @param {string} platform - Platform identifier (optional)
 * @returns {Element|null} - Prompt input element or null
 */
export function findPromptInput(platform = null) {
    if (!platform) {
        platform = detectPlatform();
    }
    
    if (!platform) {
        console.warn("[FixMyPrompt] Unknown platform");
        return null;
    }
    
    const config = PLATFORMS[platform];
    if (!config) {
        console.warn(`[FixMyPrompt] No configuration for platform: ${platform}`);
        return null;
    }
    
    const selectors = config.promptInputSelectors;
    console.log(`[FixMyPrompt] Searching for prompt input on ${platform} with ${selectors.length} selectors`);
    
    for (const selector of selectors) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                if (isElementVisible(element)) {
                    console.log(`[FixMyPrompt] Found prompt input with selector: ${selector}`);
                    return element;
                }
                console.log(`[FixMyPrompt] Found element but not visible: ${selector}`);
            }
        } catch (error) {
            console.log(`[FixMyPrompt] Error with selector ${selector}:`, error.message);
        }
    }
    
    console.warn(`[FixMyPrompt] Could not find visible prompt input on ${platform}`);
    return null;
}

/**
 * Capture the current prompt text
 * @returns {string|null} - Prompt text or null if capture fails
 */
export function capturePrompt() {
    const element = findPromptInput();
    if (!element) {
        console.error("[FixMyPrompt] Could not find prompt input");
        return null;
    }
    
    const text = getElementText(element);
    if (!text || text.trim().length === 0) {
        console.error("[FixMyPrompt] Could not extract prompt text");
        return null;
    }
    
    console.log(`[FixMyPrompt] Captured prompt (${text.length} characters)`);
    return text;
}

/**
 * Get the prompt input element (cached for performance)
 * @returns {Element|null} - Prompt input element or null
 */
let cachedPromptElement = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 1000; // 1 second

export function getPromptInputCached() {
    const now = Date.now();
    
    // Check if cache is still valid
    if (cachedPromptElement && (now - cacheTimestamp) < CACHE_DURATION) {
        // Verify element is still in DOM
        if (document.contains(cachedPromptElement)) {
            return cachedPromptElement;
        }
    }
    
    // Cache miss or element removed, find new one
    cachedPromptElement = findPromptInput();
    cacheTimestamp = now;
    
    return cachedPromptElement;
}

/**
 * Clear the prompt element cache
 */
export function clearPromptCache() {
    cachedPromptElement = null;
    cacheTimestamp = 0;
}

export default {
    findPromptInput,
    capturePrompt,
    getPromptInputCached,
    clearPromptCache
};
