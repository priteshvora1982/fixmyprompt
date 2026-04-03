/**
 * FixMyPrompt - Chrome Utilities
 * Helper functions for Chrome extension APIs
 */

/**
 * Send a message to the service worker
 * @param {Object} message - Message object
 * @returns {Promise} - Response from service worker
 */
export function sendMessage(message) {
    return new Promise((resolve, reject) => {
        try {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("[FixMyPrompt] Chrome error:", chrome.runtime.lastError);
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        } catch (error) {
            console.error("[FixMyPrompt] Error sending message:", error);
            reject(error);
        }
    });
}

/**
 * Listen for messages from content script
 * @param {Function} callback - Callback function
 * @returns {Function} - Function to remove listener
 */
export function onMessage(callback) {
    const listener = (message, sender, sendResponse) => {
        try {
            callback(message, sender, sendResponse);
        } catch (error) {
            console.error("[FixMyPrompt] Error in message handler:", error);
            sendResponse({ error: error.message });
        }
    };
    
    chrome.runtime.onMessage.addListener(listener);
    
    // Return function to remove listener
    return () => {
        chrome.runtime.onMessage.removeListener(listener);
    };
}

/**
 * Get the current tab information
 * @returns {Promise<Object>} - Tab information
 */
export async function getCurrentTab() {
    return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
            } else {
                resolve(tabs[0]);
            }
        });
    });
}

/**
 * Get extension URL
 * @param {string} path - Path relative to extension root
 * @returns {string} - Full extension URL
 */
export function getExtensionURL(path = "") {
    return chrome.runtime.getURL(path);
}

/**
 * Log message with extension prefix
 * @param {string} message - Message to log
 * @param {*} data - Optional data to log
 */
export function log(message, data = null) {
    if (data) {
        console.log(`[FixMyPrompt] ${message}`, data);
    } else {
        console.log(`[FixMyPrompt] ${message}`);
    }
}

/**
 * Log error with extension prefix
 * @param {string} message - Error message
 * @param {Error} error - Optional error object
 */
export function logError(message, error = null) {
    if (error) {
        console.error(`[FixMyPrompt] ${message}`, error);
    } else {
        console.error(`[FixMyPrompt] ${message}`);
    }
}

export default {
    sendMessage,
    onMessage,
    getCurrentTab,
    getExtensionURL,
    log,
    logError
};
