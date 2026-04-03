/**
 * FixMyPrompt - Mock Backend Analyzer
 * Simulates backend API for testing before real backend is deployed
 */

class MockBackendAnalyzer {
    constructor() {
        this.enabled = true;
        this.failureRate = 0; // 0% failure rate - disabled for testing
        
        console.log('[MockBackendAnalyzer] Initialized');
    }

    /**
     * Analyze prompt (simulates backend API)
     */
    async analyze(prompt) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simulate occasional failures
        if (Math.random() < this.failureRate) {
            throw new Error('Mock backend: Simulated failure');
        }

        // Detect domain from prompt
        const domain = this.detectDomain(prompt);

        // Generate analysis
        const analysis = this.generateAnalysis(prompt, domain);

        console.log('[MockBackendAnalyzer] Analysis complete:', analysis);
        return analysis;
    }

    /**
     * Detect domain from prompt text.
     *
     * Order matters — more specific domains are checked before general ones.
     * creative_media  → visual/audio/video generation and design assets
     * creative_writing → text-based creative output (copy, scripts, stories, etc.)
     */
    detectDomain(prompt) {
        const lower = prompt.toLowerCase();

        // ── Technical ──────────────────────────────────────────────────────────
        if (/\b(code|python|javascript|typescript|java|c\+\+|c#|\.net|rust|go|golang|sql|nosql|database|api|rest|graphql|framework|library|algorithm|debug|error|exception|stack trace|git|docker|kubernetes|aws|azure|gcp|devops|ci\/cd|unit test|regex|bash|shell script|linux|server|backend|frontend|react|vue|angular|node\.?js|django|flask|fastapi|spring|laravel)\b/.test(lower)) {
            return 'technical';
        }

        // ── HR / Hiring ────────────────────────────────────────────────────────
        if (/\b(hire|recruit|hiring|recruitment|candidate|applicant|onboarding|job posting|job description|talent|personnel|screening|interview question|performance review|employee|workforce|headcount|hr policy|compensation|benefits package)\b/.test(lower)) {
            return 'hr';
        }

        // ── Creative Media — visual, video, audio, design assets ───────────────
        // Checked BEFORE creative_writing so "create a poster" doesn't fall into writing.
        if (
            // AI generation tools
            /\b(midjourney|stable diffusion|dall-?e|sora|runway|kling|pika|suno|udio|elevenlabs|heygen|synthesia|d-id)\b/.test(lower) ||
            // Explicit generation verbs + media nouns
            /\b(generate|create|design|make|produce|render|animate|illustrate|draw)\b.{0,40}\b(image|photo|picture|illustration|artwork|graphic|visual|logo|icon|avatar|character|portrait|headshot|thumbnail|poster|banner|flyer|brochure|infographic|mockup|wireframe|prototype|storyboard|mood board|brand kit|color palette|font pairing|template|slide deck|presentation|powerpoint|ppt|keynote|google slides|video|reel|short|clip|animation|gif|motion graphic|explainer video|promo video|product video|testimonial video|webinar|podcast|voiceover|voice over|audio clip|music track|beat|jingle|album cover|ebook cover|book cover|course thumbnail|app icon|favicon|icon set|wallpaper|background image|texture|pattern|svg|vector)\b/.test(lower) ||
            // Direct media type mentions
            /\b(logo|banner|poster|thumbnail|flyer|brochure|infographic|mockup|wireframe|storyboard|mood board|brand identity|brand kit|color palette|font pairing|ui design|ux design|figma|canva|photoshop|illustrator|adobe|sketch|invision|zeplin|framer)\b/.test(lower) ||
            // Video formats
            /\b(reel|tiktok|tiktok short|instagram reel|youtube short|youtube video|youtube thumbnail|channel art|video script|video production|video edit|motion graphic|explainer video|promo video|product video|testimonial video|webinar recording|screen recording|screencast)\b/.test(lower) ||
            // Social media content (visual/media type)
            /\b(instagram post|instagram story|instagram carousel|linkedin post|linkedin banner|twitter banner|facebook post|facebook cover|pinterest pin|snapchat|social media graphic|social media banner|social media post|cover image|profile picture|profile photo)\b/.test(lower) ||
            // Audio / voice
            /\b(voiceover|voice over|podcast|podcast script|audio script|text.to.speech|tts|music generation|ai music|ai voice|ai avatar|talking avatar|digital avatar|virtual avatar|ai video|ai generated video)\b/.test(lower) ||
            // Website / landing page design (visual/design intent)
            /\b(landing page design|website design|web design|homepage design|ui mockup|ux mockup|app design|mobile app design|app screen|app ui)\b/.test(lower) ||
            // Presentations
            /\b(slide deck|presentation design|powerpoint design|ppt design|keynote design|google slides design|pitch deck design|investor deck design)\b/.test(lower) ||
            // Email templates (design intent)
            /\b(email template|email design|newsletter design|email banner|email header|html email)\b/.test(lower) ||
            // Print / physical media
            /\b(business card|letterhead|packaging design|label design|merchandise design|t-shirt design|mug design|billboard|signage|print design|print-ready|cmyk)\b/.test(lower) ||
            // Text-to-X generation
            /\btext.to.(image|video|music|audio|speech|art)\b/.test(lower) ||
            // Photorealism / cinematic / art style keywords
            /\b(photorealistic|cinematic|8k|4k resolution|hyperrealistic|ultra-detailed|concept art|digital art|ai art|generative art|nft art|pixel art|voxel art|isometric|low poly|flat design|material design|glassmorphism|neumorphism|brutalism|retro design|vintage design|art deco|bauhaus|cyberpunk aesthetic|vaporwave|synthwave|studio ghibli style|anime style|manga style|comic style|watercolor style|oil painting style|sketch style|line art)\b/.test(lower)
        ) {
            return 'creative_media';
        }

        // ── Creative Writing — text-based creative output ──────────────────────
        if (
            /\b(write|draft|compose|craft|pen|author|create)\b.{0,40}\b(blog post|article|essay|story|short story|fiction|novel|chapter|poem|poetry|song|lyrics|script|screenplay|dialogue|monologue|speech|toast|vow|cover letter|bio|biography|about me|tagline|slogan|headline|subject line|email|newsletter|copy|ad copy|advertisement copy|product description|product listing|website copy|landing page copy|homepage copy|about page|sales page|sales copy|pitch|proposal|press release|announcement|social media caption|caption|tweet|thread|linkedin article|blog intro|blog outline|content brief|content calendar|editorial|op-ed|review|testimonial|case study|white paper|ebook|guide|how-to|listicle|FAQ|knowledge base article|help article|documentation|readme|report|summary|brief|memo|letter|message|greeting card|invitation|thank you note|apology|resignation letter|complaint letter|recommendation letter|reference letter|acceptance speech|award speech|eulogy|wedding speech|best man speech|maid of honor speech|motivational speech|ted talk|podcast script|video script|youtube script|explainer script|narrator script|voiceover script|chatbot script|email sequence|drip campaign|onboarding email|cold email|follow-up email|outreach email|pitch email|newsletter issue|press kit|media kit|brand story|company story|founder story|origin story|mission statement|vision statement|value proposition|elevator pitch|executive summary|business plan narrative|investor story|startup story|product story|feature announcement|release notes|changelog|user story|persona|customer journey|empathy map)\b/.test(lower) ||
            // Standalone creative writing triggers
            /\b(blog post|short story|fiction|novel|poem|poetry|song lyrics|screenplay|script|website copy|landing page copy|sales copy|ad copy|email copy|newsletter|product description|tagline|slogan|headline|caption|tweet|linkedin post|press release|white paper|ebook|case study|content brief|content calendar|editorial|op-ed|listicle|how-to guide|faq|knowledge base|readme|mission statement|value proposition|elevator pitch|brand story|founder story|origin story|investor pitch|pitch deck narrative|cold email|email sequence|drip campaign|onboarding email|outreach email)\b/.test(lower) ||
            // Generic creative writing verbs (lower priority, no media noun nearby)
            /\b(write a|draft a|compose a|craft a|create a)\b.{0,60}\b(story|poem|essay|article|post|email|letter|message|script|speech|copy|content|description|bio|about|summary|brief|guide|tutorial|review|report|proposal|plan|outline|draft)\b/.test(lower)
        ) {
            return 'creative_writing';
        }

        // ── Finance ────────────────────────────────────────────────────────────
        if (/\b(invest|investing|investment|stock|stocks|crypto|cryptocurrency|bitcoin|ethereum|trading|portfolio|dividend|yield|return|bond|etf|index fund|mutual fund|hedge fund|financial independence|fire movement|passive income|net worth|asset allocation|wealth|millionaire|billionaire|retirement|401k|ira|roth|tax|savings|budget|debt|mortgage|loan|interest rate|inflation|compound interest|real estate|reit)\b/.test(lower)) {
            return 'finance';
        }

        // ── Business ───────────────────────────────────────────────────────────
        if (/\b(business|management|strategy|marketing|sales|company|revenue|roi|startup|brand|campaign|go-to-market|gtm|product-market fit|pmf|kpi|okr|quarterly review|board meeting|stakeholder|investor|fundraising|series a|series b|vc|venture capital|pitch deck|business model|competitive analysis|swot|market research|customer acquisition|churn|retention|growth hacking|conversion rate|funnel|pipeline|crm|b2b|b2c|saas|ecommerce|e-commerce)\b/.test(lower)) {
            return 'business';
        }

        // ── Learning ───────────────────────────────────────────────────────────
        if (/\b(learn|study|tutorial|course|education|teach|understand|explain|how to|lesson|curriculum|syllabus|quiz|exam|test|homework|assignment|practice|exercise|skill|beginner|intermediate|advanced|masterclass|bootcamp|workshop|certification|degree|diploma)\b/.test(lower)) {
            return 'learning';
        }

        // ── Health ─────────────────────────────────────────────────────────────
        if (/\b(health|medical|doctor|disease|symptom|treatment|medicine|diet|exercise|fitness|nutrition|mental health|therapy|wellness|supplement|medication|diagnosis|condition|chronic|acute|surgery|recovery|rehabilitation|physical therapy|yoga|meditation|sleep|stress|anxiety|depression)\b/.test(lower)) {
            return 'health';
        }

        return 'general';
    }

    /**
     * Generate realistic analysis based on domain
     */
    generateAnalysis(prompt, domain) {
        const baseScore = this.calculateBaseScore(prompt);
        const domainBonus = this.getDomainBonus(domain);
        const finalScore = Math.min(10, Math.max(0, baseScore + domainBonus));

        const gaps = this.generateGaps(prompt, domain);
        const downsides = this.generateDownsides(prompt, domain);
        
        // Generate suggestions from gaps
        const severityIcons = ['🔴', '🟠', '🟡', '🟢'];
        const severityLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
        const suggestions = {
            balloon: gaps.slice(0, 2).map((gap, i) => `${severityIcons[i % 4]} ${severityLevels[i % 4]}: ${gap}`),
            modal: gaps.map((gap, i) => `<div style="margin-bottom: 12px; padding: 12px; border-left: 4px solid #${i === 0 ? 'ef4444' : i === 1 ? 'f97316' : 'eab308'}; background: #f9fafb;"><strong>${severityIcons[i % 4]} ${severityLevels[i % 4]}: ${gap}</strong></div>`).join('')
        };

        return {
            domain,
            score: parseFloat(finalScore.toFixed(1)),
            gaps,
            downsides,
            suggestions,
            confidence: 0.85 + Math.random() * 0.1,
            source: 'mock-backend'
        };
    }

    /**
     * Calculate base score from prompt length and clarity
     */
    calculateBaseScore(prompt) {
        let score = 5; // Base score

        // Length bonus
        if (prompt.length > 50) score += 1;
        if (prompt.length > 100) score += 1;

        // Clarity indicators
        if (/\?/.test(prompt)) score += 0.5; // Has question mark
        if (/specific|particular|exactly|precisely/.test(prompt.toLowerCase())) score += 1;
        if (/context|background|situation/.test(prompt.toLowerCase())) score += 1;

        // Vagueness penalties
        if (/how do i|what is|tell me about|explain/.test(prompt.toLowerCase())) score -= 0.5;

        return score;
    }

    /**
     * Get domain-specific score bonus
     */
    getDomainBonus(domain) {
        const bonuses = {
            'technical': 0.5,
            'hr': 0.3,
            'business': 0.3,
            'creative_writing': 0.2,
            'creative_media': 0.2,
            'learning': 0.4,
            'health': 0.1,
            'general': 0
        };
        return bonuses[domain] || 0;
    }

    /**
     * Generate gaps based on domain — with impact statements
     */
    generateGaps(prompt, domain) {
        const gapsByDomain = {
            'technical': [
                'No programming language specified → AI cannot provide language-specific solutions',
                'Missing error message or stack trace → AI will guess instead of solving the actual problem',
                'No expected vs actual behavior → AI cannot diagnose the root cause',
                'No code snippet provided → AI gives generic advice instead of precise fixes',
                'Environment details missing → solution may not work in your setup'
            ],
            'hr': [
                'Job title/role unclear → AI may suggest irrelevant qualifications',
                'Company size/industry unknown → salary and benefits advice will be inaccurate',
                'Location/remote status not specified → market rates and legal requirements will be wrong',
                'No salary range mentioned → AI cannot provide competitive compensation guidance',
                'Experience level ambiguous → job description will miss critical requirements'
            ],
            'business': [
                'Target audience not defined → strategy advice will be too generic',
                'Company stage unclear → recommendations may not fit your growth phase',
                'Success metrics not specified → AI cannot measure impact of suggestions',
                'Competitive landscape missing → strategy may ignore key market dynamics',
                'Budget/resource constraints absent → recommendations may be impractical'
            ],
            'creative_writing': [
                'Tone and voice not defined → output will feel generic, not matching your brand or style',
                'Target audience unclear → content may miss the mark, bore readers, or use wrong register',
                'Content type/format not specified → AI will guess length and structure, wasting your time',
                'No reference examples or style guide → AI cannot match your desired quality or voice',
                'Platform or channel not mentioned → content may violate word limits or formatting rules',
                'Call-to-action missing → copy will inform but not convert or motivate readers',
                'SEO keywords not provided → article will not rank or reach intended audience',
                'Desired outcome unclear → AI will write something generic instead of goal-driven copy'
            ],
            'creative_media': [
                'Visual style not specified → AI will generate a generic, uninspired result',
                'Subject or scene description too vague → expect distorted or off-target outputs',
                'No aspect ratio or resolution → output may not fit your intended platform or format',
                'Missing lighting, mood, and composition → image will look flat and amateurish',
                'No negative prompt → common AI artifacts (extra fingers, blurry faces, watermarks) likely',
                'Target platform not specified → dimensions and format will be wrong for the channel',
                'Brand colors, fonts, or style guide not mentioned → output will not match your identity',
                'Audience and purpose not defined → visuals and messaging will miss the mark',
                'No reference style, artist, or examples → AI cannot match your desired aesthetic',
                'Video format/aspect ratio not specified → reel or short may be cropped incorrectly'
            ],
            'learning': [
                'Current skill level unknown → explanation will be too basic or too advanced',
                'Learning style not specified → teaching method may not match how you learn',
                'Time commitment unclear → plan will be unrealistic for your schedule',
                'Learning goals vague → AI cannot create focused, measurable learning path',
                'Prior experience not mentioned → prerequisites and pacing will be wrong'
            ],
            'health': [
                'Symptom details missing → AI cannot accurately assess the condition',
                'Duration of condition unclear → severity assessment will be inaccurate',
                'Medical history not provided → AI may suggest harmful treatments',
                'Current medications not listed → drug interactions unknown',
                'Lifestyle factors missing → personalized advice will be generic'
            ],
            'general': [
                'Specific context missing → AI will make wrong assumptions',
                'Background information absent → AI lacks critical context',
                'Desired outcome unclear → AI will guess what success looks like',
                'Constraints/limitations not mentioned → AI may suggest impractical solutions',
                'No examples provided → AI cannot match your expected quality'
            ]
        };

        const gaps = gapsByDomain[domain] || gapsByDomain['general'];
        return gaps.slice(0, 3).sort(() => Math.random() - 0.5);
    }

    /**
     * Generate downsides based on domain
     */
    generateDownsides(prompt, domain) {
        const downsidesByDomain = {
            'technical': [
                'AI might provide generic solutions',
                'May need to provide more error context',
                'Could get outdated framework advice'
            ],
            'hr': [
                'AI might give generic hiring advice',
                'Could miss industry-specific nuances',
                'May not account for local regulations'
            ],
            'business': [
                'AI might give generic business advice',
                'Could miss industry-specific context',
                'May not account for company stage'
            ],
            'creative_writing': [
                'AI may produce generic, on-brand copy without style guidance',
                'Output may not convert without a clear call-to-action',
                'Tone may feel off without audience and voice definition'
            ],
            'creative_media': [
                'AI may produce generic, unstyled output without style reference',
                'Common artifacts likely without negative prompts or detail',
                'Output dimensions may not match intended platform format'
            ],
            'learning': [
                'AI might not match your learning pace',
                'Could be too basic or too advanced',
                'May not account for learning style'
            ],
            'health': [
                'AI cannot replace professional medical advice',
                'Should consult a doctor for diagnosis',
                'Not suitable for emergencies'
            ],
            'general': [
                'Prompt is too vague for specific help',
                'AI might give generic answers',
                'Could benefit from more context'
            ]
        };

        const downsides = downsidesByDomain[domain] || downsidesByDomain['general'];
        return downsides.slice(0, 2).sort(() => Math.random() - 0.5);
    }
}

export { MockBackendAnalyzer };
