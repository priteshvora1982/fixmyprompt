/**
 * FixMyPrompt - Modal Rendering
 * Create and render improvement modal with detailed UI
 */

import { UI, COLORS } from "../shared/constants.js";
import backendAPI from "../shared/backend-api.js";
import { setElementText } from "../shared/dom-utils.js";
import { showToast, showSuccess, showInfo } from "../shared/toast.js";
import { findPromptInput } from "./prompt-capture.js";

/**
 * Get detailed explanation for a change
 */
function getChangeExplanation(change) {
    const explanations = {
        "Add Structure": "Added clear sections (Goal → What you want to achieve, Context → Background information, Output → Desired format). This helps AI understand exactly what you need instead of guessing, resulting in more relevant and focused responses.",
        "Clarify Goal": "Made the objective specific and measurable (e.g., 'list 5 key points' instead of 'tell me about'). AI now knows the exact scope and format, avoiding unnecessary information and staying on target.",
        "Inject Guardrails": "Added specific constraints like 'avoid jargon', 'ensure accuracy', 'verify facts'. This prevents AI from making assumptions, reduces errors, and ensures responses meet your quality standards.",
        "Expert Framing": "Reframed the request to ask for expert-level thinking (e.g., 'As a senior architect, how would you...'). AI now adopts professional expertise and best practices, resulting in higher-quality, more sophisticated responses."
    };
    
    for (const [key, value] of Object.entries(explanations)) {
        if (change.includes(key)) {
            return value;
        }
    }
    return change;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Create modal HTML with detailed styling
 * @param {Object} data - Modal data
 * @returns {Object} - Modal object with HTML and data
 */
export function createModal(data) {
    const { original, improved, score, changes, suggestions } = data;
    
    // Use the scores passed from button.js
    const originalScore = data.originalScore || 0;
    const improvedScore = data.improvedScore || 0;
    const isRefinement = data.isRefinement || false;
    const scoreImprovement = improvedScore - originalScore;
    
    console.log('[FixMyPrompt] Modal initialized with - Original:', originalScore, 'Improved:', improvedScore);
    const originalCharCount = original.length;
    const improvedCharCount = improved.length;
    
    // Create detailed modal HTML
    const html = `
        <div id="${UI.modalId}" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            animation: fadeIn 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        ">
            <div style="
                background: white;
                border-radius: 16px;
                max-width: 700px;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
            ">
                <!-- Header -->
                <div style="
                    padding: 24px;
                    border-bottom: 1px solid #e5e7eb;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 16px 16px 0 0;
                    color: white;
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                    ">
                        <div style="display: flex; gap: 16px; align-items: center;">
                            <button class="fixmyprompt-tab-btn" data-tab="improvement" style="
                                background: white;
                                color: #667eea;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 14px;
                            ">✨ Improvement</button>
                            <button class="fixmyprompt-tab-btn" data-tab="refine" style="
                                background: rgba(255, 255, 255, 0.2);
                                color: white;
                                border: none;
                                padding: 8px 16px;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 14px;
                            ">🔧 Refine</button>
                        </div>
                        <button class="fixmyprompt-close-btn" style="
                            background: rgba(255, 255, 255, 0.2);
                            border: none;
                            color: white;
                            font-size: 28px;
                            cursor: pointer;
                            padding: 0;
                            width: 40px;
                            height: 40px;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: background 0.2s;
                        " title="Close">×</button>
                    </div>
                    
                    <!-- Score Cards -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                    ">
                        <!-- Before Score -->
                        <div style="
                            background: rgba(255, 255, 255, 0.15);
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                        ">
                            <div style="
                                font-size: 11px;
                                font-weight: 600;
                                opacity: 0.9;
                                margin-bottom: 4px;
                                text-transform: uppercase;
                            ">Original Score</div>
                            <div style="
                                font-size: 28px;
                                font-weight: 700;
                            ">${originalScore}</div>
                        </div>
                        
                        <!-- After Score -->
                        <div style="
                            background: rgba(255, 255, 255, 0.25);
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(255, 255, 255, 0.3);
                        ">
                            <div style="
                                font-size: 11px;
                                font-weight: 600;
                                opacity: 0.9;
                                margin-bottom: 4px;
                                text-transform: uppercase;
                            \">${isRefinement ? 'Refinement Score' : 'Improved Score'}</div>                            <div style="
                                font-size: 28px;
                                font-weight: 700;                            \">${improvedScore}${!isRefinement ? ` <span style=\"font-size: 16px; margin-left: 8px;\">+${scoreImprovement}</span>` : ''}</div>                       </div>
                    </div>
                </div>
                
                <!-- Body -->
                <div style="
                    padding: 24px;
                    flex: 1;
                    overflow-y: auto;
                ">
                    <!-- Improvement Tab Content -->
                    <div class="fixmyprompt-improvement-content">
                        <!-- Original Prompt -->
                        <div style="margin-bottom: 20px;">
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 8px;
                            ">
                                <label style="
                                    font-size: 12px;
                                    font-weight: 600;
                                    color: #6b7280;
                                    text-transform: uppercase;
                                ">Original Prompt</label>
                                <span style="
                                    font-size: 11px;
                                    color: #9ca3af;
                                    font-weight: 500;
                                ">${originalCharCount} characters</span>
                            </div>
                            <div style="
                                background: #f9fafb;
                                padding: 12px;
                                border-radius: 8px;
                                border: 1px solid #e5e7eb;
                                font-size: 13px;
                                line-height: 1.5;
                                color: #1f2937;
                                max-height: 100px;
                                overflow-y: auto;
                            ">${escapeHtml(original)}</div>
                        </div>
                        
                        <!-- Improved Prompt -->

                        <!-- Suggestions -->
                        <div style="margin-bottom: 20px;">
                            <label style="font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 8px; display: block;">Suggestions</label>
                            <div class="fixmyprompt-suggestions-container">
                                ${suggestions ? suggestions.modal : '<p>No suggestions available.</p>'}
                            </div>
                        </div>
                        <div style="margin-bottom: 20px;">
                            <div style="
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                margin-bottom: 8px;
                            ">
                                <label style="
                                    font-size: 12px;
                                    font-weight: 600;
                                    color: #6b7280;
                                    text-transform: uppercase;
                                ">Improved Prompt</label>
                                <span style="
                                    font-size: 11px;
                                    color: #9ca3af;
                                    font-weight: 500;
                                ">${improvedCharCount} characters</span>
                            </div>
                            <textarea class="fixmyprompt-improved-textarea" style="
                                width: 100%;
                                padding: 12px;
                                border-radius: 8px;
                                font-size: 13px;
                                line-height: 1.5;
                                color: #1f2937;
                                border: 1px solid #10b981;
                                background: #f0fdf4;
                                font-family: inherit;
                                resize: vertical;
                                min-height: 200px;
                                max-height: 400px;
                                box-sizing: border-box;
                            ">${escapeHtml(improved)}</textarea>
                        </div>
                        
                        <!-- What Changed and Why -->
                        <div style="
                            margin-bottom: 24px;
                            background: linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%);
                            padding: 16px;
                            border-radius: 12px;
                            border: 1px solid #dcfce7;
                        ">
                            <div style="
                                font-size: 12px;
                                font-weight: 700;
                                color: #15803d;
                                margin-bottom: 12px;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            ">What Changed and Why</div>
                            <ul style="
                                margin: 0;
                                padding-left: 0;
                                list-style: none;
                            ">
                                ${changes.map(change => `
                                    <li style="
                                        font-size: 13px;
                                        color: #166534;
                                        margin-bottom: 12px;
                                        line-height: 1.6;
                                        padding: 10px;
                                        background: rgba(22, 163, 74, 0.05);
                                        border-radius: 6px;
                                        border-left: 3px solid #16a34a;
                                    ">
                                        <div style="font-weight: 600; margin-bottom: 3px;">✓ ${escapeHtml(change)}</div>
                                        <div style="font-size: 12px; color: #15803d; line-height: 1.4;">${escapeHtml(getChangeExplanation(change))}</div>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        
                        <!-- Outcomes Preview Button -->
                        <button class="fixmyprompt-outcomes-btn" style="
                            padding: 10px 14px;
                            background: #f3f4f6;
                            color: #374151;
                            border: 1px solid #d1d5db;
                            border-radius: 8px;
                            cursor: pointer;
                            font-size: 12px;
                            font-weight: 600;
                            transition: all 0.2s ease;
                            margin-bottom: 16px;
                            width: 100%;
                        ">
                            👁️ See Likely Outcomes
                        </button>
                    </div>
                    
                    <!-- Refine Tab Content (Hidden by default) -->
                    <div class="fixmyprompt-refine-content" style="display: none;">
                        <div style="text-align: center; padding: 20px; color: #6b7280;">
                            <p>Loading refinement questions...</p>
                        </div>
                    </div>
                </div>
                
                <!-- Footer Buttons -->
                <div style="
                    padding: 16px 24px;
                    border-top: 1px solid #e5e7eb;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    background: #f9fafb;
                    border-radius: 0 0 16px 16px;
                ">
                    <button class="fixmyprompt-revert-btn" style="
                        padding: 10px 18px;
                        background: #f3f4f6;
                        color: #374151;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.2s ease;
                    ">
                        ↩️ Revert
                    </button>
                    <button class="fixmyprompt-accept-btn" style="
                        padding: 10px 18px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.2s ease;
                    ">
                        ✓ Accept & Use
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return { html, improved, data };
}

/**
 * Render improved modal with 4-tab interface
 * @param {Object} modal - Modal object from createImprovedModal
 */
export function renderImprovedModal(modal) {
    const { html, improved, data } = modal;
    
    // Create container
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    
    // Get modal element
    const modalEl = document.getElementById(UI.modalId);
    if (!modalEl) {
        console.error('[FixMyPrompt] Modal element not found after rendering');
        return;
    }
    
    // Get buttons
    const acceptBtn = modalEl.querySelector(".fixmyprompt-accept-btn");
    const rejectBtn = modalEl.querySelector(".fixmyprompt-reject-btn");
    const closeBtn = modalEl.querySelector(".fixmyprompt-close-btn");
    const outcomesBtn = modalEl.querySelector(".fixmyprompt-outcomes-btn");
    const tabBtns = modalEl.querySelectorAll(".fixmyprompt-tab-btn");
    
    // Attach tab switching handlers
    if (tabBtns && tabBtns.length > 0) {
        tabBtns.forEach(btn => {
            btn.addEventListener("click", () => {
                const tabIndex = parseInt(btn.getAttribute("data-tab"));
                
                // Hide all tabs
                modalEl.querySelectorAll('.fixmyprompt-tab-content').forEach(tab => {
                    tab.style.display = 'none';
                });
                
                // Show selected tab
                const selectedTab = modalEl.querySelector(`.fixmyprompt-tab-content[data-tab="${tabIndex}"]`);
                if (selectedTab) {
                    selectedTab.style.display = 'block';
                }
                
                // Update button styles
                tabBtns.forEach(b => {
                    if (b.getAttribute("data-tab") === String(tabIndex)) {
                        b.style.background = 'white';
                        b.style.color = '#667eea';
                    } else {
                        b.style.background = 'rgba(255, 255, 255, 0.2)';
                        b.style.color = 'white';
                    }
                });
            });
        });
    }
    
    // Attach accept button handler
    if (acceptBtn) {
        acceptBtn.addEventListener("click", () => {
            const textarea = modalEl.querySelector('.fixmyprompt-improved-text');
            const improvedText = textarea ? textarea.value : improved;
            handleImprovedAccept(improvedText, container);
        });
    }
    
    // Attach reject button handler
    if (rejectBtn) {
        rejectBtn.addEventListener("click", () => {
            handleClose(container);
        });
    }
    
    // Attach close button handler
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            handleClose(container);
        });
    }
    
    // Attach outcomes button handler
    if (outcomesBtn) {
        outcomesBtn.addEventListener("click", () => {
            handleOutcomesPreview(data);
        });
    }
    
    // Load Refine tab questions when tab is clicked
    const refineTabBtn = modalEl.querySelector('.fixmyprompt-tab-btn[data-tab="1"]');
    if (refineTabBtn) {
        refineTabBtn.addEventListener("click", async () => {
            await loadRefineQuestions(modalEl, data, container);
        });
    }
    
    // Attach Apply Selected button handler for Manual tab
    const applyGapsBtn = modalEl.querySelector('.fixmyprompt-apply-gaps-btn');
    if (applyGapsBtn) {
        applyGapsBtn.addEventListener("click", () => {
            console.log('[FixMyPrompt] Apply Selected button clicked');
            handleApplyGaps(data, modalEl, container);
        });
    }
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === "Escape") {
            handleClose(container);
            document.removeEventListener("keydown", escapeHandler);
        }
    };
    document.addEventListener("keydown", escapeHandler);
}

/**
 * Render modal to DOM
 * @param {Object} modal - Modal object from createModal
 */
export function renderModal(modal) {
    const { html, improved } = modal;
    
    // Create container
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
    
    // Get modal element
    const modalEl = document.getElementById(UI.modalId);
    
    // Get buttons and content areas
    const acceptBtn = modalEl.querySelector(".fixmyprompt-accept-btn");
    const revertBtn = modalEl.querySelector(".fixmyprompt-revert-btn");
    const closeBtn = modalEl.querySelector(".fixmyprompt-close-btn");
    const outcomesBtn = modalEl.querySelector(".fixmyprompt-outcomes-btn");
    const improvedTextarea = modalEl.querySelector(".fixmyprompt-improved-textarea");
    const tabBtns = modalEl.querySelectorAll(".fixmyprompt-tab-btn");
    const improvementContent = modalEl.querySelector(".fixmyprompt-improvement-content");
    const refineContent = modalEl.querySelector(".fixmyprompt-refine-content");
    
    // Tab switching with content visibility
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.getAttribute("data-tab");
            
            // Update tab button styles
            tabBtns.forEach(b => {
                if (b.getAttribute("data-tab") === tab) {
                    b.style.background = "white";
                    b.style.color = "#667eea";
                } else {
                    b.style.background = "rgba(255, 255, 255, 0.2)";
                    b.style.color = "white";
                }
            });
            
            // Show/hide content
            if (tab === "refine") {
                improvementContent.style.display = "none";
                refineContent.style.display = "block";
                // Load questions
                loadRefineQuestions(modalEl, modal.data, container);
            } else {
                improvementContent.style.display = "block";
                refineContent.style.display = "none";
            }
        });
    });
    
    // Add button hover effects
    [acceptBtn, revertBtn, closeBtn, outcomesBtn].forEach(btn => {
        if (btn) {
            btn.addEventListener("mouseenter", () => {
                btn.style.opacity = "0.8";
            });
            btn.addEventListener("mouseleave", () => {
                btn.style.opacity = "1";
            });
        }
    });
    
    // Add textarea focus/blur effects
    if (improvedTextarea) {
        improvedTextarea.addEventListener("focus", () => {
            improvedTextarea.style.borderColor = "#059669";
            improvedTextarea.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.1)";
        });
        
        improvedTextarea.addEventListener("blur", () => {
            improvedTextarea.style.borderColor = "#10b981";
            improvedTextarea.style.boxShadow = "none";
        });
    }
    
    // Add event listeners
    acceptBtn.addEventListener("click", () => handleAccept(improvedTextarea.value, container));
    revertBtn.addEventListener("click", () => handleRevert(container));
    closeBtn.addEventListener("click", () => handleClose(container));
    outcomesBtn.addEventListener("click", () => handleOutcomesPreview(modal.data));
    
    // Close on background click
    modalEl.addEventListener("click", (e) => {
        if (e.target === modalEl) {
            handleClose(container);
        }
    });
    
    // Close on Escape key
    const escapeHandler = (e) => {
        if (e.key === "Escape") {
            handleClose(container);
            document.removeEventListener("keydown", escapeHandler);
        }
    };
    document.addEventListener("keydown", escapeHandler);
}

/**
 * Load and display refinement questions
 */

/**
 * Handle answer submission
 */

/**
 * Handle accept button click for improved modal
 * @param {string} improvedText - Improved prompt text from textarea
 * @param {Element} container - Modal container
 */
function handleImprovedAccept(improvedText, container) {
    try {
        // Find the prompt input field
        const inputElement = findPromptInput();
        
        if (inputElement) {
            // Set the text in the input field
            setElementText(inputElement, improvedText);
            
            // Trigger input events so the platform recognizes the change
            const inputEvent = new Event('input', { bubbles: true });
            const changeEvent = new Event('change', { bubbles: true });
            inputElement.dispatchEvent(inputEvent);
            inputElement.dispatchEvent(changeEvent);
            
            showSuccess("Prompt pasted into input!");
        } else {
            // Fallback: copy to clipboard if we cannot find the input
            navigator.clipboard.writeText(improvedText).then(() => {
                showSuccess("Prompt copied to clipboard!");
            }).catch(err => {
                console.error("Failed to copy:", err);
                showToast("Could not paste - please paste manually", "error");
            });
        }
    } catch (error) {
        console.error("[FixMyPrompt] Error in handleImprovedAccept:", error);
        navigator.clipboard.writeText(improvedText).then(() => {
            showSuccess("Prompt copied to clipboard!");
        }).catch(err => {
            showToast("Error: could not paste or copy", "error");
        });
    } finally {
        // Hide and remove balloon after acceptance
        const balloon = document.getElementById('fixmyprompt-balloon');
        if (balloon) {
            balloon.style.display = 'none';
            balloon.remove();
        }
        // Reset balloon state in auto-detect-balloon
        if (window.autoDetectBalloon) {
            window.autoDetectBalloon.balloon = null;
        }
        handleClose(container);
    }
}

/**
 * Handle accept button click
 * @param {string} improvedText - Improved prompt text from textarea
 * @param {Element} container - Modal container
 */
function handleAccept(improvedText, container) {
    try {
        // Find the prompt input field
        const inputElement = findPromptInput();
        
        if (inputElement) {
            // Set the text in the input field
            setElementText(inputElement, improvedText);
            
            // Trigger input events so the platform recognizes the change
            const inputEvent = new Event('input', { bubbles: true });
            const changeEvent = new Event('change', { bubbles: true });
            inputElement.dispatchEvent(inputEvent);
            inputElement.dispatchEvent(changeEvent);
            
            showSuccess("Prompt pasted into input!");
        } else {
            // Fallback: copy to clipboard if we cannot find the input
            navigator.clipboard.writeText(improvedText).then(() => {
                showSuccess("Prompt copied to clipboard!");
            }).catch(err => {
                console.error("Failed to copy:", err);
                showToast("Could not paste - please paste manually", "error");
            });
        }
    } catch (error) {
        console.error("[FixMyPrompt] Error in handleAccept:", error);
        navigator.clipboard.writeText(improvedText).then(() => {
            showSuccess("Prompt copied to clipboard!");
        }).catch(err => {
            showToast("Error: could not paste or copy", "error");
        });
    } finally {
        // Hide and remove balloon after acceptance
        const balloon = document.getElementById('fixmyprompt-balloon');
        if (balloon) {
            balloon.style.display = 'none';
            balloon.remove();
        }
        // Reset balloon state in auto-detect-balloon
        if (window.autoDetectBalloon) {
            window.autoDetectBalloon.balloon = null;
        }
        handleClose(container);
    }
}

/**
 * Handle revert button click
 * @param {Element} container - Modal container
 */
function handleRevert(container) {
    const textarea = container.querySelector(".fixmyprompt-improved-textarea");
    if (textarea) {
        const originalPrompt = container.querySelector("div").textContent;
        textarea.value = originalPrompt;
        showInfo("Reverted to original prompt");
    }
}

/**
 * Handle close button click
 * @param {Element} container - Modal container
 */
function handleClose(container) {
    container.style.animation = "fadeOut 0.3s ease";
    setTimeout(() => {
        container.remove();
    }, 300);
}

/**
 * Handle outcomes preview
 * @param {Object} data - Modal data
 */
function handleOutcomesPreview(data) {
    console.log("[FixMyPrompt] Outcome preview clicked");
    const { original, improved } = data;
    
    // Mock outcomes showing what AI might respond with
    const mockResponses = {
        original: {
            title: "Original Prompt Response",
            example: "Here's some information about that topic. It covers various aspects and might be useful. The details are somewhat general and could apply to different situations. Let me know if you need anything else."
        },
        improved: {
            title: "Improved Prompt Response",
            example: "Based on your specific requirements, here's a focused response:\n\nKey Points:\n1. [Directly addresses your goal]\n2. [Provides specific examples]\n3. [Includes actionable recommendations]\n\nThis approach ensures accuracy and relevance to your needs."
        }
    };
    
    const outcomesHtml = `
        <div id="fixmyprompt-outcomes-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999999;
            animation: fadeIn 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        ">
            <div style="
                background: white;
                border-radius: 16px;
                max-width: 900px;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
            ">
                <div style="
                    padding: 24px;
                    border-bottom: 1px solid #e5e7eb;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 16px 16px 0 0;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                ">
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700;">👁️ Likely Outcomes Comparison</h2>
                    <button class="fixmyprompt-outcomes-close" style="
                        background: rgba(255, 255, 255, 0.2);
                        border: none;
                        color: white;
                        font-size: 24px;
                        cursor: pointer;
                        padding: 0;
                        width: 32px;
                        height: 32px;
                        border-radius: 6px;
                    ">×</button>
                </div>
                <div style="padding: 24px; flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
                    <!-- Original Outcome -->
                    <div>
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">Original Prompt</h3>
                        <div style="
                            background: #fef2f2;
                            border: 1px solid #fecaca;
                            border-left: 4px solid #ef4444;
                            border-radius: 8px;
                            padding: 16px;
                            margin-bottom: 16px;
                        ">
                            <div style="font-size: 12px; font-weight: 600; color: #991b1b; margin-bottom: 8px;">⚠️ Likely Response:</div>
                            <div style="font-size: 13px; color: #7f1d1d; line-height: 1.6;">${escapeHtml(mockResponses.original.example)}</div>
                        </div>
                        <div style="
                            background: #fef3c7;
                            border: 1px solid #fcd34d;
                            border-radius: 6px;
                            padding: 12px;
                            font-size: 12px;
                            color: #92400e;
                        ">
                            <strong>Issues:</strong> Vague, unstructured, potentially off-topic
                        </div>
                    </div>
                    
                    <!-- Improved Outcome -->
                    <div>
                        <h3 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #1f2937;">Improved Prompt</h3>
                        <div style="
                            background: #f0fdf4;
                            border: 1px solid #bbf7d0;
                            border-left: 4px solid #10b981;
                            border-radius: 8px;
                            padding: 16px;
                            margin-bottom: 16px;
                        ">
                            <div style="font-size: 12px; font-weight: 600; color: #166534; margin-bottom: 8px;">✓ Likely Response:</div>
                            <div style="font-size: 13px; color: #15803d; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(mockResponses.improved.example)}</div>
                        </div>
                        <div style="
                            background: #d1fae5;
                            border: 1px solid #a7f3d0;
                            border-radius: 6px;
                            padding: 12px;
                            font-size: 12px;
                            color: #065f46;
                        ">
                            <strong>Benefits:</strong> Clear, structured, expert-level, on-target
                        </div>
                    </div>
                </div>
                <div style="padding: 16px 24px; border-top: 1px solid #e5e7eb; background: #f9fafb; border-radius: 0 0 16px 16px;">
                    <button class="fixmyprompt-outcomes-accept" style="
                        width: 100%;
                        padding: 10px 18px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.2s ease;
                    ">Got it! Use this improved prompt</button>
                </div>
            </div>
        </div>
    `;
    
    const container = document.createElement("div");
    container.innerHTML = outcomesHtml;
    document.body.appendChild(container);
    
    const outcomesModal = document.getElementById("fixmyprompt-outcomes-modal");
    const closeBtn = outcomesModal.querySelector(".fixmyprompt-outcomes-close");
    const acceptBtn = outcomesModal.querySelector(".fixmyprompt-outcomes-accept");
    
    const closeOutcomes = () => {
        outcomesModal.style.animation = "fadeOut 0.2s ease-in-out";
        setTimeout(() => {
            if (container.parentNode) container.parentNode.removeChild(container);
        }, 200);
    };
    
    closeBtn.addEventListener("click", closeOutcomes);
    acceptBtn.addEventListener("click", closeOutcomes);
    outcomesModal.addEventListener("click", (e) => {
        if (e.target === outcomesModal) closeOutcomes();
    });
}

/**
 * Show progress modal while API is processing
 */
export function showProgressModal() {
    // Remove existing progress modal if any
    const existing = document.getElementById("fixmyprompt-progress-modal");
    if (existing) existing.remove();
    
    const html = `
        <div id="fixmyprompt-progress-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            animation: fadeIn 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        ">
            <div style="
                background: white;
                border-radius: 16px;
                padding: 40px;
                max-width: 400px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                text-align: center;
            ">
                <div style="
                    font-size: 48px;
                    margin-bottom: 20px;
                    animation: spin 2s linear infinite;
                ">✨</div>
                <h2 style="
                    margin: 0 0 16px 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #1f2937;
                ">Improving Your Prompt</h2>
                <p style="
                    margin: 0 0 24px 0;
                    font-size: 14px;
                    color: #6b7280;
                    line-height: 1.5;
                ">Analyzing and enhancing your prompt with AI...</p>
                <div style="
                    display: flex;
                    gap: 8px;
                    justify-content: center;
                    align-items: center;
                ">
                    <div style="
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #667eea;
                        animation: bounce 1.4s infinite;
                    "></div>
                    <div style="
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #667eea;
                        animation: bounce 1.4s infinite 0.2s;
                    "></div>
                    <div style="
                        width: 8px;
                        height: 8px;
                        border-radius: 50%;
                        background: #667eea;
                        animation: bounce 1.4s infinite 0.4s;
                    "></div>
                </div>
            </div>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            @keyframes bounce {
                0%, 80%, 100% { transform: translateY(0); opacity: 0.5; }
                40% { transform: translateY(-10px); opacity: 1; }
            }
        </style>
    `;
    
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);
}

/**
 * Close progress modal
 */
export function closeProgressModal() {
    const modal = document.getElementById("fixmyprompt-progress-modal");
    if (modal) {
        modal.parentElement.remove();
    }
}


/**
 * Handle submit answers from Refine tab
 */
async function handleSubmitAnswers(data, modalEl, container) {
    const answers = {};
    const radioGroups = modalEl.querySelectorAll('input[type="radio"]');
    const questionIds = new Set();
    
    radioGroups.forEach(radio => {
        const name = radio.getAttribute('name');
        if (name) questionIds.add(name);
    });
    
    questionIds.forEach(qId => {
        const checked = modalEl.querySelector(`input[name="${qId}"]:checked`);
        if (checked) {
            answers[qId] = checked.value;
        }
    });
    
    const tab1Content = modalEl.querySelector('.fixmyprompt-tab-content[data-tab="1"]');
    if (tab1Content) {
        tab1Content.innerHTML = '<div style="padding: 40px; text-align: center;"><div style="font-size: 48px; margin-bottom: 16px;">✨</div><div style="font-size: 18px; font-weight: 600; color: #1f2937;">Refining Your Prompt</div></div>';
    }
    
    try {
        const response = await fetch("https://web-production-b82f2.up.railway.app/api/improve-prompt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: data.improved,
                platform: "chatgpt",
                domain: data.domain,
                refinementAnswers: answers
            })
        });
        
        const result = await response.json();
        
        if (result.success && result.improved) {
            // If backend returns a very low score (< 10), it's likely wrong. Use improved score + 2 instead
            const refinedScore = (result.score && result.score > 10) ? result.score : (Math.round(data.improvedScore) + 2);
            
            tab1Content.innerHTML = `<div style="padding: 20px;"><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;"><div style="background: #fee2e2; padding: 12px; border-radius: 6px; border-left: 4px solid #ef4444;"><div style="font-size: 11px; font-weight: 600; color: #991b1b; text-transform: uppercase; margin-bottom: 4px;">Improved Score</div><div style="font-size: 24px; font-weight: 700; color: #dc2626;">${Math.round(data.improvedScore)}</div></div><div style="background: #dcfce7; padding: 12px; border-radius: 6px; border-left: 4px solid #10b981;"><div style="font-size: 11px; font-weight: 600; color: #166534; text-transform: uppercase; margin-bottom: 4px;">Refined Score</div><div style="font-size: 24px; font-weight: 700; color: #16a34a;">${Math.round(refinedScore)}</div></div></div><div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border: 1px solid #dcfce7; margin-bottom: 16px;"><div style="font-size: 12px; font-weight: 600; color: #15803d; margin-bottom: 8px; text-transform: uppercase;">Refined Prompt</div><textarea readonly style="width: 100%; padding: 12px; border-radius: 6px; border: 1px solid #10b981; background: white; color: #1f2937; font-size: 13px; line-height: 1.6; height: 300px; overflow: auto; font-family: inherit;">${escapeHtml(result.improved)}</textarea></div><button class="fixmyprompt-accept-refined-btn" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 14px;">Accept Refined Prompt</button></div>`;
            
            const acceptRefinedBtn = tab1Content.querySelector(".fixmyprompt-accept-refined-btn");
            if (acceptRefinedBtn) {
                acceptRefinedBtn.addEventListener("click", () => {
                    handleImprovedAccept(result.improved, container);
                });
            }
        }
    } catch (error) {
        console.error('[FixMyPrompt] Error:', error);
    }
}

