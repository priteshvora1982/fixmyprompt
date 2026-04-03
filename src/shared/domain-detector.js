/**
 * FixMyPrompt - Domain Detector
 * Detects the domain/topic of a prompt using semantic/phrase-based analysis
 */

import { DOMAINS } from "./constants.js";

class DomainDetector {
    /**
     * Detect domain using semantic/phrase-based analysis
     * Analyzes phrases and context, not just keywords
     */
    detectDomain(prompt) {
        console.log('[EXT] FixMyPrompt ===== DOMAIN DETECTION START =====');
        console.log('[EXT] FixMyPrompt Input prompt:', prompt);
        console.log('[EXT] FixMyPrompt DOMAINS object:', DOMAINS);
        
        const promptLower = prompt.toLowerCase();
        console.log('[EXT] FixMyPrompt Lowercase prompt:', promptLower);
        
        // Phrase patterns that indicate domain context
        const phrasePatterns = {
            [DOMAINS.PERSONAL]: [
                /how to (be|become|get|improve|develop|build|increase|boost)/i,
                /ways to (improve|enhance|increase|build|develop|achieve|reach)/i,
                /steps to (achieve|reach|improve|build|develop|become)/i,
                /personal (growth|development|improvement)/i,
                /self[- ]?(improvement|help|development|care|growth)/i,
                /my (goals|dreams|life|career path|future)/i,
                /how do i (improve|become|get|achieve|reach|build)/i,
                /tips for (personal|self|life|health|fitness|wellness)/i,
                /guide to (personal|self|life|health|wellness)/i,
            ],
            [DOMAINS.BUSINESS]: [
                /business (strategy|model|plan|development|growth)/i,
                /how to (start|run|grow|scale|manage) (a )?business/i,
                /startup (strategy|plan|development|growth)/i,
                /marketing (strategy|plan|campaign|approach)/i,
                /sales (strategy|technique|approach|method)/i,
                /enterprise (strategy|solution|development)/i,
                /roi|revenue|profit|market share|competitive advantage/i,
            ],
            [DOMAINS.FINANCE]: [
                /billionaire|millionaire|wealth|financial|investment|money|income/i,
                /how to (make|earn|build|accumulate|grow) (money|wealth|income|assets)/i,
                /financial (planning|strategy|goal|independence|freedom|security)/i,
                /passive (income|revenue|cash flow)/i,
                /stock|crypto|trading|portfolio|dividend|return|yield/i,
                /net worth|asset allocation|capital|investment strategy/i,
                /become (rich|wealthy|financially independent)/i,
            ],
            [DOMAINS.TECHNICAL]: [
                /how to (code|program|debug|optimize|implement)/i,
                /write (code|algorithm|function|script)/i,
                /technical (solution|implementation|approach|design)/i,
                /software (development|architecture|design|engineering)/i,
                /system (design|architecture|optimization)/i,
                /api (design|implementation|documentation)/i,
                /database (design|optimization|query)/i,
            ],
            [DOMAINS.CREATIVE_WRITING]: [
                /write (a |the )?(story|poem|script|novel|dialogue|song|blog post|article|essay|email|newsletter|copy|caption|tagline|slogan|press release|speech|bio|description)/i,
                /create (a |the )?(story|poem|script|character|scene|plot|blog post|article|email|newsletter|landing page copy|website copy|sales copy|ad copy|product description)/i,
                /how to (write|create|develop) (creative|fiction|narrative|compelling|engaging|persuasive)/i,
                /creative (writing|content|copy|direction)/i,
                /character (development|creation|design)/i,
                /plot (development|creation|design)/i,
                /write (website|landing page|sales|ad|marketing|email|product|blog|social media) (copy|content|post|caption|description)/i,
                /draft (a |an )?(email|newsletter|press release|announcement|speech|proposal|cover letter|bio|article|post)/i,
            ],
            [DOMAINS.CREATIVE_MEDIA]: [
                /generate (a |an )?(image|photo|picture|illustration|artwork|video|animation|music|audio|sound)/i,
                /create (a |an )?(image|photo|picture|illustration|artwork|video|animation|music|audio|sound)/i,
                /make (a |an )?(image|photo|picture|illustration|artwork|video|clip|animation|music|song|track)/i,
                /design (a |an )?(logo|banner|poster|thumbnail|graphic|visual|ui|ux|interface)/i,
                /midjourney|stable diffusion|dall-e|dall.e|sora|runway|suno|udio|elevenlabs/i,
                /text.to.(image|video|audio|music|speech)/i,
                /image.to.(image|video)|video.to.(video|image)/i,
                /prompt (for|to) (midjourney|stable diffusion|dall-e|sora|runway|flux)/i,
                /art (direction|style|concept|generation)/i,
                /visual (design|content|identity|branding|style)/i,
                /(photorealistic|cinematic|artistic|abstract|surreal|minimalist) (style|look|feel|aesthetic)/i,
            ],
            [DOMAINS.ACADEMIC]: [
                /research (paper|topic|methodology|approach)/i,
                /academic (paper|essay|thesis|research)/i,
                /write (a |the )?(thesis|research paper|academic paper|essay)/i,
                /scholarly (article|research|paper|analysis)/i,
                /literature (review|analysis|research)/i,
                /hypothesis|methodology|conclusion|abstract/i,
            ],
                        [DOMAINS.CAREER]: [
                /career (development|growth|planning|advice|change)/i,
                /job (search|interview|application|change)/i,
                /resume|cover letter|interview (preparation|tips|questions)/i,
                /professional (development|growth|skills|advancement)/i,
                /workplace|employment|hiring|recruiter|hire|recruitment/i,
                /leadership|management|team (building|development)/i,
            ]
        };
        
        console.log('[EXT] FixMyPrompt phrasePatterns keys:', Object.keys(phrasePatterns));
        console.log('[EXT] FixMyPrompt DOMAINS.PERSONAL value:', DOMAINS.PERSONAL);
        console.log('[EXT] FixMyPrompt phrasePatterns[DOMAINS.PERSONAL]:', phrasePatterns[DOMAINS.PERSONAL]);
        
        // Domain-specific keywords (for context analysis)
        const domainKeywords = {
            [DOMAINS.TECHNICAL]: [
                'code', 'algorithm', 'debug', 'function', 'api', 'database', 'server', 
                'python', 'javascript', 'sql', 'framework', 'library', 'technical', 'software', 
                'system', 'architecture', 'program', 'compile', 'deploy', 'variable', 'class',
                'method', 'interface', 'protocol', 'optimization', 'performance', 'bug', 'error'
            ],
            [DOMAINS.CREATIVE_WRITING]: [
                'story', 'poem', 'creative writing', 'fiction', 'novel', 'script', 'screenplay',
                'dialogue', 'character', 'scene', 'plot', 'narrative', 'author', 'inspiration',
                'metaphor', 'imagery', 'blog post', 'article', 'essay', 'copywriting', 'ad copy',
                'marketing copy', 'website copy', 'landing page copy', 'sales copy', 'email copy',
                'newsletter', 'product description', 'tagline', 'slogan', 'headline', 'caption',
                'press release', 'speech', 'bio', 'about page', 'white paper', 'case study',
                'content brief', 'editorial', 'listicle', 'how-to guide', 'cold email',
                'email sequence', 'drip campaign', 'brand story', 'founder story', 'mission statement'
            ],
            [DOMAINS.CREATIVE_MEDIA]: [
                'image', 'photo', 'picture', 'illustration', 'artwork', 'render', 'generate',
                'midjourney', 'stable diffusion', 'dall-e', 'sora', 'runway', 'suno', 'udio',
                'logo', 'banner', 'poster', 'thumbnail', 'graphic', 'visual', 'animation',
                'video', 'clip', 'reel', 'cinematic', 'photorealistic', 'artistic', 'aesthetic',
                'music', 'track', 'beat', 'audio', 'sound', 'voice', 'speech synthesis',
                'text to image', 'text to video', 'text to music', 'ai art', 'ai image',
                'style', 'composition', 'lighting', 'color palette', 'mood board'
            ],
            [DOMAINS.BUSINESS]: [
                'business', 'marketing', 'sales', 'strategy', 'roi', 'revenue', 'profit', 
                'customer', 'market', 'growth', 'enterprise', 'startup', 'investment', 
                'commerce', 'trade', 'company', 'entrepreneur', 'success',
                'brand', 'competition', 'partnership', 'acquisition'
            ],
            [DOMAINS.FINANCE]: [
                'billionaire', 'millionaire', 'wealth', 'financial', 'investment', 'money', 'income',
                'earn', 'accumulate', 'portfolio', 'stock', 'crypto', 'trading',
                'passive income', 'financial independence', 'net worth', 'asset', 'capital',
                'dividend', 'return', 'yield', 'rich', 'wealthy'
            ],
            [DOMAINS.ACADEMIC]: [
                'research', 'academic', 'study', 'thesis', 'paper', 'citation', 'scholarly', 
                'theory', 'hypothesis', 'analysis', 'evidence', 'literature', 'journal', 'university', 
                'degree', 'education', 'experiment', 'methodology', 'conclusion', 'abstract'
            ],
            [DOMAINS.CAREER]: [
                'career', 'job', 'resume', 'interview', 'professional', 'skill', 'employment', 
                'promotion', 'management', 'leadership', 'workplace', 'salary', 'hiring', 'recruiter', 
                'position', 'experience', 'qualification', 'networking', 'development'
            ],
            [DOMAINS.PERSONAL]: [
                'personal', 'wellness', 'health', 'fitness', 'meditation', 'mindfulness', 
                'motivation', 'self-improvement', 'life', 'hobby', 'relationship', 'family', 
                'goals', 'growth', 'happiness', 'confidence', 'anxiety', 'stress', 'productivity'
            ]
        };
        
        // Step 1: Check phrase patterns (highest priority - semantic understanding)
        console.log('[EXT] FixMyPrompt DEBUG: Checking phrase patterns...');
        const phraseScores = {};
        for (const [domain, patterns] of Object.entries(phrasePatterns)) {
            console.log(`[EXT] FixMyPrompt Testing domain: ${domain}`);
            const matches = patterns.filter(pattern => {
                const result = pattern.test(prompt);
                console.log(`[EXT] FixMyPrompt   Pattern ${pattern} against "${prompt}": ${result}`);
                return result;
            });
            phraseScores[domain] = matches.length;
            console.log(`[EXT] FixMyPrompt   Domain ${domain} phrase matches: ${matches.length}`);
        }
        console.log('[EXT] FixMyPrompt DEBUG - Phrase scores:', phraseScores);
        console.log('[EXT] FixMyPrompt DEBUG - Phrase scores DETAILED:', JSON.stringify(phraseScores));
        
        // Step 2: Check keywords (secondary - context confirmation)
        console.log('[EXT] FixMyPrompt DEBUG: Checking keywords...');
        const keywordScores = {};
        for (const [domain, keywords] of Object.entries(domainKeywords)) {
            const matches = keywords.filter(keyword => {
                const isMatch = promptLower.includes(keyword);
                if (isMatch) {
                    console.log(`[EXT] FixMyPrompt   ✓ Found keyword "${keyword}" in domain ${domain}`);
                }
                return isMatch;
            });
            keywordScores[domain] = matches.length;
            if (matches.length > 0) {
                console.log(`[EXT] FixMyPrompt   Domain ${domain} keyword matches (${matches.length}): ${matches.join(', ')}`);
            } else {
                console.log(`[EXT] FixMyPrompt   Domain ${domain} keyword matches: 0`);
            }
        }
        // CRITICAL FIX: Ensure all domains are in keywordScores (not just those in domainKeywords)
        for (const domain of Object.keys(DOMAINS)) {
            if (!(domain in keywordScores)) {
                keywordScores[domain] = 0;
                console.log(`[EXT] FixMyPrompt   Domain ${domain} not in domainKeywords, setting score to 0`);
            }
        }
        console.log('[EXT] FixMyPrompt DEBUG - Keyword scores DETAILED:', JSON.stringify(keywordScores));
        console.log('[EXT] FixMyPrompt DEBUG - Keyword scores:', keywordScores);
        console.log('[EXT] FixMyPrompt DEBUG - Keyword scores DETAILED:', JSON.stringify(keywordScores));
        
        // Step 3: Combine scores (phrases have higher weight)
        console.log('[EXT] FixMyPrompt DEBUG: Combining scores...');
        const combinedScores = {};
        // FIX: Use Object.values(DOMAINS) to get lowercase domain names that match phraseScores/keywordScores
        for (const domain of Object.values(DOMAINS)) {
            // Phrase matches weighted 2x, keyword matches weighted 1x
            combinedScores[domain] = (phraseScores[domain] || 0) * 2 + (keywordScores[domain] || 0);
        }
        console.log('[EXT] FixMyPrompt DEBUG - Combined scores:', combinedScores);
        console.log('[EXT] FixMyPrompt DEBUG - Combined scores DETAILED:', JSON.stringify(combinedScores));
        console.log('[EXT] FixMyPrompt DEBUG - DOMAINS keys:', Object.keys(DOMAINS));
        console.log('[EXT] FixMyPrompt DEBUG - DOMAINS.PERSONAL:', DOMAINS.PERSONAL);
        console.log('[EXT] FixMyPrompt DEBUG - combinedScores[DOMAINS.PERSONAL]:', combinedScores[DOMAINS.PERSONAL]);
        
        // Step 4: Find domain with highest score
        console.log('[EXT] FixMyPrompt DEBUG: Finding highest score...');
        let detectedDomain = DOMAINS.GENERAL;
        let maxScore = 0;
        
        for (const [domain, score] of Object.entries(combinedScores)) {
            if (score > maxScore) {
                maxScore = score;
                detectedDomain = domain;
            }
        }
        console.log('[EXT] FixMyPrompt DEBUG - Selected domain:', detectedDomain, 'with maxScore:', maxScore);
        
        // Step 5: Calculate confidence
        // If phrase matched, high confidence; if only keywords, medium confidence
        console.log('[EXT] FixMyPrompt DEBUG: Calculating confidence...');
        let confidence = 0;
        if (phraseScores[detectedDomain] > 0) {
            // Phrase match = 80-100% confidence
            confidence = Math.min(80 + (phraseScores[detectedDomain] * 10), 100);
            console.log('[EXT] FixMyPrompt DEBUG - Phrase match found, confidence:', confidence);
        } else if (keywordScores[detectedDomain] > 0) {
            // Keyword match = 50-80% confidence
            confidence = Math.min(50 + (keywordScores[detectedDomain] * 10), 80);
            console.log('[EXT] FixMyPrompt DEBUG - Keyword match found, confidence:', confidence);
        } else {
            // No match = general domain, 0% confidence
            confidence = 0;
            detectedDomain = DOMAINS.GENERAL;
            console.log('[EXT] FixMyPrompt DEBUG - No match found, defaulting to GENERAL');
        }
        
        console.log(`[EXT] FixMyPrompt ===== FINAL RESULT - Detected domain: ${detectedDomain} (confidence: ${confidence.toFixed(0)}%) =====`);
        
        return detectedDomain;
    }

