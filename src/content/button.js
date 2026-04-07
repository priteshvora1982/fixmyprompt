/**
 * FixMyPrompt - Button Injection (v1.5)
 * Inject and handle the "Improve" button
 */

import { UI, COLORS, PLATFORMS, API } from "../shared/constants.js";
import { detectPlatform } from "../shared/platform.js";
import { sendMessage } from "../shared/chrome-utils.js";
import { showToast, showError, showInfo, showSuccess } from "../shared/toast.js";
import { capturePrompt, findPromptInput } from "./prompt-capture.js";
import { validatePromptLength } from "../shared/validation.js";
import { createModal, renderModal, renderImprovedModal, showProgressModal, closeProgressModal } from "./modal.js";
import { createImprovedModal } from "./improved-modal.js";
import { getElementText } from "../shared/dom-utils.js";
import { contextManager } from "../shared/context-manager.js";
import { domainDetector } from "../shared/domain-detector.js";
import { questionGenerator } from "../shared/question-generator.js";
import { extractRecentMessages } from "../shared/message-extractor.js";
import { incrementalContextManager } from "../shared/incremental-context-v2.js";
import { InputMonitor } from "./input-monitor.js";
import { GapFinder } from "../shared/gap-finder.js";
import { PromptScorer } from "../shared/prompt-scorer.js";
import { SuggestionFormatter } from "../shared/suggestion-formatter.js";

import { AutoDetectBalloon } from "./auto-detect-balloon.js";
import { MockBackendAnalyzer } from "./mock-backend-analyzer.js";
// balloon-question-bank is imported inside auto-detect-balloon.js — no direct import needed here
import { formatStringGapsToSuggestions } from "./button-gap-formatter.js";
import backendAPI from "../shared/backend-api.js";

/**
 * Monitor ChatGPT input for new prompts and save to context automatically
 * Captures prompts even when user doesn't click improve button (v0.2.2 fix)
 */
// Global input selectors for prompt capture
const INPUT_SELECTORS = [
    'div[id="prompt-textarea"][contenteditable="true"]',
    'textarea[placeholder*="Message"]',
    'textarea[placeholder*="Type a message"]'
];

// Global MockBackendAnalyzer instance (accessible to all functions)
let mockBackend = null;