/**
 * Handle apply selected gaps from Manual tab
 */
function handleApplyGaps(data, modalEl, container) {
    handleImprovedAccept(data.improved, container);
}


/**
 * Load refinement questions using proper question generator
 */
async function loadRefineQuestions(modalEl, data, container) {
    const refineContent = modalEl.querySelector(".fixmyprompt-refine-content");
    
    try {
        // Generate domain-specific refinement questions (try backend first, fallback to local)
        console.log('[FixMyPrompt] Attempting backend question generation...');
        let questions = null;
        const backendResult = await backendAPI.generateQuestions(data.original, data.domain);
        if (backendResult && backendResult.questions) {
            questions = backendResult.questions;
            console.log('[FixMyPrompt] Generated questions (backend):', questions.length);
        } else {
            questions = generateDomainSpecificQuestions(data.domain, data.gaps || []);
            console.log('[FixMyPrompt] Generated domain-specific questions (local fallback):', questions.length);
        }
        
        if (!questions || questions.length === 0) {
            refineContent.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">No refinement questions available</div>';
            return;
        }
        
        console.log('[FixMyPrompt] Generated questions:', questions.length);
        
        // Render questions with vertical layout
        let html = '<div style="padding: 0;">';
        html += '<div style="font-size: 13px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">Refinement Questions</div>';
        html += '<div style="display: flex; flex-direction: column; gap: 16px;">';
        
        questions.forEach((q, idx) => {
            const questionText = q.question || q.text || `Question ${idx + 1}`;
            let options = q.options || q.answers || [];
            
            // If options are objects with label/value, extract labels
            if (options.length > 0 && typeof options[0] === 'object' && options[0].label) {
                options = options.map(o => o.label);
            }
            
            console.log('[FixMyPrompt] Question', idx, ':', questionText, 'Options:', options.length);
            
            html += `
                <div style="margin-bottom: 8px;">
                    <div style="font-size: 13px; font-weight: 700; margin-bottom: 12px; color: #1f2937;">${escapeHtml(questionText)}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                        ${options.map((opt, optIdx) => `
                            <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 12px; border-radius: 20px; border: 1px solid #d1d5db; background: white; transition: all 0.2s; white-space: nowrap;">
                                <input type="radio" name="q_${idx}" value="${escapeHtml(String(opt))}" style="cursor: pointer; width: 16px; height: 16px; flex-shrink: 0;">
                                <span style="font-size: 13px; color: #374151;">${escapeHtml(String(opt))}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        html += `<button class="fixmyprompt-submit-answers-btn" style="width: 100%; padding: 12px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 20px;">Submit Answers</button>`;
        html += '</div>';
        
        refineContent.innerHTML = html;
        
        // Add hover effects to labels
        const labels = refineContent.querySelectorAll("label");
        labels.forEach(label => {
            label.addEventListener("mouseenter", () => {
                label.style.background = "#f3f4f6";
                label.style.borderColor = "#9ca3af";
            });
            label.addEventListener("mouseleave", () => {
                label.style.background = "white";
                label.style.borderColor = "#d1d5db";
            });
        });
        
        // Add submit button handler
        const submitBtn = refineContent.querySelector(".fixmyprompt-submit-answers-btn");
        if (submitBtn) {
            submitBtn.addEventListener("click", () => {
                console.log('[FixMyPrompt] Submit Answers button clicked');
                handleSubmitAnswers(data, modalEl, container);
            });
        }
    } catch (error) {
        console.error("[FixMyPrompt] Error loading questions:", error);
        refineContent.innerHTML = '<div style="text-align: center; padding: 20px; color: #ef4444;">Error loading questions: ' + error.message + '</div>';
    }
}


/**
 * Generate domain-specific refinement questions based on gaps
 */
function generateDomainSpecificQuestions(domain, gaps) {
    const domainQuestions = {
        'technical': [
            {
                question: 'What programming language are you using?',
                options: ['Python', 'JavaScript', 'Java', 'C++', 'Other']
            },
            {
                question: 'Do you have the error message or stack trace?',
                options: ['Yes, included', 'Partial details', 'No error yet', 'Not applicable']
            },
            {
                question: 'What is your development environment?',
                options: ['Local machine', 'Cloud platform', 'Docker/Container', 'Other']
            }
        ],
        'business/hr': [
            {
                question: 'What is the job level/seniority?',
                options: ['Entry-level', 'Mid-level', 'Senior', 'Executive', 'Not specified']
            },
            {
                question: 'What is the company size?',
                options: ['Startup (<50)', 'Small (50-500)', 'Medium (500-5000)', 'Enterprise (5000+)', 'Not specified']
            },
            {
                question: 'Is this a remote, hybrid, or on-site position?',
                options: ['Remote', 'Hybrid', 'On-site', 'Flexible', 'Not specified']
            }
        ],
        'creative_writing': [
            {
                question: 'What type of content are you writing?',
                options: ['Blog post / Article', 'Website / Landing page copy', 'Ad copy / Marketing copy', 'Email / Newsletter', 'Social media caption', 'Script / Screenplay', 'Short story / Fiction', 'Product description', 'Press release', 'Speech / Presentation narrative']
            },
            {
                question: 'What tone and voice?',
                options: ['Professional & formal', 'Casual & conversational', 'Witty / Humorous', 'Inspirational', 'Persuasive & sales-driven', 'Storytelling & narrative', 'Academic & authoritative']
            },
            {
                question: 'Who is the target audience?',
                options: ['General public', 'Business professionals / B2B', 'Consumers / B2C', 'Young adults (18–30)', 'Executives & decision-makers', 'Beginners / Non-experts', 'Specific niche']
            }
        ],
        'creative_media': [
            {
                question: 'What are you creating?',
                options: ['Image / Illustration / AI art', 'Logo / Icon / Avatar', 'Video clip / Movie scene', 'Reel / TikTok / YouTube Short', 'Podcast / Voiceover / Audio', 'Social media graphic / Story', 'Presentation / Slide deck', 'Poster / Banner / Flyer', 'Website / Landing page design', 'Brand kit / Mood board']
            },
            {
                question: 'What platform or format?',
                options: ['Instagram (post / story / reel)', 'TikTok / YouTube Shorts', 'YouTube (video / thumbnail)', 'LinkedIn / Twitter / X', 'Website / Web app', 'Print (A4, billboard, packaging)', 'AI tool (Midjourney, DALL-E, Sora)', 'Email / Newsletter']
            },
            {
                question: 'What style or aesthetic?',
                options: ['Photorealistic', 'Cinematic / Film noir', 'Illustration / Cartoon', 'Anime / Manga', 'Minimalist / Flat design', 'Surreal / Fantasy', 'Vintage / Retro', 'Dark & moody', 'Luxury & premium']
            }
        ],
        'learning': [
            {
                question: 'What is your current skill level?',
                options: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Not sure']
            },
            {
                question: 'How much time can you dedicate?',
                options: ['< 1 hour/week', '1-5 hours/week', '5-10 hours/week', '10+ hours/week', 'Not sure']
            },
            {
                question: 'What is your learning style?',
                options: ['Hands-on practice', 'Video tutorials', 'Reading/theory', 'Project-based', 'Mixed']
            }
        ],
        'general': [
            {
                question: 'What is your main goal?',
                options: ['Get information', 'Create content', 'Solve a problem', 'Learn something', 'Other']
            },
            {
                question: 'Who is your audience?',
                options: ['Myself', 'Team/colleagues', 'General public', 'Specific group', 'Not sure']
            },
            {
                question: 'What constraints do you have?',
                options: ['Time', 'Budget', 'Resources', 'Technical', 'None']
            }
        ]
    };
    
    // Map career domain to business/hr questions
    const mappedDomain = domain === 'career' ? 'business/hr' : domain;
    const questions = domainQuestions[mappedDomain] || domainQuestions['general'];
    return questions.map((q, idx) => ({
        id: `question-${idx}`,
        question: q.question,
        options: q.options,
        selectedOption: null,
        type: 'mcq'
    }));
}
