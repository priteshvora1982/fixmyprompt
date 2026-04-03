/**
 * FixMyPrompt - PromptScorer Module
 * Calculates prompt quality score (0-10) based on heuristics
 * Local, rule-based scoring (no backend call)
 */

class PromptScorer {
    constructor() {
        console.log('[PromptScorer] Initialized');
    }

    /**
     * Calculate prompt quality score (0-10)
     * @param {string} prompt - The user's prompt
     * @param {string[]} gaps - Identified gaps from GapFinder
     * @param {string} domain - Detected domain
     * @returns {number} Score from 0-10
     */
    calculateScore(prompt, gaps = [], domain = 'general') {
        if (!prompt || prompt.length === 0) {
            return 0;
        }

        let score = 10;

        // Penalty 1: Length issues
        const length = prompt.length;
        if (length < 10) {
            score -= 3; // Too short
        } else if (length < 20) {
            score -= 1;
        } else if (length > 500) {
            score -= 1; // Too long
        } else if (length > 1000) {
            score -= 2; // Way too long
        }

        // Penalty 2: Gap penalties based on severity
        if (gaps && gaps.length > 0) {
            const severityPenalties = {
                critical: 2.5,
                high: 1.5,
                medium: 0.75,
                low: 0.25
            };

            gaps.forEach(gap => {
                if (gap.severity && severityPenalties[gap.severity]) {
                    score -= severityPenalties[gap.severity];
                }
            });
        }

        // Penalty 3: Clarity issues
        if (this.hasVagueLanguage(prompt)) {
            score -= 1;
        }

        if (this.hasAmbiguity(prompt)) {
            score -= 1;
        }

        // Penalty 4: Missing structure
        if (this.hasNoStructure(prompt)) {
            score -= 1;
        }

        // Bonus 1: Has examples
        if (this.hasExamples(prompt)) {
            score += 1;
        }

        // Bonus 2: Has context
        if (this.hasContext(prompt)) {
            score += 1;
        }

        // Bonus 3: Has specific requirements
        if (this.hasSpecificRequirements(prompt)) {
            score += 1;
        }

        // Bonus 4: Well-structured
        if (this.isWellStructured(prompt)) {
            score += 1;
        }

        // Domain-specific adjustments
        const domainAdjustment = this.getDomainAdjustment(prompt, domain);
        score += domainAdjustment;

        // Clamp score to 0-10 range
        return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
    }

    /**
     * Check if prompt has vague language
     * @param {string} prompt - The prompt
     * @returns {boolean}
     */
    hasVagueLanguage(prompt) {
        const vagueWords = [
            'thing', 'stuff', 'something', 'anything',
            'help', 'tell me', 'give me', 'show me',
            'what', 'how', 'why', 'when', 'where',
            'please', 'thanks', 'thanks in advance'
        ];
        
        const promptLower = prompt.toLowerCase();
        const vagueCount = vagueWords.filter(word => 
            promptLower.includes(word)
        ).length;

        // If more than 3 vague words, it's too vague
        return vagueCount > 3;
    }

    /**
     * Check if prompt has ambiguity (multiple questions)
     * @param {string} prompt - The prompt
     * @returns {boolean}
     */
    hasAmbiguity(prompt) {
        const questionCount = (prompt.match(/\?/g) || []).length;
        return questionCount > 2;
    }

    /**
     * Check if prompt has no structure
     * @param {string} prompt - The prompt
     * @returns {boolean}
     */
    hasNoStructure(prompt) {
        // Check for bullet points, numbers, or line breaks
        const hasStructure = /[-•*]\s|^\d+\.|\\n/m.test(prompt);
        return !hasStructure && prompt.length > 100;
    }

    /**
     * Check if prompt has examples
     * @param {string} prompt - The prompt
     * @returns {boolean}
     */
    hasExamples(prompt) {
        return /example|sample|like|such as|for instance|e\.g\.|i\.e\.|case|scenario/i.test(prompt);
    }

    /**
     * Check if prompt has context
     * @param {string} prompt - The prompt
     * @returns {boolean}
     */
    hasContext(prompt) {
        return /because|since|given|assuming|background|context|situation|scenario|problem/i.test(prompt);
    }