function monitorChatGPTInput() {
    console.log('[FixMyPrompt EXTENSIVE LOG] ===== monitorChatGPTInput() CALLED =====');
    console.log('[FixMyPrompt EXTENSIVE LOG] Time:', new Date().toISOString());
    
    const inputSelectors = [
        // ChatGPT
        'div[id="prompt-textarea"][contenteditable="true"]',
        // Claude
        'div.tiptap.ProseMirror[contenteditable="true"]',
        'div[data-testid="chat-input-textarea"][contenteditable="true"]',
        // Generic fallbacks (both platforms)
        'div[contenteditable="true"][role="textbox"]',
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="Type a message"]'
    ];
    
    function findInputElement() {
        for (const selector of inputSelectors) {
            const el = document.querySelector(selector);
            if (el) {
                console.log('[FixMyPrompt EXTENSIVE LOG] ✅ Found input element:', selector);
                return el;
            }
        }
        console.log('[FixMyPrompt EXTENSIVE LOG] ❌ Could not find input element');
        return null;
    }
    
    function captureAndSavePrompt() {
        console.log('[FixMyPrompt EXTENSIVE LOG] ===== captureAndSavePrompt() CALLED =====');
        
        const inputElement = findInputElement();
        if (!inputElement) {
            console.log('[FixMyPrompt EXTENSIVE LOG] ERROR: No input element to capture from');
            return;
        }
        
        console.log('[FixMyPrompt EXTENSIVE LOG] Found input element, extracting text');
        const promptText = (inputElement.textContent || inputElement.value || '').trim();
        console.log('[FixMyPrompt EXTENSIVE LOG] Prompt text length:', promptText.length);
        console.log('[FixMyPrompt EXTENSIVE LOG] Prompt text:', promptText.substring(0, 100));
        
        if (!promptText || promptText.length === 0) {
            console.log('[FixMyPrompt EXTENSIVE LOG] WARNING: Empty prompt, skipping');
            return;
        }
        
        console.log('[FixMyPrompt EXTENSIVE LOG] SUCCESS: Prompt captured, length:', promptText.length);
        
        try {
            // Detect domain
            const domain = domainDetector.detectDomain(promptText);
            console.log('[FixMyPrompt EXTENSIVE LOG] Detected domain:', domain);
            
            // Initialize context if needed
            if (!incrementalContextManager.currentContext) {
                console.log('[FixMyPrompt EXTENSIVE LOG] Initializing context');
                incrementalContextManager.initializeContext();
            }
            
            // Save prompt
            console.log('[FixMyPrompt EXTENSIVE LOG] Saving prompt to context');
            incrementalContextManager.addPromptToContext(promptText, domain);
            console.log('[FixMyPrompt EXTENSIVE LOG] ✅ PROMPT SAVED');
        } catch (error) {
            console.error('[FixMyPrompt EXTENSIVE LOG] ❌ Error saving prompt:', error);
        }
    }
    
    // Setup Enter key listener
    function setupEnterKeyListener() {
        console.log('[FixMyPrompt EXTENSIVE LOG] Setting up Enter key listener');
        
        const inputEl = findInputElement();
        if (!inputEl) {
            console.log('[FixMyPrompt EXTENSIVE LOG] ERROR: Cannot attach listener - input element not found');
            console.log('[FixMyPrompt EXTENSIVE LOG] Tried selectors:', inputSelectors);
            return;
        }
        
        console.log('[FixMyPrompt EXTENSIVE LOG] SUCCESS: Found input element');
        console.log('[FixMyPrompt EXTENSIVE LOG] Input tag:', inputEl.tagName);
        console.log('[FixMyPrompt EXTENSIVE LOG] Input id:', inputEl.id);
        console.log('[FixMyPrompt EXTENSIVE LOG] Input class:', inputEl.className);
        
        // Attach directly to input element for better event capture
        inputEl.addEventListener('keydown', (e) => {
            console.log('[FixMyPrompt EXTENSIVE LOG] [KEYDOWN EVENT] Key:', e.key, 'Shift:', e.shiftKey);
            
            if (e.key === 'Enter' && !e.shiftKey) {
                console.log('[FixMyPrompt EXTENSIVE LOG] SUCCESS: ENTER KEY PRESSED (not Shift+Enter)');
                console.log('[FixMyPrompt EXTENSIVE LOG] CAPTURING IMMEDIATELY (before ChatGPT clears input)');
                // CRITICAL FIX: Capture IMMEDIATELY, not in setTimeout
                // ChatGPT clears the input right after Enter, so we must capture now
                captureAndSavePrompt();
            } else {
                console.log('[FixMyPrompt EXTENSIVE LOG] SKIPPED: Not Enter or Shift+Enter held');
            }
        }, true);
        
        console.log('[FixMyPrompt EXTENSIVE LOG] SUCCESS: Enter key listener attached to input element');
    }
    
    // Setup mutation observer to re-attach if needed
    function setupMutationObserver() {
        console.log('[FixMyPrompt EXTENSIVE LOG] Setting up MutationObserver');
        
        let lastInputElement = findInputElement();
        
        const observer = new MutationObserver(() => {
            const currentInputElement = findInputElement();
            if (currentInputElement && currentInputElement !== lastInputElement) {
                console.log('[FixMyPrompt EXTENSIVE LOG] Input element changed, re-attaching listeners');
                lastInputElement = currentInputElement;
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        console.log('[FixMyPrompt EXTENSIVE LOG] ✅ MutationObserver active');
    }
    
    // Start monitoring
    const inputElement = findInputElement();
    console.log("[FixMyPrompt EXTENSIVE LOG] findInputElement() returned:", !!inputElement);
    if (!inputElement) {
        console.log('[FixMyPrompt EXTENSIVE LOG] Input element not found yet, retrying in 500ms');
        setTimeout(() => monitorChatGPTInput(), 500);
        return;
    }
    
    setupEnterKeyListener();
    setupMutationObserver();
    
    console.log('[FixMyPrompt EXTENSIVE LOG] ===== monitorChatGPTInput() SETUP COMPLETE =====');
}


// Auto-capture monitoring function (v0.2.2 fix)

let isProcessing = false;
let lastThreadId = null;
let hasImprovedInThread = false;
let originalPrompt = null;
let improvedPrompt = null;
let currentDomain = null;

/**
 * Inject the "Improve" button using overlay approach
 */

/**
 * Find the prompt input element
 */

export function injectButton() {
    console.log('[FixMyPrompt EXTENSIVE LOG] ===== injectButton() CALLED =====');
    console.log('[FixMyPrompt EXTENSIVE LOG] Time:', new Date().toISOString());
    const platform = detectPlatform();
    if (!platform) {
        console.warn("[EXT] FixMyPrompt Unknown platform, not injecting button");
        return;
    }
    
    // Check if button already exists
    if (document.getElementById(UI.buttonId)) {
        console.log("[EXT] FixMyPrompt Button already injected");
        setupTextareaListener(platform);
        console.log('[FixMyPrompt EXTENSIVE LOG] About to call monitorChatGPTInput()');
        monitorChatGPTInput();
        console.log('[FixMyPrompt EXTENSIVE LOG] monitorChatGPTInput() returned'); // Start auto-capture monitoring
        return;
    }
    
    console.log(`[EXT] FixMyPrompt Injecting button on ${platform}`);
    
    // Find the input element using the same logic as prompt capture
    const inputElement = findPromptInput(platform);
    console.log('[FixMyPrompt EXTENSIVE LOG] Checking for input element...');
    if (!inputElement) {
        console.log('[FixMyPrompt EXTENSIVE LOG] ❌ NO INPUT ELEMENT FOUND - Selectors tried:', INPUT_SELECTORS);
        console.warn("[EXT] FixMyPrompt Could not find input element");
        return;
    }
    
    console.log("[EXT] FixMyPrompt Found input element:", inputElement.tagName, inputElement.className);
    
    // Create button container
    const buttonContainer = createButtonContainer();
    
    // Create wrapper div for buttons - use fixed positioning overlay
    const wrapper = document.createElement("div");
    wrapper.id = UI.buttonId;
    wrapper.style.cssText = `
        position: fixed;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
    `;
    wrapper.appendChild(buttonContainer);
    
    // Initially disable buttons
    const improveBtn = buttonContainer.querySelector("#fixmyprompt-improve-btn");
    
    improveBtn.disabled = true;
    improveBtn.style.opacity = "0.5";
    improveBtn.style.cursor = "not-allowed";
    
    // Add to document body
    document.body.appendChild(wrapper);
    
    // Function to update button position based on input element location
    function updateButtonPosition() {
        console.log('[FixMyPrompt POSITIONING] Called');
        const rect = inputElement.getBoundingClientRect();
        console.log('[FixMyPrompt POSITIONING] rect.top:', rect.top, 'rect.right:', rect.right);
        // Check if input is visible on screen (top within viewport, not just > 0)
        // Allow negative top values (input scrolled up) as long as bottom is visible
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
            wrapper.style.top = (rect.top - 50) + 'px';
            wrapper.style.right = (window.innerWidth - rect.right) + 'px';
            wrapper.style.display = 'flex';
            console.log('[FixMyPrompt POSITIONING] Applied - top:', wrapper.style.top, 'right:', wrapper.style.right);
            const computed = window.getComputedStyle(wrapper);
            console.log('[FixMyPrompt POSITIONING] Wrapper visible:', wrapper.offsetParent !== null);
            console.log('[FixMyPrompt POSITIONING] Computed top:', computed.top, 'right:', computed.right);
        } else {
            wrapper.style.display = 'none';
        }
    }
    
    // Update position on scroll and resize
    window.addEventListener('scroll', updateButtonPosition);
    window.addEventListener('resize', updateButtonPosition);
    
    // Watch for input element position changes
    const observer = new MutationObserver(() => {
        console.log('[FixMyPrompt POSITIONING] Input element changed, updating position');
        updateButtonPosition();
    });
    observer.observe(inputElement, {attributes: true, attributeFilter: ['style', 'class']});
    
    // Watch for DOM changes (input element might be moved)
    const bodyObserver = new MutationObserver(() => {
        updateButtonPosition();
    });
    bodyObserver.observe(document.body, {childList: true, subtree: true});
    
    // Initial position
    updateButtonPosition();
    
    console.log("[EXT] FixMyPrompt Button injected successfully");
    setupTextareaListener(platform, inputElement);
    
    // Start auto-capture monitoring for prompts
    console.log('[FixMyPrompt EXTENSIVE LOG] About to call monitorChatGPTInput() from injectButton');
    monitorChatGPTInput();
    console.log('[FixMyPrompt EXTENSIVE LOG] monitorChatGPTInput() returned from injectButton');
    
    // Listen for balloon improve button clicks (legacy — no questions)
    document.addEventListener('fixmyprompt-improve-click', (event) => {
        console.log('[FixMyPrompt] Balloon improve button clicked, triggering modal');
        handleImproveClick();
    });

    // Listen for balloon question flow completion — opens existing modal with result
    document.addEventListener('fixmyprompt-balloon-improve-done', (event) => {
        const { original, improved, score, domain, gaps, changes, suggestions } = event.detail || {};
        console.log('[FixMyPrompt] Balloon improve done, opening modal with result');

        // Derive scores the same way handleImproveClick does
        let originalScore, improvedScore;
        if (score && typeof score === 'object' && score.before !== undefined && score.after !== undefined) {
            originalScore = score.before;
            improvedScore = score.after;
        } else if (score && typeof score === 'number') {
            improvedScore = score;
            originalScore = Math.max(1, improvedScore - 3);
        } else {
            originalScore = 0;
            improvedScore = 0;
        }

        // Format gaps if needed
        let formattedSuggestions = suggestions;
        if (!formattedSuggestions && gaps && gaps.length > 0) {
            formattedSuggestions = formatStringGapsToSuggestions(gaps);
        }

        const modal = createImprovedModal({
            original: original || capturePrompt(),
            improved,
            originalScore,
            improvedScore,
            changes: changes || [],
            suggestions: formattedSuggestions || null,
            domain: domain || currentDomain,
            isRefinement: true,
            gaps: gaps || []
        });

        renderImprovedModal(modal);
    });
}

/**
 * Create button container with Improve button
 */
function createButtonContainer() {
    const container = document.createElement("div");
    container.style.cssText = `
        display: flex;
        gap: 8px;
        align-items: center;
    `;
    
    // Improve button
    const improveBtn = document.createElement("button");
    improveBtn.id = "fixmyprompt-improve-btn";
    improveBtn.innerHTML = "✨ Improve";
    improveBtn.style.cssText = `
        padding: 10px 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        white-space: nowrap;
    `;
    
    improveBtn.addEventListener("mouseenter", () => {
        if (!improveBtn.disabled) {
            improveBtn.style.transform = "scale(1.05)";
            improveBtn.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.6)";
        }
    });
    
    improveBtn.addEventListener("mouseleave", () => {
        improveBtn.style.transform = "scale(1)";
        improveBtn.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.4)";
    });
    
    improveBtn.addEventListener("click", handleImproveClick);
    
    container.appendChild(improveBtn);
    
    return container;
}

