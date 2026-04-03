/**
 * FixMyPrompt - Toast Notifications
 * Display user feedback messages
 */

import { UI, COLORS, TIMING } from "./constants.js";

// Track active toasts
const activeToasts = new Map();

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type: "success", "error", "info", "warning"
 * @param {boolean} autoClose - Auto-close after timeout
 * @returns {string} - Toast ID
 */
export function showToast(message, type = "info", autoClose = true) {
    const toastId = `toast-${Date.now()}-${Math.random()}`;
    
    const toast = document.createElement("div");
    toast.id = toastId;
    toast.className = `fixmyprompt-toast fixmyprompt-toast-${type}`;
    toast.textContent = message;
    
    // Determine colors based on type
    let backgroundColor, color;
    switch (type) {
        case "success":
            backgroundColor = COLORS.success;
            color = "white";
            break;
        case "error":
            backgroundColor = COLORS.error;
            color = "white";
            break;
        case "warning":
            backgroundColor = COLORS.warning;
            color = "white";
            break;
        case "info":
        default:
            backgroundColor = COLORS.info;
            color = "white";
    }
    
    // Apply styles
    Object.assign(toast.style, {
        position: "fixed",
        bottom: "20px",
        right: "20px",
        padding: "12px 20px",
        borderRadius: "6px",
        fontSize: "14px",
        fontWeight: "500",
        zIndex: "10000",
        maxWidth: "300px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        backgroundColor,
        color,
        cursor: "pointer",
        animation: "fixmyprompt-fade-in 0.2s ease-in-out",
        transition: "opacity 0.3s ease-in-out"
    });
    
    document.body.appendChild(toast);
    activeToasts.set(toastId, toast);
    
    // Click to close
    toast.addEventListener("click", () => closeToast(toastId));
    
    // Auto-close
    if (autoClose) {
        setTimeout(() => closeToast(toastId), TIMING.toastDuration);
    }
    
    return toastId;
}

/**
 * Close a toast notification
 * @param {string} toastId - Toast ID
 */
export function closeToast(toastId) {
    const toast = activeToasts.get(toastId);
    if (!toast) return;
    
    toast.style.opacity = "0";
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
        activeToasts.delete(toastId);
    }, 300);
}

/**
 * Close all toasts
 */
export function closeAllToasts() {
    activeToasts.forEach((toast, toastId) => {
        closeToast(toastId);
    });
}

/**
 * Show success toast
 * @param {string} message - Message to display
 * @param {boolean} autoClose - Auto-close after timeout
 * @returns {string} - Toast ID
 */
export function showSuccess(message, autoClose = true) {
    return showToast(message, "success", autoClose);
}

/**
 * Show error toast
 * @param {string} message - Message to display
 * @param {boolean} autoClose - Auto-close after timeout
 * @returns {string} - Toast ID
 */
export function showError(message, autoClose = true) {
    return showToast(message, "error", autoClose);
}

/**
 * Show info toast
 * @param {string} message - Message to display
 * @param {boolean} autoClose - Auto-close after timeout
 * @returns {string} - Toast ID
 */
export function showInfo(message, autoClose = true) {
    return showToast(message, "info", autoClose);
}

/**
 * Show warning toast
 * @param {string} message - Message to display
 * @param {boolean} autoClose - Auto-close after timeout
 * @returns {string} - Toast ID
 */
export function showWarning(message, autoClose = true) {
    return showToast(message, "warning", autoClose);
}

export default {
    showToast,
    closeToast,
    closeAllToasts,
    showSuccess,
    showError,
    showInfo,
    showWarning
};
