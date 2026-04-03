/**
 * FixMyPrompt - Platform Detection
 * Detects which AI platform the user is on
 */

/**
 * Detect the current platform (ChatGPT or Claude)
 * @returns {string|null} - "chatgpt", "claude", or null if unknown
 */
export function detectPlatform() {
    const url = window.location.href;
    
    if (url.includes("chatgpt.com") || url.includes("chat.openai.com")) {
        console.log("[FixMyPrompt] Platform detected: ChatGPT");
        return "chatgpt";
    } else if (url.includes("claude.ai")) {
        console.log("[FixMyPrompt] Platform detected: Claude");
        return "claude";
    }
    
    console.warn("[FixMyPrompt] Unknown platform");
    return null;
}

/**
 * Get platform name for display
 * @param {string} platform - Platform identifier
 * @returns {string} - Human-readable platform name
 */
export function getPlatformName(platform) {
    const names = {
        chatgpt: "ChatGPT",
        claude: "Claude"
    };
    return names[platform] || "Unknown";
}

/**
 * Check if platform is supported
 * @param {string} platform - Platform identifier
 * @returns {boolean} - True if platform is supported
 */
export function isSupportedPlatform(platform) {
    return platform === "chatgpt" || platform === "claude";
}

export default {
    detectPlatform,
    getPlatformName,
    isSupportedPlatform
};
