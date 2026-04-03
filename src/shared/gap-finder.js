/**
 * FixMyPrompt - Enhanced GapFinder Module (v0.1.5)
 * Identifies missing elements in prompts using domain-specific, actionable patterns.
 */

import { enhancedGapPatterns } from './enhanced-gap-patterns.js';

class GapFinder {
    constructor() {
        this.patterns = enhancedGapPatterns;
        console.log('[GapFinder v2] Initialized with patterns for', Object.keys(this.patterns).length, 'domains');
    }

    /**
     * Finds actionable gaps in a prompt based on a domain.
     * @param {string} prompt - The user's prompt.
     * @param {string} domain - The detected domain (e.g., 'technical', 'business').
     * @returns {object[]} An array of identified gap objects.
     */
    findGaps(prompt, domain) {
        if (!prompt || prompt.length === 0) {
            return [];
        }

        const gaps = [];
        const promptLower = prompt.toLowerCase();
        const domainPatterns = this.patterns[domain] || this.patterns.general;

        for (const pattern of domainPatterns) {
            // If the pattern's regex does NOT match, it's a gap.
            if (!pattern.regex.test(promptLower)) {
                gaps.push({
                    id: pattern.id,
                    severity: pattern.severity,
                    gap: pattern.gap,
                    description: pattern.description,
                    suggestion: pattern.suggestion,
                    impact: pattern.impact
                });
            }
        }

        // Sort gaps by severity: critical > high > medium > low
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        const sortedGaps = gaps.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

        // Return the top 3 most severe gaps
        return sortedGaps.slice(0, 3);
    }
}

export { GapFinder };
