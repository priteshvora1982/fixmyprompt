/**
 * FixMyPrompt - Content Script
 * Main entry point for content script
 */

import { injectButton } from "./button.js";
import { detectPlatform } from "../shared/platform.js";
import { onMessage } from "../shared/chrome-utils.js";
import { domainDetector } from "../shared/domain-detector.js";

/**
 * Wait for input element to be available
 */
async function waitForInputElement(maxAttempts = 10, delayMs = 500) {
    for (let i = 0; i < maxAttempts; i++) {
        const input = document.querySelector(
            'div[id="prompt-textarea"][contenteditable="true"], ' +
            'div.tiptap.ProseMirror[contenteditable="true"], ' +
            'div.ProseMirror[contenteditable="true"], ' +
            'div[contenteditable="true"][role="textbox"], ' +
            'textarea'
        );
        if (input) {
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    return false;
}

/**
 * Initialize content script
 */
async function initialize() {
    const platform = detectPlatform();
    
    if (!platform) {
        console.warn("[FixMyPrompt] Unsupported platform, not initializing");
        return;
    }
    
    console.log(`[FixMyPrompt] Initializing on ${platform}`);
    
    // Wait for input element to be available before injecting button
    const inputReady = await waitForInputElement();
    if (!inputReady) {
        console.warn("[FixMyPrompt] Input element not found after waiting, will retry on mutation");
    }
    
    // Inject button
    injectButton();
    
    // Setup message listener
    setupMessageListener();
    
    // Re-inject button if DOM changes (for dynamic content)
    setupMutationObserver();
}

/**
 * Setup message listener for service worker
 */
function setupMessageListener() {
    onMessage((message, sender, sendResponse) => {
        console.log("[FixMyPrompt] Received message:", message.type);
        
        if (message.type === "improvement") {
            // Handle improvement response
            console.log("[FixMyPrompt] Improvement received");
            sendResponse({ received: true });
        } else if (message.type === "error") {
            // Handle error
            console.error("[FixMyPrompt] Error:", message.message);
            sendResponse({ received: true });
        }
    });
}

/**
 * Setup mutation observer to re-inject button if needed
 */
function setupMutationObserver() {
    // Debounce re-injection
    let injectionTimeout;
    
    const observer = new MutationObserver(() => {
        clearTimeout(injectionTimeout);
        injectionTimeout = setTimeout(() => {
            const button = document.getElementById("fixmyprompt-button");
            if (!button) {
                console.log("[FixMyPrompt] Button missing, re-injecting");
                injectButton();
            }
        }, 500);
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false
    });
}

/**
 * Start initialization when DOM is ready
 */
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize);
} else {
    initialize();
}

// Also initialize on page load (for dynamically loaded content)
window.addEventListener("load", () => {
    const button = document.getElementById("fixmyprompt-button");
    if (!button) {
        console.log("[FixMyPrompt] Button not found after page load, injecting");
        injectButton();
    }
});

/**
 * PHASE 3: Register analysis classes globally for IIFE bundling
 * Ensures classes are available in global scope after esbuild bundling
 */
if (typeof window !== 'undefined') {
    // Register PromptAnalyzer
    if (typeof PromptAnalyzer !== 'undefined') {
        window.PromptAnalyzer = PromptAnalyzer;
        console.log('[FixMyPrompt] PromptAnalyzer registered globally');
    } else {
        console.warn('[FixMyPrompt] PromptAnalyzer not found in scope');
    }
    
    // Register GapFinder
    if (typeof GapFinder !== 'undefined') {
        window.GapFinder = GapFinder;
        console.log('[FixMyPrompt] GapFinder registered globally');
    } else {
        console.warn('[FixMyPrompt] GapFinder not found in scope');
    }
    
    // Register PromptScorer
    if (typeof PromptScorer !== 'undefined') {
        window.PromptScorer = PromptScorer;
        console.log('[FixMyPrompt] PromptScorer registered globally');
    } else {
        console.warn('[FixMyPrompt] PromptScorer not found in scope');
    }
    
    // Register DownsideGenerator
    if (typeof DownsideGenerator !== 'undefined') {
        window.DownsideGenerator = DownsideGenerator;
        console.log('[FixMyPrompt] DownsideGenerator registered globally');
    } else {
        console.warn('[FixMyPrompt] DownsideGenerator not found in scope');
    }
    
    // Register BackendAnalyzer
    if (typeof BackendAnalyzer !== 'undefined') {
        window.BackendAnalyzer = BackendAnalyzer;
        console.log('[FixMyPrompt] BackendAnalyzer registered globally');
    } else {
        console.warn('[FixMyPrompt] BackendAnalyzer not found in scope');
    }
    
    // Register DomainDetector (needed by PromptAnalyzer)
    if (typeof domainDetector !== 'undefined') {
        window.DomainDetector = domainDetector;
        console.log('[FixMyPrompt] DomainDetector registered globally');
    } else {
        console.warn('[FixMyPrompt] DomainDetector not found in scope');
    }
    
    console.log('[FixMyPrompt] Analysis classes registration complete');
}
