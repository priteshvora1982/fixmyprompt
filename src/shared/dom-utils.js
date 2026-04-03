/**
 * FixMyPrompt - DOM Utilities
 * Helper functions for DOM manipulation
 */

/**
 * Check if an element is visible
 * @param {Element} element - DOM element to check
 * @returns {boolean} - True if element is visible
 */
export function isElementVisible(element) {
    if (!element) return false;
    
    try {
        const style = window.getComputedStyle(element);
        return (
            element.offsetParent !== null &&
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity > 0
        );
    } catch (error) {
        console.error("[FixMyPrompt] Error checking visibility:", error);
        return false;
    }
}

/**
 * Get text content from an element
 * @param {Element} element - DOM element to extract text from
 * @returns {string|null} - Text content or null if extraction fails
 */
export function getElementText(element) {
    if (!element) return null;
    
    try {
        if (element.tagName === "TEXTAREA") {
            return element.value || "";
        } else if (element.contentEditable === "true" || element.className?.includes("ProseMirror")) {
            let text = element.innerText;
            
            if (!text || text.trim().length === 0) {
                // Try to extract from paragraphs
                const paragraphs = element.querySelectorAll("p");
                if (paragraphs.length > 0) {
                    text = Array.from(paragraphs)
                        .map(p => p.innerText || p.textContent)
                        .filter(t => t && t.trim().length > 0)
                        .join("\n");
                }
            }
            
            return text || "";
        }
        
        return element.innerText || element.textContent || "";
    } catch (error) {
        console.error("[FixMyPrompt] Error extracting text:", error);
        return null;
    }
}

/**
 * Set text content in an element
 * @param {Element} element - DOM element to set text in
 * @param {string} text - Text to set
 * @returns {boolean} - True if successful
 */
export function setElementText(element, text) {
    if (!element || !text) return false;
    
    try {
        if (element.tagName === "TEXTAREA") {
            element.value = text;
        } else if (element.contentEditable === "true") {
            element.innerText = text;
        } else {
            return false;
        }
        
        // Trigger input event so AI sees the change
        const inputEvent = new Event("input", { bubbles: true });
        element.dispatchEvent(inputEvent);
        
        // Also trigger change event for good measure
        const changeEvent = new Event("change", { bubbles: true });
        element.dispatchEvent(changeEvent);
        
        return true;
    } catch (error) {
        console.error("[FixMyPrompt] Error setting text:", error);
        return false;
    }
}

/**
 * Create a DOM element with attributes and styles
 * @param {string} tag - HTML tag name
 * @param {Object} options - Element options
 * @returns {Element} - Created element
 */
export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.id) element.id = options.id;
    if (options.className) element.className = options.className;
    if (options.text) element.textContent = options.text;
    if (options.html) element.innerHTML = options.html;
    
    if (options.styles) {
        Object.assign(element.style, options.styles);
    }
    
    if (options.attributes) {
        Object.entries(options.attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
    }
    
    return element;
}

/**
 * Remove an element from the DOM
 * @param {Element|string} element - Element or selector
 * @returns {boolean} - True if removed
 */
export function removeElement(element) {
    try {
        if (typeof element === "string") {
            element = document.querySelector(element);
        }
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
            return true;
        }
        return false;
    } catch (error) {
        console.error("[FixMyPrompt] Error removing element:", error);
        return false;
    }
}

/**
 * Add event listener with automatic cleanup
 * @param {Element} element - Element to attach listener to
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} - Function to remove listener
 */
export function addEventListener(element, event, handler) {
    if (!element) return () => {};
    
    element.addEventListener(event, handler);
    
    return () => {
        element.removeEventListener(event, handler);
    };
}

/**
 * Query selector with error handling
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {Element|null} - Found element or null
 */
export function querySelector(selector, parent = document) {
    try {
        return parent.querySelector(selector);
    } catch (error) {
        console.error("[FixMyPrompt] Error querying selector:", selector, error);
        return null;
    }
}

/**
 * Query all elements with error handling
 * @param {string} selector - CSS selector
 * @param {Element} parent - Parent element (default: document)
 * @returns {Element[]} - Array of found elements
 */
export function querySelectorAll(selector, parent = document) {
    try {
        return Array.from(parent.querySelectorAll(selector));
    } catch (error) {
        console.error("[FixMyPrompt] Error querying selector:", selector, error);
        return [];
    }
}

export default {
    isElementVisible,
    getElementText,
    setElementText,
    createElement,
    removeElement,
    addEventListener,
    querySelector,
    querySelectorAll
};
