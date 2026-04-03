/**
 * FixMyPrompt - SuggestionFormatter Module (v0.1.5)
 * Formats identified gaps into user-friendly, actionable suggestions.
 */

class SuggestionFormatter {
    constructor() {
        this.severityMap = {
            critical: '🔴 CRITICAL',
            high: '🟠 HIGH',
            medium: '🟡 MEDIUM',
            low: '🟢 LOW'
        };
    }

    /**
     * Formats a single gap object into a user-facing string for the balloon.
     * @param {object} gap - A single gap object from the EnhancedGapFinder.
     * @returns {string} A formatted string for display.
     */
    formatForBalloon(gap) {
        if (!gap) return '';

        const severity = this.severityMap[gap.severity] || '⚪️ INFO';
        return `${severity}: ${gap.gap}. ${gap.suggestion}`;
    }

    /**
     * Formats a single gap object into a detailed HTML string for the modal.
     * @param {object} gap - A single gap object from the EnhancedGapFinder.
     * @returns {string} A formatted HTML string for display.
     */
    formatForModal(gap) {
        if (!gap) return '';

        const severity = this.severityMap[gap.severity] || '⚪️ INFO';

        return `
            <div class="suggestion-card severity-${gap.severity}">
                <div class="suggestion-header">${severity}: ${gap.gap}</div>
                <div class="suggestion-body">
                    <p><strong>What's missing:</strong> ${gap.description}</p>
                    <p><strong>Why it matters:</strong> ${gap.impact}</p>
                    <p><strong>How to fix:</strong> ${gap.suggestion}</p>
                </div>
            </div>
        `;
    }

    /**
     * Formats an array of gap objects into a full HTML report for the modal.
     * @param {object[]} gaps - An array of gap objects.
     * @returns {string} A complete HTML string for the modal's content.
     */
    formatAllForModal(gaps) {
        if (!gaps || gaps.length === 0) {
            return '<p>No suggestions at the moment. Your prompt looks good!</p>';
        }

        return gaps.map(gap => this.formatForModal(gap)).join('');
    }
}

export { SuggestionFormatter };
