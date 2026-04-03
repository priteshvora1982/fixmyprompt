/**
 * FixMyPrompt - Configuration Constants
 * All configuration values for the extension
 */

// API Configuration
export const API = {
    BASE_URL: "https://web-production-b82f2.up.railway.app",
    ENDPOINTS: {
        IMPROVE_PROMPT: "/api/improve-prompt",
        DETECT_DOMAIN: "/api/detect-domain",
        GENERATE_QUESTIONS: "/api/generate-questions",
        SAVE_CONTEXT: "/api/context",
        GET_CONTEXT: "/api/context"
    }
};

// Domain Configuration
export const DOMAINS = {
    TECHNICAL: "technical",
    CREATIVE_WRITING: "creative_writing", // Text-based creative output: copy, scripts, stories, articles
    CREATIVE_MEDIA: "creative_media",   // Visual/audio/video generation and design assets
    BUSINESS: "business",
    FINANCE: "finance",
    ACADEMIC: "academic",
    CAREER: "career",
    PERSONAL: "personal",
    GENERAL: "general"
};

// Context Configuration
export const CONTEXT = {
    STORAGE_KEY: "fixmyprompt_context",
    EXPIRATION_DAYS: 7,
    WARNING_MESSAGE: "Context will be cleared after 7 days of inactivity"
};

// Platform configurations with selectors
export const PLATFORMS = {
    chatgpt: {
        name: "ChatGPT",
        promptInputSelectors: [
            'div[id="prompt-textarea"][contenteditable="true"]',
            'div.ProseMirror[contenteditable="true"][id="prompt-textarea"]',
            'div.ProseMirror[contenteditable="true"]',
            'div[contenteditable="true"][role="textbox"]',
            'div[contenteditable="true"][data-testid="chat-input-textarea"]',
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="message"]',
            "textarea[data-id]",
            'div[contenteditable="true"]'
        ]
    },
    claude: {
        name: "Claude",
        promptInputSelectors: [
            'div[data-testid="chat-input-textarea"][contenteditable="true"]',
            'div.tiptap.ProseMirror[contenteditable="true"]',
            'div[contenteditable="true"][role="textbox"]',
            'div[contenteditable="true"]',
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="message"]'
        ]
    }
};

// Scoring configuration
export const SCORING = {
    minPromptLength: 10,
    maxPromptLength: 2000,
    vagueBadWords: [
        "good", "bad", "nice", "better", "worse", "great", "terrible",
        "something", "somehow", "some", "maybe", "perhaps", "probably",
        "try", "attempt", "see", "look", "check", "consider",
        "stuff", "thing", "things", "kind", "sort", "type"
    ],
    guardrailKeywords: [
        "avoid", "ensure", "must", "should", "verify", "check", "confirm",
        "accurate", "reliable", "professional", "expert", "senior",
        "constraint", "requirement", "criteria", "success"
    ],
    structureIndicators: [
        "goal", "context", "constraint", "output", "format", "step",
        "section", "requirement", "criteria", "success", "objective",
        "background", "task", "example", "instruction"
    ]
};

// UI configuration
export const UI = {
    buttonLabel: "✨ Fix My Prompt",
    buttonId: "fixmyprompt-button",
    modalId: "fixmyprompt-modal",
    toastDuration: 3000,
    modalAnimationDuration: 200
};

// Error messages
export const ERROR_MESSAGES = {
    TOO_SHORT: "Prompt is too short to improve. Please write at least 10 characters.",
    TOO_LONG: "Prompt is too long. Truncating to 2000 characters.",
    API_TIMEOUT: "Improvement took too long. Please try again.",
    API_ERROR: "Could not improve prompt. Please try again.",
    PROMPT_CAPTURE_FAILED: "Could not capture prompt. Please try again.",
    UNKNOWN_ERROR: "An unexpected error occurred. Please try again."
};



// Colors and styling
export const COLORS = {
    primary: "#10b981",
    primaryHover: "#059669",
    success: "#10b981",
    error: "#ef4444",
    warning: "#f59e0b",
    info: "#3b82f6",
    background: "white",
    border: "#e5e7eb",
    text: "#374151",
    textLight: "#6b7280",
    textLighter: "#9ca3af"
};

// Timing configuration
export const TIMING = {
    buttonDebounce: 300,
    toastDuration: 3000,
    modalFadeIn: 200,
    apiTimeout: 5000
};