/**
 * Handle Improve button click
 * @param {Object} [options] - Optional options
 * @param {Object} [options.refinementAnswers] - Answers from balloon question flow
 * @param {string} [options.contextSummary] - Human-readable summary of answers
 */
async function handleImproveClick(options = {}) {
    const { refinementAnswers = null, contextSummary = null } = options;
    console.log("[FixMyPrompt DEBUG] handleImproveClick() called");
    console.log("[FixMyPrompt DEBUG] incrementalContextManager exists:", !!incrementalContextManager);
    console.log("[FixMyPrompt DEBUG] incrementalContextManager.currentContext exists:", !!incrementalContextManager?.currentContext);
    
    // CRITICAL FIX: Initialize context if it doesn't exist
    if (!incrementalContextManager.currentContext) {
        console.log("[FixMyPrompt DEBUG] Context is null, initializing...");
        incrementalContextManager.initializeContext();
        console.log("[FixMyPrompt DEBUG] Context initialized");
    }
    
    if (isProcessing) {
        showToast("Already processing a prompt...", "info");
        return;
    }
    
    isProcessing = true;
    
    try {
        // Capture the prompt
        const prompt = capturePrompt();
        if (!prompt) {
            showError("Could not capture prompt");
            isProcessing = false;
            return;
        }
        
        // Validate prompt length
        if (!validatePromptLength(prompt)) {
            showError("Prompt is too short or too long");
            isProcessing = false;
            return;
        }
        
        originalPrompt = prompt;
        
        // Show progress modal
        showProgressModal();
        
        // Detect domain (try backend first, fallback to local)
        console.log('[EXT] FixMyPrompt Attempting backend domain detection...');
        const backendDomain = await backendAPI.detectDomain(prompt);
        if (backendDomain && backendDomain.domain) {
            currentDomain = backendDomain.domain;
            console.log(`[EXT] FixMyPrompt Detected domain (backend): ${currentDomain}`);
        } else {
            currentDomain = domainDetector.detectDomain(prompt);
            console.log(`[EXT] FixMyPrompt Detected domain (local fallback): ${currentDomain}`);
        }
        
        // Run MockBackendAnalyzer to get gaps for Manual tab
        console.log('[EXT] FixMyPrompt Running MockBackendAnalyzer to get gaps...');
        const mockAnalysis = await mockBackend.analyze(prompt);
        let gapsData = [];
        if (mockAnalysis && mockAnalysis.gaps) {
            gapsData = mockAnalysis.gaps;
            console.log('[EXT] FixMyPrompt Gaps from analysis:', gapsData.length, 'gaps');
        }
        
        // Extract recent messages from conversation (last 10)
        const recentMessages = extractRecentMessages(detectPlatform(), 10);
        console.log(`[EXT] FixMyPrompt Extracted ${recentMessages.length} recent messages`);
        
        // Set initial domain on first prompt
        if (incrementalContextManager.currentContext.prompts.length === 0) {
            incrementalContextManager.setInitialDomain(currentDomain);
        }
        
        // IMPORTANT: Add current prompt to context BEFORE building API context
        // This ensures the prompt is in the stored prompts array
        console.log('[FixMyPrompt DEBUG] About to add prompt to context');
        console.log('[FixMyPrompt DEBUG] Prompt:', prompt.substring(0, 50) + '...');
        console.log('[FixMyPrompt DEBUG] Domain:', currentDomain);
        incrementalContextManager.addPromptToContext(prompt, currentDomain);
        console.log(`[FixMyPrompt DEBUG] Current prompt added to context`);
        console.log('[FixMyPrompt DEBUG] Context after adding prompt:', incrementalContextManager.currentContext.prompts.length, 'prompts');
        
        // Update conversation history with last 10 messages
        incrementalContextManager.updateConversationHistory(recentMessages);
        console.log(`[EXT] FixMyPrompt Updated conversation history with ${recentMessages.length} messages`);
        
        // Build context for API call (includes all previous prompts + baseline improvement)
        const accumulatedContext = incrementalContextManager.buildContextForAPI(prompt, currentDomain);
        console.log(`[EXT] FixMyPrompt Context built with ${accumulatedContext.context.previousPrompts?.length || 0} previous prompts`);
        
        // DETAILED LOGGING: Log exactly what we're sending to backend
        const apiPayload = {
            action: "fixPrompt",
            prompt: prompt,
            platform: detectPlatform(),
            domain: accumulatedContext.domain,
            context: accumulatedContext,
            recentMessages: recentMessages,
            ...(refinementAnswers ? { refinementAnswers } : {})
        };
        if (refinementAnswers) {
            console.log('[EXT] FixMyPrompt Balloon question answers included:', refinementAnswers);
        }
        
        console.log('[EXT] FixMyPrompt ===== BACKEND API PAYLOAD =====');
        console.log('[EXT] FixMyPrompt Action:', apiPayload.action);
        console.log('[EXT] FixMyPrompt Prompt:', apiPayload.prompt);
        console.log('[EXT] FixMyPrompt Platform:', apiPayload.platform);
        console.log('[EXT] FixMyPrompt Domain:', apiPayload.domain);
        console.log('[EXT] FixMyPrompt Context.domain:', apiPayload.context.domain);
        console.log('[EXT] FixMyPrompt Context.prompt:', apiPayload.context.context.prompt);
        console.log('[EXT] FixMyPrompt Previous Prompts Count:', apiPayload.context.context.previousPrompts?.length || 0);
        console.log('[EXT] FixMyPrompt Previous Prompts:', apiPayload.context.context.previousPrompts);
        console.log('[EXT] FixMyPrompt Previous Prompts (JSON):', JSON.stringify(apiPayload.context.context.previousPrompts, null, 2));
        console.log('[EXT] FixMyPrompt Conversation History Count:', apiPayload.context.context.conversationHistory?.length || 0);
        console.log('[EXT] FixMyPrompt Conversation Topic:', apiPayload.context.context.conversationTopic);
        console.log('[EXT] FixMyPrompt Last Improvement:', apiPayload.context.context.lastImprovement);
        console.log('[EXT] FixMyPrompt Last Improvement (JSON):', JSON.stringify(apiPayload.context.context.lastImprovement, null, 2));
        console.log('[EXT] FixMyPrompt Recent Messages Count:', apiPayload.recentMessages?.length || 0);
        console.log('[EXT] FixMyPrompt FULL PAYLOAD (JSON):', JSON.stringify(apiPayload, null, 2));
        console.log('[EXT] FixMyPrompt ===== END BACKEND API PAYLOAD =====');
        
        // Try backend API first for improvement + scoring
        console.log('[EXT] FixMyPrompt Attempting backend improvement...');
        let response = null;
        let backendSuccess = false;
        
        try {
            const backendResult = await backendAPI.improvePrompt(prompt, detectPlatform(), currentDomain, accumulatedContext, refinementAnswers);
            if (backendResult && backendResult.improved) {
                console.log('[EXT] FixMyPrompt Backend improvement successful');
                response = {
                    success: true,
                    improved: backendResult.improved,
                    score: backendResult.score,
                    changes: backendResult.changes,
                    gaps: backendResult.gaps,
                    suggestions: backendResult.suggestions
                };
                backendSuccess = true;
            } else {
                console.log('[EXT] FixMyPrompt Backend returned no improvement, falling back to service worker');
            }
        } catch (backendError) {
            console.log('[EXT] FixMyPrompt Backend API failed, falling back to service worker:', backendError.message);
        }
        
        // Fallback to service worker if backend failed
        if (!backendSuccess) {
            console.log('[EXT] FixMyPrompt Calling service worker for local improvement...');
            response = await sendMessage(apiPayload);
        } else if (backendSuccess && (!response.changes || response.changes.length === 0)) {
            // If backend succeeded but didn't return changes, get them from service worker
            console.log('[EXT] FixMyPrompt Backend returned no changes, calling service worker for change analysis...');
            const swResponse = await sendMessage(apiPayload);
            if (swResponse && swResponse.changes) {
                response.changes = swResponse.changes;
                console.log('[EXT] FixMyPrompt Changes retrieved from service worker');
            }
        }
        
        console.log(`[EXT] FixMyPrompt API response received, success: ${response.success}, source: ${backendSuccess ? 'backend' : 'local'}`);
        
        // Close progress modal
        closeProgressModal();
        
        if (response.success) {
            improvedPrompt = response.improved;
            
            // Create and render modal with score from API response
            // FIX: Extract both before and after scores
            let originalScore, improvedScore;
            if (response.score && typeof response.score === 'object' && response.score.before && response.score.after) {
                originalScore = response.score.before;
                improvedScore = response.score.after;
            } else if (response.score && typeof response.score === 'number') {
                improvedScore = response.score;
                originalScore = Math.max(1, improvedScore - 3);
            } else {
                originalScore = 0;
                improvedScore = 0;
            }
            
            console.log('[EXT] FixMyPrompt Score values - Original:', originalScore, 'Improved:', improvedScore);
            
            // Generate suggestions from gaps if not provided by backend
            let suggestions = response.suggestions;
            if (!suggestions && response.gaps) {
                suggestions = formatStringGapsToSuggestions(response.gaps);
                console.log('[EXT] FixMyPrompt Generated suggestions from string gaps');
            }
            
            const modal = createImprovedModal({
                original: prompt,
                improved: response.improved,
                originalScore: originalScore,
                improvedScore: improvedScore,
                changes: response.changes,
                suggestions: suggestions || null,
                domain: currentDomain,
                isRefinement: response.isRefinement || false,
                gaps: gapsData || response.gaps || []
            });
            
            renderImprovedModal(modal);
            
            // Store improvement as baseline for next improve
            incrementalContextManager.storeImprovement({
                originalScore: originalScore,
                improvedScore: improvedScore,
                isRefinement: response.isRefinement || false,
                improvedText: response.improved
            });
            console.log('[EXT] FixMyPrompt Improvement stored as baseline context');
            
            showSuccess("Improvement generated!", true);
        } else {
            showError(response.error || "Failed to improve prompt");
        }
    } catch (error) {
        console.error("[EXT] FixMyPrompt Error:", error);
        closeProgressModal();
        showError("An error occurred: " + error.message);
    } finally {
        isProcessing = false;
    }
}

