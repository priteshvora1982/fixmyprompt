/**
 * FixMyPrompt - Question Generator
 * Generates MCQ-style refinement questions
 */

import { API } from "./constants.js";

class QuestionGenerator {
    /**
     * Get local fallback questions for specific topics
     */
    getLocalFallbackQuestions(prompt, domain) {
        const promptLower = prompt.toLowerCase();
        
        // Finance-related fallback questions
        if (promptLower.includes('millionaire') || promptLower.includes('wealth') || 
            promptLower.includes('financial') || promptLower.includes('money') || 
            promptLower.includes('investment') || promptLower.includes('income')) {
            return [
                {
                    question: "Q1: What is your primary financial goal?",
                    options: [
                        "Build long-term wealth",
                        "Generate passive income",
                        "Start a business",
                        "Invest in markets",
                        "Other"
                    ]
                },
                {
                    question: "Q2: What is your current financial situation?",
                    options: [
                        "Just starting",
                        "Building savings",
                        "Have some investments",
                        "Already financially secure",
                        "Other"
                    ]
                },
                {
                    question: "Q3: What support do you need most?",
                    options: [
                        "Investment strategies",
                        "Business guidance",
                        "Financial planning",
                        "Risk management",
                        "Other"
                    ]
                }
            ];
        }
        
        return null;
    }

    /**
     * Generate refinement questions from backend with fallback
     */
    async generateQuestions(prompt, domain) {
        try {
            const response = await fetch(`${API.BASE_URL}${API.ENDPOINTS.GENERATE_QUESTIONS}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ prompt, domain })
            });

            if (!response.ok) {
                console.warn(`[FixMyPrompt] Question generation failed: ${response.statusText}`);
                // Try local fallback questions
                const fallback = this.getLocalFallbackQuestions(prompt, domain);
                if (fallback) {
                    console.log(`[FixMyPrompt] Using local fallback questions for finance topic`);
                    return fallback;
                }
                return null;
            }

            const data = await response.json();
            console.log(`[FixMyPrompt] Generated ${data.questions.length} refinement questions`);
            return data.questions;
        } catch (error) {
            console.error("[FixMyPrompt] Error generating questions:", error);
            // Try local fallback questions on error
            const fallback = this.getLocalFallbackQuestions(prompt, domain);
            if (fallback) {
                console.log(`[FixMyPrompt] Using local fallback questions due to error`);
                return fallback;
            }
            return null;
        }
    }

    /**
     * Format questions for display in modal
     */
    formatQuestionsForDisplay(questions) {
        if (!questions || questions.length === 0) {
            return [];
        }

        return questions.map((q, index) => ({
            id: `question-${index}`,
            question: q.question,
            options: q.options || [],
            selectedOption: null,
            type: "mcq"
        }));
    }

    /**
     * Collect user answers
     */
    collectAnswers(formattedQuestions) {
        const answers = {};
        formattedQuestions.forEach((q) => {
            const selected = document.querySelector(`input[name="${q.id}"]:checked`);
            if (selected) {
                answers[q.id] = selected.value;
            }
        });
        return answers;
    }
}

export const questionGenerator = new QuestionGenerator();
