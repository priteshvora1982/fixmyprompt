/**
 * FixMyPrompt - AutoDetectBalloon Component (v0.1.22)
 *
 * States:
 *   1. analyzing   — spinner while mock backend runs (local, fast)
 *   2. results     — ORIGINAL visual style: circular score badge + domain + gaps + CTA buttons
 *   3. questions   — backend questions (/api/generate-questions), one at a time,
 *                    auto-advance on chip select, back button, free text field
 *   4. submitting  — spinner while /api/improve-prompt runs
 *                    → hides balloon → fires 'fixmyprompt-balloon-improve-done' event
 *                    → button.js opens existing modal with result
 *   5. error       — error state
 *
 * Key design rules:
 *   - Results state uses the ORIGINAL visual layout (circular score badge, not card row)
 *   - Questions come from /api/generate-questions (same as Refine tab), with local fallback
 *   - Local fallback questions are domain-specific (HR/hiring, technical, creative_writing, creative_media, etc.)
 *   - Chip select auto-advances to next question after 400ms
 *   - Back button on every question except the first
 *   - Submit sends to /api/improve-prompt with refinementAnswers
 *   - Result handed to button.js via 'fixmyprompt-balloon-improve-done' event
 */

const BACKEND_URL = "https://web-production-b82f2.up.railway.app";

function _detectPlatform() {
    const url = window.location.href;
    if (url.includes('claude.ai')) return 'claude';
    return 'chatgpt';
}

class AutoDetectBalloon {
    constructor() {
        this.balloon = null;
        this.isVisible = false;
        this.hideTimeout = null;
        this.currentAnalysis = null;
        this.currentPrompt = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.answers = {};  // { q_0: 'answer', q_1: 'answer', ... }
    }

    // ─────────────────────────────────────────────
    // STATE 1: Analyzing spinner
    // ─────────────────────────────────────────────
    showAnalyzing() {
        this._ensureCreated();
        this._cancelAutoHide();
        this.balloon.innerHTML = `
            <div class="fixmyprompt-balloon-content">
                <div class="fixmyprompt-analyzing">
                    <div class="fixmyprompt-spinner"></div>
                    <span>Analyzing your prompt…</span>
                </div>
            </div>`;
        this._show();
        console.log('[AutoDetectBalloon] State: analyzing');
    }

    // ─────────────────────────────────────────────
    // STATE 2: Results — Modern sleek redesign
    // ─────────────────────────────────────────────
    showResults(analysis) {
        this._ensureCreated();
        this._cancelAutoHide();
        this.currentAnalysis = analysis;

        const score = analysis.score || 0;
        const scoreColor = this._scoreColor(score);
        const scoreLabel = this._scoreLabel(score);
        const domain = this._formatDomain(analysis.domain || 'general');

        // Score ring color
        const ringColors = {
            'fixmyprompt-score-green': { bg: '#22c55e', text: '#fff' },
            'fixmyprompt-score-yellow': { bg: '#f59e0b', text: '#fff' },
            'fixmyprompt-score-red': { bg: '#ef4444', text: '#fff' }
        };
        const ring = ringColors[scoreColor] || ringColors['fixmyprompt-score-red'];

        // Build gap list (top 2) — modern card style
        let gapsHtml = '';
        if (analysis.gaps && analysis.gaps.length > 0) {
            const borderColors = ['#ef4444', '#f59e0b'];
            const gapItems = analysis.gaps.slice(0, 2).map((gap, i) => {
                const text = typeof gap === 'string' ? gap : (gap.title || gap.gap || JSON.stringify(gap));
                return `<div class="fmp-gap-card" style="border-left-color:${borderColors[i] || '#f59e0b'}">${this._escapeHtml(text)}</div>`;
            }).join('');
            gapsHtml = `<div class="fmp-gaps">${gapItems}</div>`;
        }

        this.balloon.innerHTML = `
            <div class="fixmyprompt-balloon-content fmp-results-modern">
                <div class="fmp-results-header">
                    <div class="fmp-score-ring" style="background:${ring.bg};color:${ring.text}">
                        <span class="fmp-score-num">${score.toFixed(1)}</span>
                        <span class="fmp-score-denom">/10</span>
                    </div>
                    <div class="fmp-results-meta">
                        <div class="fmp-domain-badge">${this._escapeHtml(domain)}</div>
                        <div class="fmp-score-label">${this._escapeHtml(scoreLabel)}</div>
                        <div class="fmp-score-hint">Tap below to improve</div>
                    </div>
                    <button class="fmp-close-btn" title="Dismiss">✕</button>
                </div>
                ${gapsHtml}
                <div class="fmp-results-actions">
                    <button class="fmp-dismiss-btn">Dismiss</button>
                    <button class="fixmyprompt-btn-improve fmp-improve-btn">✨ Improve with Questions</button>
                </div>
            </div>`;

        this.balloon.querySelector('.fixmyprompt-btn-improve').addEventListener('click', () => {
            this._fetchAndShowQuestions();
        });

        const dismissFn = () => {
            this.hide();
            document.dispatchEvent(new CustomEvent('fixmyprompt-balloon-dismissed'));
        };
        const closeBtn = this.balloon.querySelector('.fmp-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', dismissFn);
        const dismissBtn = this.balloon.querySelector('.fmp-dismiss-btn');
        if (dismissBtn) dismissBtn.addEventListener('click', dismissFn);

        this._show();
        console.log('[AutoDetectBalloon] State: results, score:', score);
    }