/**
 * Setup input element listener to enable/disable button
 */
function setupTextareaListener(platform, inputElement) {
    console.log('[FixMyPrompt EXTENSIVE LOG] Checking for input element...');
    if (!inputElement) {
        console.log('[FixMyPrompt EXTENSIVE LOG] ❌ NO INPUT ELEMENT FOUND - Selectors tried:', INPUT_SELECTORS);
        console.warn("[EXT] FixMyPrompt Input element not found for listener setup");
        return;
    }
    
    const improveBtn = document.querySelector("#fixmyprompt-improve-btn");
    if (!improveBtn) {
        console.warn("[EXT] FixMyPrompt Improve button not found");
        return;
    }
    
    function updateButtonState() {
        const text = getElementText(inputElement);
        const hasText = text && text.trim().length > 0;
        
        // Always check for new conversation first (ensures currentConversationId is fresh)
        checkForNewConversation();
        
        // Check if we're in an existing thread (not first prompt of conversation)
        const isExistingThread = currentConversationId && balloonShownInCurrentConversation;
        
        if (isExistingThread) {
            // Disable button in existing threads until context memory v2 is ready
            improveBtn.disabled = true;
            improveBtn.style.opacity = "0.4";
            improveBtn.style.cursor = "not-allowed";
            improveBtn.title = "Context-aware improvements coming soon (v0.2.0)";
        } else {
            // Normal behavior: enable if text present
            improveBtn.disabled = !hasText;
            improveBtn.style.opacity = hasText ? "1" : "0.5";
            improveBtn.style.cursor = hasText ? "pointer" : "not-allowed";
            improveBtn.title = "Improve your prompt";
        }
    }
    
    // Listen for input changes
    inputElement.addEventListener('input', updateButtonState);
    inputElement.addEventListener('change', updateButtonState);
    inputElement.addEventListener('paste', () => setTimeout(updateButtonState, 10));
    
    // Also listen for mutations in case content changes via other means
    const observer = new MutationObserver(updateButtonState);
    observer.observe(inputElement, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    // PHASE 3 v0.1.0: Initialize InputMonitor with 2.5s pause threshold (user needs time to finish thought)
    console.log('[FixMyPrompt] Initializing InputMonitor with 2.5s pause threshold');
    const inputMonitor = new InputMonitor(inputElement, { pauseThreshold: 2500 });
    
    // PHASE 4: Initialize AutoDetectBalloon UI
    console.log('[FixMyPrompt] Initializing AutoDetectBalloon');
    const balloon = new AutoDetectBalloon();
    
    // PHASE 4: Initialize MockBackendAnalyzer for testing
    console.log('[FixMyPrompt] Initializing MockBackendAnalyzer');
    mockBackend = new MockBackendAnalyzer();
    
    // PHASE 4: Balloon state tracking
    // lastShownText tracks the TEXT that was actually SHOWN in the balloon (not just analyzed)
    // This is reset when user dismisses, so they can re-trigger the balloon by rewriting
    let lastShownText = '';
    let lastShownTime = 0;
    let balloonDismissed = false; // tracks if user explicitly dismissed
    const DEBOUNCE_INTERVAL = 5000; // 5 seconds between balloon shows for same session
    const IMPROVEMENT_THRESHOLD = 7; // Only show if score < 7
    
    // Conversation tracking (v0.1.29)
    // Detect when user starts a NEW conversation vs. replying in existing thread
    let currentConversationId = null;
    let balloonShownInCurrentConversation = false; // Track if balloon already shown in this conversation
    
    // Set initial button state NOW that variables are declared
    updateButtonState();
    
    function detectConversationId() {
        // ChatGPT: Look for conversation ID in URL or DOM
        const urlMatch = window.location.href.match(/\/c\/([a-z0-9-]+)/);
        if (urlMatch) return urlMatch[1];

        // Claude: Look for conversation ID in URL
        const claudeMatch = window.location.href.match(/\/chat\/([a-z0-9-]+)/);
        if (claudeMatch) return claudeMatch[1];

        // No conversation ID yet (new chat page) — return null
        return null;
    }

    function checkForNewConversation() {
        const newConvId = detectConversationId();

        // No change
        if (newConvId === currentConversationId) return false;

        const prevId = currentConversationId;
        currentConversationId = newConvId;

        // null → real ID: ChatGPT/Claude just assigned a URL to the conversation
        // after the first message was sent. This is the SAME conversation — do NOT reset.
        if (!prevId && newConvId) {
            console.log('[FixMyPrompt] Conversation assigned ID:', newConvId, '(same session, balloon state preserved)');
            return false;
        }

        // real ID → different real ID, or real ID → null (back to new chat): genuinely new conversation
        console.log('[FixMyPrompt] New conversation detected:', newConvId, '(was:', prevId, ')');
        balloonShownInCurrentConversation = false;
        lastShownText = '';
        lastShownTime = 0;
        balloonDismissed = false;
        return true;
    }
    
    // Listen for dismiss events from balloon - reset state so user can re-trigger
    document.addEventListener('fixmyprompt-balloon-dismissed', () => {
        console.log('[FixMyPrompt] Balloon dismissed - resetting state so user can re-trigger on any new prompt');
        balloonDismissed = true;
        lastShownText = ''; // Reset so any new prompt (even same text) can re-trigger
        lastShownTime = 0;  // Reset debounce window so 5s cooldown doesn't block re-trigger
    });

    // Listen for improve-done events from balloon - also reset state so rewriting re-triggers
    document.addEventListener('fixmyprompt-balloon-improve-done', () => {
        console.log('[FixMyPrompt] Balloon improve done - resetting state so rewrite can re-trigger balloon');
        balloonDismissed = true;
        lastShownText = ''; // Critical: clear so next distinct prompt text triggers balloon again
        lastShownTime = 0;
    });
    
    // Register pause detection listener - triggers hybrid analysis
    inputMonitor.on('onPause', async (data) => {
        console.log('[FixMyPrompt] InputMonitor: Pause detected, text length:', data.length);
        
        // Check for new conversation (v0.1.29)
        const isNewConversation = checkForNewConversation();
        
        // Only show balloon on FIRST prompt of new conversation
        if (balloonShownInCurrentConversation && !isNewConversation) {
            console.log('[FixMyPrompt] Balloon already shown in this conversation, skipping (pending context memory v2)');
            console.log('[FixMyPrompt] Users can still click "Improve" button for manual analysis');
            return;
        }
        
        const now = Date.now();
        const timeSinceLastShow = now - lastShownTime;
        const isSameText = data.text === lastShownText;
        
        // Skip if exact same text as what was last shown in balloon
        if (isSameText && lastShownText !== '') {
            console.log('[FixMyPrompt] Debounce: Same text as last shown, skipping');
            return;
        }
        
        // Skip if balloon was shown recently (within 5s) for a DIFFERENT text
        // (prevents rapid re-triggering while user is still editing)
        if (!isSameText && lastShownText !== '' && timeSinceLastShow < DEBOUNCE_INTERVAL) {
            console.log('[FixMyPrompt] Debounce: Balloon shown recently (<5s), skipping');
            return;
        }
        
        // SHOW BALLOON: First prompt of new conversation (v0.1.29)
        console.log('[FixMyPrompt] Showing balloon - first prompt or post-dismiss rewrite');
        balloon.showAnalyzing();
        
        try {
            // Use mock backend for Phase 4 testing
            const analysis = await mockBackend.analyze(data.text);
            if (analysis) {
                console.log('[FixMyPrompt] Analysis complete:', {
                    domain: analysis.domain,
                    score: analysis.score,
                    source: analysis.source,
                    gaps: analysis.gaps.length,
                    downsides: analysis.downsides.length
                });
                
                // Only show balloon if improvement needed (score < threshold)
                if (analysis.score < IMPROVEMENT_THRESHOLD) {
                    console.log('[FixMyPrompt] Score', analysis.score, '< threshold, showing balloon');
                    balloon.currentPrompt = data.text; // capture prompt at analysis time
                    balloon.showResults(analysis);
                    balloon.autoHide(10000); // 10 seconds display time
                    
                    // Update tracking - only mark as "shown" when balloon actually appears
                    lastShownText = data.text;
                    lastShownTime = now;
                    balloonDismissed = false; // reset dismiss flag
                    balloonShownInCurrentConversation = true; // Mark as shown in this conversation (v0.1.29)
                } else {
                    console.log('[FixMyPrompt] Score', analysis.score, '>= threshold, showing checkmark indicator');
                    balloon.showCheckmarkIndicator(); // Show subtle checkmark instead of balloon
                    balloon.autoHide(3000); // 3 seconds display time for checkmark
                }
            }
        } catch (error) {
            console.error('[FixMyPrompt] Analysis error:', error);
            balloon.hide(); // hide on error
        }
    });
    
    // Register focus loss listener - triggers hybrid analysis
    inputMonitor.on('onFocusLoss', async (data) => {
        console.log('[FixMyPrompt] InputMonitor: Focus loss detected, text length:', data.length);
        console.log('[FixMyPrompt] Triggering hybrid analysis on focus loss...');
        
        try {
            const analysis = await mockBackend.analyze(data.text);
            if (analysis) {
                console.log('[FixMyPrompt] Analysis complete (focus loss):', {
                    domain: analysis.domain,
                    score: analysis.score,
                    source: analysis.source
                });
            }
        } catch (error) {
            console.error('[FixMyPrompt] Analysis error (focus loss):', error);
        }
    });
    
    // Start monitoring
    inputMonitor.start();
    console.log('[FixMyPrompt] InputMonitor and PromptAnalyzer started successfully');

}

/**
 * Re-inject button if it's missing (for dynamic page updates)
 */
export function reinjectButtonIfMissing() {
    if (!document.getElementById(UI.buttonId)) {
        console.log("[EXT] FixMyPrompt Button missing, re-injecting");
        injectButton();
    }
}

// Re-check button every 2 seconds
setInterval(reinjectButtonIfMissing, 2000);


// ============================================================================
// PASTE DETECTION & SUBMIT DETECTION (4-Method Approach)
// ============================================================================

/**
 * Initialize paste and submit detection
 * Handles: typing, pasting, Enter key, send button click, and voice input
 */
function initializePasteAndSubmitDetection() {
    let currentDraft = '';
    let processingLock = false;

    // ===== METHOD 1: PASTE EVENT DETECTION =====
    document.addEventListener('paste', async (e) => {
        const target = e.target;

        // Check if paste is in a text input area
        const isTextarea = target.tagName === 'TEXTAREA';
        const isContentEditable = target.contentEditable === 'true';
        const isChatGPTInput = target.id === 'prompt-textarea';
        
        // KEY FIX: ProseMirror fires paste on inner <p> child — use closest() not ===
        const isInsideChatGPTInput = !!target.closest('#prompt-textarea');

        const isValid = isTextarea || isContentEditable || isChatGPTInput || isInsideChatGPTInput;

        if (!isValid) return; // Not our input — ignore

        console.log('[FixMyPrompt] Paste detected in valid input area');

        // KEY FIX: Wait 100ms — paste content is not in DOM at event fire time
        setTimeout(() => {
            // KEY FIX: Read from ROOT, not from target child <p>
            const inputRoot = document.querySelector('#prompt-textarea') || target;
            const pastedText = inputRoot.value
                || inputRoot.innerText
                || inputRoot.textContent
                || '';

            currentDraft = pastedText.trim();
            console.log('[FixMyPrompt] Paste content captured, length:', currentDraft.length);
        }, 100);
    });

    // ===== METHOD 2: KEYDOWN ENTER DETECTION =====
    document.addEventListener('keydown', async (e) => {
        if (e.key !== 'Enter' || e.shiftKey || e.ctrlKey || e.metaKey) return;

        const target = e.target;
        const isTextarea = target.tagName === 'TEXTAREA';
        const isContentEditable = target.contentEditable === 'true';
        const isInsideChatGPTInput = !!target.closest('#prompt-textarea');

        if (!isTextarea && !isContentEditable && !isInsideChatGPTInput) return;

        if (currentDraft.trim().length === 0) return; // Nothing to process

        if (processingLock) return; // Already processing

        processingLock = true;
        console.log('[FixMyPrompt] Enter key detected, processing prompt');

        await processPrompt(currentDraft);
        currentDraft = '';

        setTimeout(() => { processingLock = false; }, 500);
    });

    // ===== METHOD 3: SEND BUTTON CLICK DETECTION =====
    document.addEventListener('click', async (e) => {
        const button = e.target.closest('button');
        if (!button) return;

        // ChatGPT send button patterns
        const isSendButton = 
            button.getAttribute('aria-label')?.toLowerCase().includes('send') ||
            button.innerHTML?.toLowerCase().includes('send') ||
            button.className?.includes('send') ||
            button.className?.includes('submit');

        if (!isSendButton) return;

        if (currentDraft.trim().length === 0) return;

        if (processingLock) return;

        processingLock = true;
        console.log('[FixMyPrompt] Send button clicked, processing prompt');

        await processPrompt(currentDraft);
        currentDraft = '';

        setTimeout(() => { processingLock = false; }, 500);
    });

    // ===== METHOD 4: MUTATION OBSERVER (Most Reliable for ChatGPT) =====
    (function attachSubmitObserver() {
        let lastObservedText = '';
        let observerLock = false;

        const observerCallback = async (mutationsList) => {
            for (const mutation of mutationsList) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue; // Element nodes only

                    // Check if this node IS a user message, or CONTAINS one
                    const userMsgEl =
                        (node.getAttribute?.('data-message-author-role') === 'user')
                            ? node
                            : node.querySelector?.('[data-message-author-role="user"]');

                    if (!userMsgEl) continue;

                    const msgText = (userMsgEl.innerText || userMsgEl.textContent || '').trim();

                    if (!msgText || msgText.length < 2) continue;  // Too short — skip
                    if (msgText === lastObservedText) continue;     // Re-render — skip
                    if (observerLock) continue;                      // Already processing — skip

                    observerLock = true;
                    lastObservedText = msgText;

                    // Check if keydown/button already handled this submit
                    if (currentDraft.trim().length === 0) {
                        observerLock = false;
                        continue;
                    }

                    // Keydown/button missed this submit — MutationObserver takes over
                    console.log('[FixMyPrompt] MutationObserver detected message submission');
                    const textToProcess = msgText;
                    currentDraft = '';
                    
                    await processPrompt(textToProcess);

                    // 500ms cooldown before unlocking
                    setTimeout(() => { observerLock = false; }, 500);
                }
            }
        };

        // Observe at container level for efficiency
        const container = document.querySelector('main')
            || document.querySelector('[class*="conversation"]')
            || document.querySelector('[class*="chat"]')
            || document.body;

        const observer = new MutationObserver(observerCallback);
        observer.observe(container, { childList: true, subtree: true });
        
        console.log('[FixMyPrompt] MutationObserver attached for submit detection');
    })();

    console.log('[FixMyPrompt] Paste and submit detection initialized');
}

/**
 * Process captured prompt — save to incremental context when user submits.
 * Called by all 4 submit-detection methods (paste+Enter, keydown, send button, MutationObserver).
 */
async function processPrompt(promptText) {
    if (!promptText || promptText.trim().length === 0) return;
    console.log('[FixMyPrompt] processPrompt: saving submitted prompt to context, length:', promptText.length);

    try {
        const domain = domainDetector.detectDomain(promptText);

        if (!incrementalContextManager.currentContext) {
            incrementalContextManager.initializeContext();
        }

        incrementalContextManager.addPromptToContext(promptText, domain);
        console.log('[FixMyPrompt] processPrompt: prompt saved, domain:', domain);
    } catch (err) {
        console.error('[FixMyPrompt] processPrompt: error saving prompt:', err);
    }
}

// Initialize when extension loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePasteAndSubmitDetection);
} else {
    initializePasteAndSubmitDetection();
}
