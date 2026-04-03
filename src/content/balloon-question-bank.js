/**
 * FixMyPrompt - Balloon Question Bank
 * Domain-aware, context-aware clarifying questions for the balloon flow.
 * Questions are selected based on detected domain and the specific gaps found.
 * Each question has quick-tap option chips + optional free-text.
 */

const QUESTION_BANK = {

    technical: [
        {
            id: 'tech_lang',
            question: 'What programming language or framework?',
            chips: ['Python', 'JavaScript / TypeScript', 'Java', 'C# / .NET', 'Go / Rust', 'SQL / Database', 'Other'],
            freeText: true,
            freeTextPlaceholder: 'e.g. React 18, Node.js, Django...',
            gapIds: ['TECH_LANGUAGE', 'TECH_VERSION']
        },
        {
            id: 'tech_task',
            question: 'What type of task is this?',
            chips: ['Fix a bug', 'Write new code', 'Optimize performance', 'Code review', 'Explain concept', 'Architecture design'],
            freeText: false,
            gapIds: ['TECH_ERROR_CONTEXT', 'TECH_CODE_EXAMPLE']
        },
        {
            id: 'tech_context',
            question: 'What environment or context?',
            chips: ['Frontend (browser)', 'Backend (server)', 'Mobile app', 'Data pipeline', 'DevOps / CI-CD', 'Machine learning'],
            freeText: true,
            freeTextPlaceholder: 'e.g. Docker, AWS Lambda, local dev...',
            gapIds: ['TECH_ENVIRONMENT']
        },
        {
            id: 'tech_output',
            question: 'What output format do you need?',
            chips: ['Working code', 'Code + explanation', 'Step-by-step guide', 'Just the fix', 'Full function/class', 'Unit tests'],
            freeText: false,
            gapIds: ['GEN_OUTPUT_FORMAT']
        }
    ],

    creative_writing: [
        {
            id: 'cw_format',
            question: 'What type of content are you writing?',
            chips: ['Blog post / Article', 'Website copy', 'Ad copy / Marketing copy', 'Email / Newsletter', 'Social media caption', 'Script / Screenplay', 'Short story / Fiction', 'Product description', 'Press release', 'Speech / Presentation narrative', 'Poem / Song lyrics'],
            freeText: true,
            freeTextPlaceholder: 'e.g. LinkedIn article, cold email sequence, landing page...',
            gapIds: ['CREA_FORMAT_LENGTH']
        },
        {
            id: 'cw_tone',
            question: 'What tone and voice?',
            chips: ['Professional & formal', 'Casual & conversational', 'Witty / Humorous', 'Inspirational & motivational', 'Persuasive & sales-driven', 'Storytelling & narrative', 'Academic & authoritative'],
            freeText: true,
            freeTextPlaceholder: 'e.g. like a TED talk, like a friend texting, David Ogilvy style...',
            gapIds: ['CREA_TONE_STYLE']
        },
        {
            id: 'cw_audience',
            question: 'Who is the target audience?',
            chips: ['General public', 'Business professionals / B2B', 'Consumers / B2C', 'Young adults (18–30)', 'Executives & decision-makers', 'Beginners / Non-experts', 'Specific niche'],
            freeText: true,
            freeTextPlaceholder: 'e.g. startup founders, parents, SaaS buyers, gamers...',
            gapIds: ['CREA_AUDIENCE']
        },
        {
            id: 'cw_length',
            question: 'Approximate length or format?',
            chips: ['Very short (< 100 words)', 'Short (100–300 words)', 'Medium (300–600 words)', 'Long (600–1000 words)', 'Very long (1000+ words)', 'Structured (headings, bullets)', 'Single paragraph'],
            freeText: false,
            gapIds: ['CREA_FORMAT_LENGTH']
        }
    ],

    creative_media: [
        {
            id: 'media_type',
            question: 'What are you creating?',
            chips: ['Image / Illustration / AI art', 'Logo / Icon / Avatar', 'Video clip / Movie scene', 'Reel / TikTok / YouTube Short', 'Podcast / Voiceover / Audio', 'Social media graphic / Story', 'Presentation / Slide deck', 'Poster / Banner / Flyer', 'Website / Landing page design', 'Brand kit / Mood board'],
            freeText: true,
            freeTextPlaceholder: 'e.g. product photo, AI avatar, YouTube thumbnail, explainer video...',
            gapIds: ['MEDIA_STYLE', 'MEDIA_SUBJECT']
        },
        {
            id: 'media_style',
            question: 'What visual style or aesthetic?',
            chips: ['Photorealistic', 'Cinematic / Film noir', 'Illustration / Cartoon', 'Anime / Manga', 'Minimalist / Flat design', 'Surreal / Fantasy', 'Vintage / Retro', 'Dark & moody', 'Luxury & premium'],
            freeText: true,
            freeTextPlaceholder: 'e.g. Studio Ghibli, Blade Runner, Bauhaus, Wes Anderson...',
            gapIds: ['MEDIA_STYLE']
        },
        {
            id: 'media_platform',
            question: 'Where will this be used?',
            chips: ['Instagram (post / story / reel)', 'TikTok / YouTube Shorts', 'YouTube (video / thumbnail)', 'LinkedIn / Twitter / X', 'Website / Web app', 'Print (A4, billboard, packaging)', 'AI tool (Midjourney, DALL-E, Sora)', 'Email / Newsletter'],
            freeText: true,
            freeTextPlaceholder: 'e.g. app icon, billboard, product packaging, streaming platform...',
            gapIds: ['MEDIA_TECHNICAL_PARAMS']
        },
        {
            id: 'media_mood',
            question: 'What mood or emotion should it convey?',
            chips: ['Energetic / Exciting', 'Calm / Peaceful', 'Mysterious / Dramatic', 'Warm / Inviting', 'Professional / Clean', 'Playful / Fun', 'Melancholic / Nostalgic', 'Inspiring / Uplifting'],
            freeText: false,
            gapIds: ['MEDIA_LIGHTING', 'MEDIA_STYLE']
        }
    ],

    business: [
        {
            id: 'biz_task',
            question: 'What is the business task?',
            chips: ['Marketing strategy', 'Sales pitch / Proposal', 'Business plan', 'Competitive analysis', 'Product launch', 'Team communication', 'Investor deck'],
            freeText: true,
            freeTextPlaceholder: 'e.g. Q4 growth strategy, partnership proposal...',
            gapIds: ['BIZ_OBJECTIVE']
        },
        {
            id: 'biz_audience',
            question: 'Who is the primary audience?',
            chips: ['Customers / End users', 'Investors / Board', 'Internal team', 'Executives / C-suite', 'Partners / Vendors', 'General public'],
            freeText: true,
            freeTextPlaceholder: 'e.g. SMB owners, enterprise IT buyers...',
            gapIds: ['BIZ_AUDIENCE']
        },
        {
            id: 'biz_context',
            question: 'What is your company stage / type?',
            chips: ['Early-stage startup', 'Growth-stage startup', 'SMB', 'Enterprise / Large corp', 'Agency / Consulting', 'Non-profit'],
            freeText: true,
            freeTextPlaceholder: 'e.g. B2B SaaS, e-commerce, healthcare...',
            gapIds: ['BIZ_CONTEXT']
        }
    ],

    finance: [
        {
            id: 'fin_goal',
            question: 'What is your financial goal?',
            chips: ['Build long-term wealth', 'Generate passive income', 'Save for retirement', 'Start investing', 'Reduce debt', 'Start a business'],
            freeText: true,
            freeTextPlaceholder: 'e.g. financial independence by 40...',
            gapIds: ['GEN_CONTEXT']
        },
        {
            id: 'fin_situation',
            question: 'What is your current situation?',
            chips: ['Just starting out', 'Building savings', 'Have some investments', 'Financially stable', 'High income, low savings', 'Business owner'],
            freeText: false,
            gapIds: ['GEN_CONTEXT']
        },
        {
            id: 'fin_horizon',
            question: 'What is your time horizon?',
            chips: ['Short-term (< 1 year)', 'Medium-term (1–5 years)', 'Long-term (5–10 years)', 'Very long-term (10+ years)'],
            freeText: false,
            gapIds: ['GEN_CONSTRAINTS']
        }
    ],

    academic: [
        {
            id: 'acad_type',
            question: 'What type of academic work?',
            chips: ['Research paper', 'Essay / Thesis', 'Literature review', 'Case study', 'Lab report', 'Presentation / Slides', 'Dissertation'],
            freeText: true,
            freeTextPlaceholder: 'e.g. undergraduate essay, PhD proposal...',
            gapIds: ['ACAD_RESEARCH_QUESTION']
        },
        {
            id: 'acad_field',
            question: 'What academic field or discipline?',
            chips: ['Computer Science / Tech', 'Business / Economics', 'Social Sciences', 'Natural Sciences', 'Humanities / Arts', 'Medicine / Health', 'Law / Policy'],
            freeText: true,
            freeTextPlaceholder: 'e.g. behavioral psychology, quantum physics...',
            gapIds: ['ACAD_METHODOLOGY']
        },
        {
            id: 'acad_level',
            question: 'What academic level?',
            chips: ['High school', 'Undergraduate', 'Postgraduate (Masters)', 'PhD / Doctoral', 'Professional / Industry'],
            freeText: false,
            gapIds: ['GEN_CONTEXT']
        }
    ],

    career: [
        {
            id: 'career_task',
            question: 'What career task are you working on?',
            chips: ['Resume / CV', 'Cover letter', 'Interview prep', 'Salary negotiation', 'Career change', 'LinkedIn profile', 'Performance review'],
            freeText: true,
            freeTextPlaceholder: 'e.g. applying for senior PM role...',
            gapIds: ['CAREER_ROLE_CONTEXT']
        },
        {
            id: 'career_level',
            question: 'What is your experience level?',
            chips: ['Student / Entry level', 'Junior (1–3 years)', 'Mid-level (3–7 years)', 'Senior (7–15 years)', 'Executive / Director', 'Career changer'],
            freeText: false,
            gapIds: ['CAREER_ROLE_CONTEXT']
        },
        {
            id: 'career_industry',
            question: 'What industry or field?',
            chips: ['Tech / Software', 'Finance / Banking', 'Healthcare', 'Marketing / Media', 'Consulting', 'Education', 'Government / Non-profit'],
            freeText: true,
            freeTextPlaceholder: 'e.g. fintech startup, Big 4 consulting...',
            gapIds: ['CAREER_COMPANY_CONTEXT']
        }
    ],

    personal: [
        {
            id: 'pers_goal',
            question: 'What personal goal are you working on?',
            chips: ['Health & fitness', 'Mental wellness', 'Productivity', 'Learning a skill', 'Relationships', 'Habits & routines', 'Life planning'],
            freeText: true,
            freeTextPlaceholder: 'e.g. run a marathon, meditate daily...',
            gapIds: ['GEN_CONTEXT']
        },
        {
            id: 'pers_situation',
            question: 'Where are you starting from?',
            chips: ['Complete beginner', 'Have tried before', 'Some progress made', 'Stuck / plateaued', 'Rebuilding after setback'],
            freeText: false,
            gapIds: ['GEN_CONTEXT']
        },
        {
            id: 'pers_support',
            question: 'What kind of support do you need?',
            chips: ['Actionable plan', 'Motivation & mindset', 'Expert advice', 'Accountability system', 'Resources & tools', 'Just talk it through'],
            freeText: false,
            gapIds: ['GEN_INSTRUCTION']
        }
    ],

    general: [
        {
            id: 'gen_goal',
            question: 'What is the main goal of your prompt?',
            chips: ['Get information / research', 'Create content', 'Solve a problem', 'Get advice', 'Brainstorm ideas', 'Summarize / Analyze'],
            freeText: true,
            freeTextPlaceholder: 'Describe what you want to achieve...',
            gapIds: ['GEN_CONTEXT', 'GEN_INSTRUCTION']
        },
        {
            id: 'gen_audience',
            question: 'Who is the output for?',
            chips: ['Just for me', 'My team', 'Clients / Customers', 'General public', 'Specific expert audience'],
            freeText: true,
            freeTextPlaceholder: 'e.g. non-technical stakeholders...',
            gapIds: ['GEN_ROLE']
        },
        {
            id: 'gen_format',
            question: 'What output format do you prefer?',
            chips: ['Plain text / Paragraph', 'Bullet points / List', 'Step-by-step guide', 'Table / Comparison', 'Code', 'JSON / Structured data'],
            freeText: false,
            gapIds: ['GEN_OUTPUT_FORMAT']
        }
    ]
};

/**
 * Select the most relevant 2-3 questions for a given domain and detected gaps.
 * Prioritizes questions that address the top detected gaps.
 */
function selectQuestionsForContext(domain, detectedGapIds = [], maxQuestions = 3) {
    const domainKey = (domain || 'general').toLowerCase().replace('/', '_').replace('-', '_');
    const pool = QUESTION_BANK[domainKey] || QUESTION_BANK.general;
    
    if (!pool || pool.length === 0) return QUESTION_BANK.general.slice(0, maxQuestions);
    
    // Score each question by how many detected gaps it addresses
    const scored = pool.map(q => {
        const relevance = (q.gapIds || []).filter(gid => detectedGapIds.includes(gid)).length;
        return { q, relevance };
    });
    
    // Sort by relevance descending, then take top N
    scored.sort((a, b) => b.relevance - a.relevance);
    
    return scored.slice(0, maxQuestions).map(s => s.q);
}

export { QUESTION_BANK, selectQuestionsForContext };