    /**
     * Get domain-specific instructions for improvement
     */
    getDomainInstructions(domain) {
        const instructions = {
            [DOMAINS.TECHNICAL]: "Focus on clarity, precision, and technical accuracy. Include specific requirements and edge cases.",
            [DOMAINS.CREATIVE_WRITING]: "Enhance creativity, originality, and emotional resonance. Define tone, voice, audience, and content format. Add vivid descriptions and unique perspectives.",
            [DOMAINS.CREATIVE_MEDIA]: "Specify visual style, mood, lighting, composition, color palette, and technical parameters. Include reference artists or styles. Define aspect ratio, resolution, and output format.",
            [DOMAINS.BUSINESS]: "Emphasize business value, ROI, and actionable outcomes. Include metrics and success criteria.",
            [DOMAINS.ACADEMIC]: "Improve academic rigor, citations, and structured argumentation. Add research context.",
            [DOMAINS.CAREER]: "Focus on professional impact, career growth, and relevant skills. Include industry context.",
            [DOMAINS.PERSONAL]: "Emphasize personal growth, wellness, and practical applicability. Add motivational elements.",
            [DOMAINS.GENERAL]: "Improve clarity, structure, and comprehensiveness. Add context and examples."
        };

        return instructions[domain] || instructions[DOMAINS.GENERAL];
    }
}

export const domainDetector = new DomainDetector();