    /**
     * Check if prompt has specific requirements
     * @param {string} prompt - The prompt
     * @returns {boolean}
     */
    hasSpecificRequirements(prompt) {
        return /must|should|need|require|specific|exactly|precisely|particular/i.test(prompt);
    }

    /**
     * Check if prompt is well-structured
     * @param {string} prompt - The prompt
     * @returns {boolean}
     */
    isWellStructured(prompt) {
        // Has multiple sentences or paragraphs
        const sentenceCount = (prompt.match(/[.!?]/g) || []).length;
        const paragraphCount = (prompt.match(/\n/g) || []).length;
        return sentenceCount >= 2 || paragraphCount >= 1;
    }

    /**
     * Get domain-specific score adjustment
     * @param {string} prompt - The prompt
     * @param {string} domain - The domain
     * @returns {number} Adjustment value
     */
    getDomainAdjustment(prompt, domain) {
        let adjustment = 0;

        switch (domain) {
            case 'technical':
                // Check for code-related keywords
                if (/code|function|method|class|variable|algorithm/i.test(prompt)) {
                    adjustment += 0.5;
                }
                // Check for specific tech terms
                if (/error|debug|test|performance|optimization/i.test(prompt)) {
                    adjustment += 0.5;
                }
                break;

            case 'business':
                // Check for business metrics
                if (/roi|revenue|profit|cost|budget|timeline/i.test(prompt)) {
                    adjustment += 0.5;
                }
                // Check for stakeholder awareness
                if (/stakeholder|team|department|customer|client/i.test(prompt)) {
                    adjustment += 0.5;
                }
                break;

            case 'creative_writing':
                // Check for tone/voice/style direction
                if (/tone|style|voice|mood|emotion|creative|artistic|persuasive|conversational|formal/i.test(prompt)) {
                    adjustment += 0.5;
                }
                // Check for audience awareness
                if (/audience|reader|viewer|listener|target|demographic|customer|user/i.test(prompt)) {
                    adjustment += 0.5;
                }
                break;

            case 'creative_media':
                // Check for visual style / aesthetic direction
                if (/style|aesthetic|cinematic|photorealistic|minimalist|illustration|mood|lighting|composition/i.test(prompt)) {
                    adjustment += 0.5;
                }
                // Check for platform / format specification
                if (/instagram|tiktok|youtube|reel|short|banner|poster|thumbnail|resolution|aspect ratio|format/i.test(prompt)) {
                    adjustment += 0.5;
                }
                break;

            case 'academic':
                // Check for academic rigor
                if (/research|study|analysis|evidence|data|hypothesis/i.test(prompt)) {
                    adjustment += 0.5;
                }
                // Check for proper structure
                if (/introduction|conclusion|methodology|results/i.test(prompt)) {
                    adjustment += 0.5;
                }
                break;

            case 'career':
                // Check for role clarity
                if (/role|position|job|title|career|profession/i.test(prompt)) {
                    adjustment += 0.5;
                }
                // Check for goal clarity
                if (/goal|objective|target|aspiration|growth/i.test(prompt)) {
                    adjustment += 0.5;
                }
                break;
        }

        return adjustment;
    }

    /**
     * Get score interpretation
     * @param {number} score - The score
     * @returns {string} Interpretation
     */
    getScoreInterpretation(score) {
        if (score >= 8) return 'Excellent';
        if (score >= 6) return 'Good';
        if (score >= 4) return 'Fair';
        if (score >= 2) return 'Poor';
        return 'Very Poor';
    }

    /**
     * Get score category
     * @param {number} score - The score
     * @returns {string} Category (excellent, good, fair, poor, very_poor)
     */
    getScoreCategory(score) {
        if (score >= 8) return 'excellent';
        if (score >= 6) return 'good';
        if (score >= 4) return 'fair';
        if (score >= 2) return 'poor';
        return 'very_poor';
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PromptScorer;
}

// Make available globally for bundled scripts
if (typeof window !== 'undefined') {
    window.PromptScorer = PromptScorer;
}

export { PromptScorer };