    // ─────────────────────────────────────────────
    // STATE 3a: Fetch questions from backend
    // ─────────────────────────────────────────────
    async _fetchAndShowQuestions() {
        this._cancelAutoHide();

        // Show loading spinner
        this.balloon.innerHTML = `
            <div class="fixmyprompt-balloon-content">
                <div class="fixmyprompt-analyzing">
                    <div class="fixmyprompt-spinner"></div>
                    <span>Loading questions…</span>
                </div>
            </div>`;

        const prompt = this.currentPrompt || this._captureCurrentPrompt();
        const domain = (this.currentAnalysis && this.currentAnalysis.domain) || 'general';
        const localQs = this._localQuestions(domain);

        console.log('[AutoDetectBalloon] Fetching questions for domain:', domain, '| prompt:', prompt.substring(0, 80));

        // BACKEND-FIRST with contextual question generation:
        // 1. Send BOTH prompt text AND domain to /api/generate-questions
        //    The backend must use the actual prompt text to generate contextually relevant questions
        // 2. Detect if backend returned truly contextual questions vs generic fallback:
        //    - Generic fallback detected by known generic Q1 text
        //    - Also detect if questions are suspiciously short or domain-mismatched
        // 3. If backend returns contextual questions → use them
        // 4. If backend returns generic/fallback questions → use local domain-specific bank
        // 5. If backend fails or returns empty → use local bank
        const GENERIC_INDICATORS = [
            'What is your main goal with this prompt?',
            'What is your main goal?',
            'What do you want to achieve?'
        ];

        try {
            const response = await fetch(`${BACKEND_URL}/api/generate-questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,          // FULL prompt text — backend must use this for context
                    domain,
                    context: prompt  // belt-and-suspenders: also send as 'context' field
                })
            });
            const result = await response.json();

            if (result && result.success && result.questions && result.questions.length > 0) {
                const firstQ = result.questions[0];
                const firstQText = (firstQ.text || firstQ.question || '').trim();
                const isGenericFallback = GENERIC_INDICATORS.some(g => firstQText.toLowerCase().includes(g.toLowerCase()));

                if (!isGenericFallback) {
                    // Backend returned contextual questions — use them
                    this.questions = result.questions;
                    console.log('[AutoDetectBalloon] Using backend questions for domain:', domain, '(', this.questions.length, 'questions)');
                    console.log('[AutoDetectBalloon] Q1:', firstQText);
                } else {
                    // Backend returned generic fallback — use local domain-specific bank instead
                    this.questions = localQs;
                    console.log('[AutoDetectBalloon] Backend returned generic questions — using local domain bank for:', domain);
                }
            } else {
                this.questions = localQs;
                console.log('[AutoDetectBalloon] Backend returned no questions, using local fallback for domain:', domain);
            }
        } catch (err) {
            console.warn('[AutoDetectBalloon] Question fetch failed, using local fallback:', err.message);
            this.questions = localQs;
        }

        this.currentQuestionIndex = 0;
        this.answers = {};
        this._renderQuestion();
    }

    // ─────────────────────────────────────────────
    // STATE 3b: Render one question at a time
    // ─────────────────────────────────────────────
    _renderQuestion() {
        this._ensureCreated();

        const q = this.questions[this.currentQuestionIndex];
        const current = this.currentQuestionIndex + 1;
        const total = this.questions.length;
        const isLast = current === total;
        const isFirst = current === 1;

        // Normalise question format — backend returns {question, options} or {text, answers}
        const questionText = q.question || q.text || `Question ${current}`;
        let options = q.options || q.answers || q.chips || [];
        if (options.length > 0 && typeof options[0] === 'object' && options[0].label) {
            options = options.map(o => o.label);
        }

        // Progress dots (0-based index)
        const dots = Array.from({ length: total }, (_, i) =>
            `<div class="fmp-progress-dot ${i < this.currentQuestionIndex ? 'fmp-dot-done' : i === this.currentQuestionIndex ? 'fmp-dot-active' : ''}"></div>`
        ).join('');

        // Chip buttons (multi-select, same as original)
        const chipsHtml = options.map(opt =>
            `<button class="fmp-chip" data-value="${this._escapeHtml(String(opt))}">${this._escapeHtml(String(opt))}</button>`
        ).join('');

        // Free text field
        const freeTextHtml = `
            <div class="fmp-freetext-wrap">
                <input type="text" class="fmp-freetext-input" placeholder="Add more detail (optional)…" />
            </div>`;

        this.balloon.innerHTML = `
            <div class="fixmyprompt-balloon-content fmp-question-mode">
                <div class="fmp-q-header">
                    <div class="fmp-progress-dots">${dots}</div>
                    <div class="fmp-q-counter">${current} of ${total}</div>
                </div>
                <div class="fmp-question-text">${this._escapeHtml(questionText)}</div>
                <div class="fmp-chips-wrap">${chipsHtml}</div>
                ${freeTextHtml}
                <div class="fmp-q-footer">
                    ${!isFirst ? `<button class="fmp-btn-back">← Back</button>` : `<span></span>`}
                    <div class="fmp-q-footer-right">
                        <button class="fmp-btn-skip">Skip</button>
                        <button class="fixmyprompt-btn-improve fmp-btn-next" disabled>
                            ${isLast ? '✨ Improve' : 'Next →'}
                        </button>
                    </div>
                </div>
            </div>`;

        // ── Chip multi-select with auto-advance ──
        const selectedChips = new Set();
        // Restore previously selected chips for this question (if user went back)
        const prevAnswer = this.answers[`q_${this.currentQuestionIndex}`];
        if (prevAnswer) {
            prevAnswer.split(', ').forEach(v => {
                if (v) selectedChips.add(v);
            });
        }

        const nextBtn = this.balloon.querySelector('.fmp-btn-next');
        const freeInput = this.balloon.querySelector('.fmp-freetext-input');

        const updateNextBtn = () => {
            nextBtn.disabled = selectedChips.size === 0 && (!freeInput || !freeInput.value.trim());
        };

        // Restore chip visual state
        this.balloon.querySelectorAll('.fmp-chip').forEach(chip => {
            if (selectedChips.has(chip.dataset.value)) {
                chip.classList.add('fmp-chip-selected');
            }
        });
        updateNextBtn();

        // Chip click: toggle, update, auto-advance after 400ms if at least one selected
        this.balloon.querySelectorAll('.fmp-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const val = chip.dataset.value;
                if (selectedChips.has(val)) {
                    selectedChips.delete(val);
                    chip.classList.remove('fmp-chip-selected');
                } else {
                    selectedChips.add(val);
                    chip.classList.add('fmp-chip-selected');
                }
                updateNextBtn();

                // Auto-advance: 400ms after a chip is selected (not deselected)
                // IMPORTANT: On the last question, auto-advance does NOT submit — it just
                // enables the "Improve My Prompt" button and waits for the user to click.
                if (selectedChips.has(val) && selectedChips.size >= 1 && !isLast) {
                    clearTimeout(this._autoAdvanceTimeout);
                    this._autoAdvanceTimeout = setTimeout(() => {
                        this._saveAnswerAndAdvance(selectedChips, freeInput, false); // never auto-submit
                    }, 400);
                } else {
                    clearTimeout(this._autoAdvanceTimeout);
                }
            });
        });

        // Free text: typing cancels auto-advance, enables Next
        if (freeInput) {
            // Restore previous free text
            if (prevAnswer) {
                // Free text was stored separately — check if it's beyond the chips
                const chipValues = options.map(o => String(o));
                const parts = prevAnswer.split(', ');
                const freeTextPart = parts.filter(p => !chipValues.includes(p)).join(', ');
                if (freeTextPart) freeInput.value = freeTextPart;
            }
            freeInput.addEventListener('input', () => {
                clearTimeout(this._autoAdvanceTimeout);
                updateNextBtn();
            });
        }

        // Next / Improve button
        nextBtn.addEventListener('click', () => {
            this._saveAnswerAndAdvance(selectedChips, freeInput, isLast);
        });

        // Skip button (now uses .fmp-btn-skip, not .fixmyprompt-btn-dismiss)
        this.balloon.querySelector('.fmp-btn-skip').addEventListener('click', () => {
            clearTimeout(this._autoAdvanceTimeout);
            this.answers[`q_${this.currentQuestionIndex}`] = '';
            if (isLast) {
                this._submitAnswers();
            } else {
                this.currentQuestionIndex++;
                this._renderQuestion();
            }
        });

        // Back button
        const backBtn = this.balloon.querySelector('.fmp-btn-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                clearTimeout(this._autoAdvanceTimeout);
                this.currentQuestionIndex--;
                this._renderQuestion();
            });
        }

        console.log('[AutoDetectBalloon] State: question', current, 'of', total);
    }

    _saveAnswerAndAdvance(selectedChips, freeInput, isLast) {
        clearTimeout(this._autoAdvanceTimeout);
        const freeText = freeInput ? freeInput.value.trim() : '';
        const combined = [...Array.from(selectedChips), ...(freeText ? [freeText] : [])].join(', ');
        this.answers[`q_${this.currentQuestionIndex}`] = combined;

        if (isLast) {
            this._submitAnswers();
        } else {
            this.currentQuestionIndex++;
            this._renderQuestion();
        }
    }

    // ─────────────────────────────────────────────
    // STATE 4: Submit answers → /api/improve-prompt
    // ─────────────────────────────────────────────
    async _submitAnswers() {
        this._cancelAutoHide();

        this.balloon.innerHTML = `
            <div class="fixmyprompt-balloon-content">
                <div class="fixmyprompt-analyzing">
                    <div class="fixmyprompt-spinner"></div>
                    <span>Improving your prompt…</span>
                </div>
            </div>`;

        const prompt = this.currentPrompt || this._captureCurrentPrompt();
        const domain = (this.currentAnalysis && this.currentAnalysis.domain) || 'general';

        // Build refinementAnswers — same format as handleSubmitAnswers() in modal.js
        const refinementAnswers = {};
        Object.entries(this.answers).forEach(([key, value]) => {
            if (value) refinementAnswers[key] = value;
        });

        console.log('[AutoDetectBalloon] Submitting to /api/improve-prompt with answers:', refinementAnswers);

        try {
            const response = await fetch(`${BACKEND_URL}/api/improve-prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    platform: _detectPlatform(),
                    domain,
                    refinementAnswers
                })
            });

            const result = await response.json();

            if (result && result.success && result.improved) {
                console.log('[AutoDetectBalloon] Got improved prompt from backend');

                // Hide balloon — modal will take over
                this.hide();
                // Signal button.js that balloon is done (resets re-trigger state)
                document.dispatchEvent(new CustomEvent('fixmyprompt-balloon-dismissed'));

                // Fire event for button.js to open the existing modal
                // The backend does not return gaps or changes in its response.
                // Use the gaps from the original mock analysis (currentAnalysis) for both:
                //   - Manual tab (gaps): shows what was identified
                //   - What Changed tab (changes): shows what was fixed (same gaps, formatted as strings)
                const analysisGaps = (this.currentAnalysis && this.currentAnalysis.gaps) || [];
                const gapStrings = analysisGaps.map(g =>
                    typeof g === 'string' ? g : (g.title ? `${g.title}${g.reason ? ' → ' + g.reason : ''}` : JSON.stringify(g))
                );
                document.dispatchEvent(new CustomEvent('fixmyprompt-balloon-improve-done', {
                    detail: {
                        original: prompt,
                        improved: result.improved,
                        score: result.score,
                        domain,
                        gaps: analysisGaps,          // for Manual tab
                        changes: gapStrings,          // for What Changed tab
                        suggestions: result.suggestions || null
                    }
                }));
            } else {
                this.showError('Could not improve prompt. Please try again.');
            }
        } catch (err) {
            console.error('[AutoDetectBalloon] Submit failed:', err.message);
            this.showError('Connection error. Please try again.');
        }
    }

    // ─────────────────────────────────────────────
    // STATE 5: Error
    // ─────────────────────────────────────────────
    showError(message = 'Analysis failed') {
        this._ensureCreated();
        this.balloon.innerHTML = `
            <div class="fixmyprompt-balloon-content">
                <div class="fixmyprompt-error">
                    <div class="fixmyprompt-error-icon">⚠️</div>
                    <div class="fixmyprompt-error-message">${message}</div>
                    <button class="fixmyprompt-btn-dismiss" style="margin-top:8px;">Dismiss</button>
                </div>
            </div>`;
        this.balloon.querySelector('.fixmyprompt-btn-dismiss').addEventListener('click', () => {
            this.hide();
            document.dispatchEvent(new CustomEvent('fixmyprompt-balloon-dismissed'));
        });
        this._show();
        this.autoHide(8000);
        console.log('[AutoDetectBalloon] State: error', message);
    }

    // ─────────────────────────────────────────────
    // Local question fallback — DOMAIN-SPECIFIC
    // Used when backend /api/generate-questions returns generic or fails
    // ─────────────────────────────────────────────
    _localQuestions(domain) {
        const banks = {
            // HR / Hiring
            'hr': [
                { question: 'What hiring task are you working on?', options: ['Write a job description', 'Screen candidates', 'Prepare interview questions', 'Evaluate candidates', 'Make a hiring decision'] },
                { question: 'What role or level are you hiring for?', options: ['Entry level', 'Mid-level', 'Senior', 'Manager / Lead', 'Executive'] },
                { question: 'What is most important for this role?', options: ['Technical skills', 'Culture fit', 'Leadership', 'Communication', 'Domain expertise'] }
            ],
            // Technical / Engineering
            technical: [
                { question: 'What programming language or stack?', options: ['Python', 'JavaScript / TypeScript', 'Java / Kotlin', 'Go / Rust', 'Other'] },
                { question: 'What type of task is this?', options: ['Fix a bug', 'Write new code', 'Explain code', 'Optimize performance', 'Architecture / Design'] },
                { question: 'What output format do you need?', options: ['Code only', 'Code + explanation', 'Step-by-step walkthrough', 'Pseudocode', 'Documentation'] }
            ],
            // Creative Media — image gen, video, audio, design assets, social media,
            // avatars, reels, TikTok shorts, YouTube videos, website design, presentations, etc.
            creative_media: [
                { question: 'What are you creating?', options: ['Image / Illustration / AI art', 'Logo / Icon / Avatar', 'Video / Reel / Short / Animation', 'Podcast / Voiceover / Audio', 'Social media graphic / Story', 'Presentation / Slide deck', 'Email / Newsletter template', 'Website / Landing page design', 'Poster / Banner / Flyer / Infographic', 'Brand kit / Mood board / Style guide'] },
                { question: 'What platform or format?', options: ['Instagram (post / story / reel)', 'TikTok / YouTube Shorts', 'YouTube (video / thumbnail)', 'LinkedIn / Twitter / X', 'Website / Web app', 'Email client (Mailchimp, etc.)', 'PowerPoint / Google Slides / Keynote', 'Print (A4, A3, billboard, etc.)', 'AI tool (Midjourney, DALL-E, Sora, etc.)', 'No specific platform'] },
                { question: 'What style or tone?', options: ['Professional & corporate', 'Modern & minimalist', 'Bold & eye-catching', 'Warm & friendly', 'Dark & cinematic', 'Playful & fun', 'Luxury & premium', 'Retro / Vintage', 'Anime / Illustrated'] }
            ],
            // Creative Writing — text-based creative output: copy, scripts, stories, articles, etc.
            creative_writing: [
                { question: 'What type of content are you writing?', options: ['Blog post / Article', 'Website copy / Landing page copy', 'Ad copy / Marketing copy', 'Email / Newsletter', 'Social media caption / Post', 'Script / Screenplay / Dialogue', 'Short story / Fiction', 'Product description / Listing', 'Press release / Announcement', 'Speech / Presentation narrative'] },
                { question: 'What tone and style?', options: ['Professional & formal', 'Casual & conversational', 'Humorous & witty', 'Inspirational & motivational', 'Persuasive & sales-driven', 'Storytelling & narrative', 'Academic & authoritative'] },
                { question: 'Who is the target audience?', options: ['General public', 'Business professionals / B2B', 'Consumers / B2C', 'Young adults (18–30)', 'Executives & decision-makers', 'Beginners / Non-experts', 'Specific niche (describe below)'] }
            ],
            // Business / Strategy
            business: [
                { question: 'What is the business task?', options: ['Strategy & planning', 'Market analysis', 'Business communication', 'Process improvement', 'Financial analysis'] },
                { question: 'Who is the primary audience?', options: ['Executives / Board', 'Customers / Clients', 'Team members', 'Investors', 'Partners'] },
                { question: 'What output format?', options: ['Executive report', 'Presentation deck', 'Email / Memo', 'Action plan', 'Summary brief'] }
            ],
            // Finance
            finance: [
                { question: 'What financial task?', options: ['Investment analysis', 'Budgeting / Forecasting', 'Financial modeling', 'Risk assessment', 'Reporting'] },
                { question: 'What is the time horizon?', options: ['Short-term (< 1 year)', 'Medium-term (1–3 years)', 'Long-term (3+ years)', 'Not applicable'] },
                { question: 'Who is the audience?', options: ['Personal use', 'Management', 'Investors', 'Regulators', 'General public'] }
            ],
            // Academic
            academic: [
                { question: 'What type of academic work?', options: ['Essay / Paper', 'Literature review', 'Research proposal', 'Thesis / Dissertation', 'Lab report'] },
                { question: 'What academic level?', options: ['High school', 'Undergraduate', 'Graduate (Masters)', 'PhD / Doctoral', 'Professional'] },
                { question: 'What field or discipline?', options: ['STEM / Engineering', 'Social sciences', 'Humanities', 'Business / Economics', 'Medicine / Health'] }
            ],
            // Career
            career: [
                { question: 'What career task?', options: ['Write a resume / CV', 'Write a cover letter', 'Prepare for an interview', 'Negotiate salary', 'Career change advice'] },
                { question: 'What experience level?', options: ['Student / Entry level', 'Early career (1–3 yrs)', 'Mid career (3–8 yrs)', 'Senior (8+ yrs)', 'Executive'] },
                { question: 'What industry?', options: ['Technology', 'Finance / Banking', 'Healthcare', 'Marketing / Creative', 'Other'] }
            ],
            // General fallback
            general: [
                { question: 'What is your main goal?', options: ['Get information', 'Create content', 'Solve a problem', 'Learn something new', 'Get advice or recommendations'] },
                { question: 'How detailed should the response be?', options: ['Brief summary (1–2 sentences)', 'Moderate detail (1 paragraph)', 'Comprehensive (full explanation)', 'Step-by-step guide'] },
                { question: 'What format works best for you?', options: ['Paragraphs', 'Bullet points', 'Numbered list', 'Table / Comparison', 'Code or structured output'] }
            ]
        };

        // Try exact match first, then prefix match
        if (banks[domain]) return banks[domain];
        const prefix = domain.split('/')[0];
        return banks[prefix] || banks.general;
    }

    // ─────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────
    _captureCurrentPrompt() {
        const selectors = [
            'div[id="prompt-textarea"][contenteditable="true"]',
            'div.ProseMirror[contenteditable="true"]',
            'div[contenteditable="true"][role="textbox"]',
            'textarea[placeholder*="Message"]',
            'textarea[placeholder*="message"]'
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (el) {
                const text = el.contentEditable === 'true' ? el.textContent : el.value;
                if (text && text.trim()) return text.trim();
            }
        }
        return '';
    }

    _formatDomain(domain) {
        const labels = {
            technical: 'Technical', creative_writing: 'Creative Writing',
            creative_media: 'Creative Media', hr: 'HR / Hiring',
            business: 'Business', finance: 'Finance',
            academic: 'Academic', career: 'Career',
            personal: 'Personal', learning: 'Learning',
            health: 'Health', general: 'General'
        };
        return labels[domain] || domain;
    }

    _scoreColor(score) {
        if (score >= 8) return 'fixmyprompt-score-green';
        if (score >= 5) return 'fixmyprompt-score-yellow';
        return 'fixmyprompt-score-red';
    }

    _scoreLabel(score) {
        if (score >= 8) return 'Excellent';
        if (score >= 6) return 'Good';
        if (score >= 4) return 'Fair';
        return 'Needs Work';
    }

    _escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    _ensureCreated() {
        if (!this.balloon) this.create();
    }

    _show() {
        this.balloon.style.display = 'block';
        this.isVisible = true;
    }

    _cancelAutoHide() {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }

    // ─────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────
    autoHide(delayMs = 10000) {
        this._cancelAutoHide();
        this.hideTimeout = setTimeout(() => this.hide(), delayMs);
    }

    hide() {
        if (this.balloon) {
            this.balloon.style.display = 'none';
            this.isVisible = false;
        }
        this._cancelAutoHide();
        clearTimeout(this._autoAdvanceTimeout);
        console.log('[AutoDetectBalloon] Hidden');
    }

    create() {
        if (this.balloon) return;
        this.balloon = document.createElement('div');
        this.balloon.id = 'fixmyprompt-balloon';
        this.balloon.className = 'fixmyprompt-balloon-wrapper';
        this.balloon.style.display = 'none';
        this.balloon.style.position = 'fixed';
        this.balloon.style.bottom = '20px';
        this.balloon.style.right = '20px';
        this.balloon.style.zIndex = '10000';
        this.balloon.style.maxWidth = '380px';
        this.balloon.style.width = '380px';
        document.body.appendChild(this.balloon);
        console.log('[AutoDetectBalloon] DOM element created');
    }

    // ─────────────────────────────────────────────
    // STATE 6: Checkmark indicator for high-scoring prompts (v0.1.29)
    // ─────────────────────────────────────────────
    showCheckmarkIndicator() {
        this._ensureCreated();
        this._cancelAutoHide();
        this.balloon.innerHTML = `
            <div class="fixmyprompt-balloon-content">
                <div class="fixmyprompt-checkmark-indicator">
                    <div class="fixmyprompt-checkmark-icon">✓</div>
                    <span>Your prompt looks good!</span>
                </div>
            </div>`;
        this._show();
        console.log('[AutoDetectBalloon] State: checkmark indicator');
    }

    // Legacy: kept for backward compat
    onImproveClick() {
        document.dispatchEvent(new CustomEvent('fixmyprompt-improve-click', {
            detail: { analysis: this.currentAnalysis }
        }));
    }
}

export { AutoDetectBalloon };
