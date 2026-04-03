const enhancedGapPatterns = {
  general: [
    {
      id: "GEN_CONTEXT",
      severity: "critical",
      gap: "Missing Context",
      description: "The AI doesn't know the background or the 'why' behind your request.",
      suggestion: "Add a sentence or two of background. For example, 'I'm a software engineer building a new feature...' or 'I'm a student writing an essay on...'",
      impact: "Without context, the AI will make assumptions that are likely wrong, leading to irrelevant or generic responses.",
      regex: /context|background|situation|scenario|information|problem|goal|objective|purpose|intent|aim|task/i
    },
    {
      id: "GEN_INSTRUCTION",
      severity: "critical",
      gap: "Unclear Instructions",
      description: "The AI doesn't have a clear, step-by-step command to follow.",
      suggestion: "Start your prompt with a clear command. For example, 'Write a Python function that...', 'Summarize the following text...', or 'Generate 5 creative ideas for...'",
      impact: "Vague instructions lead to vague, unhelpful, and often rambling answers.",
      regex: /write|summarize|generate|create|explain|analyze|compare|contrast|list|define|translate|rewrite|debug/i
    },
    {
      id: "GEN_EXAMPLE",
      severity: "high",
      gap: "Missing Example",
      description: "The AI has no reference for the style, format, or type of output you want.",
      suggestion: "Provide a small example of what you're looking for. For instance, '...similar to this: [example]' or 'Here is a sample input and desired output.'",
      impact: "The AI's output may not match your expectations in tone, style, or structure.",
      regex: /example|sample|instance|case|scenario|like this|such as|for instance|e\.g\./i
    },
    {
      id: "GEN_OUTPUT_FORMAT",
      severity: "high",
      gap: "Missing Output Format",
      description: "You haven't specified how the AI should structure its response.",
      suggestion: "Tell the AI exactly how to format the output. For example, 'Return the answer in JSON format', 'Use markdown tables', or 'Provide a bulleted list.'",
      impact: "You'll have to waste time reformatting the AI's response to fit your needs.",
      regex: /format|structure|layout|output|return as|in a table|json|markdown|bullet points|numbered list/i
    },
    {
      id: "GEN_ROLE",
      severity: "medium",
      gap: "Missing Persona",
      description: "The AI is responding as a generic assistant.",
      suggestion: "Assign a role to the AI. For example, 'Act as a senior software developer...' or 'You are a marketing expert...'",
      impact: "The response will lack the specific expertise and perspective that a defined persona can provide.",
      regex: /act as|you are a|be a|persona|role/i
    },
    {
      id: "GEN_CONSTRAINTS",
      severity: "medium",
      gap: "Missing Constraints",
      description: "The AI doesn't know the boundaries for its response, like length or scope.",
      suggestion: "Set clear limits. For example, 'Keep the response under 200 words', 'Focus only on the main points', or 'Do not include any code.'",
      impact: "The AI might give you a response that is too long, too short, or goes off-topic.",
      regex: /constraint|limit|scope|length|words|characters|under|less than|more than|between|max|min/i
    }
  ]
};

enhancedGapPatterns.technical = [
  {
    id: "TECH_LANGUAGE",
    severity: "critical",
    gap: "Missing Programming Language",
    description: "You haven't specified the programming language, so the AI might guess wrong.",
    suggestion: "Clearly state the language you are working with, e.g., 'in Python', 'for JavaScript', or 'using C++'.",
    impact: "The AI could provide a perfect solution in the completely wrong language, wasting your time.",
    regex: /python|javascript|java|c\+\+|rust|go|ruby|php|swift|kotlin|typescript|c#|scala|haskell|perl|lua|r\b/i
  },
  {
    id: "TECH_ERROR_CONTEXT",
    severity: "critical",
    gap: "Missing Error Context",
    description: "Without the full error message and stack trace, the AI can only guess at the problem.",
    suggestion: "Paste the complete, unedited error message and stack trace into the prompt.",
    impact: "The AI will likely give you generic debugging steps instead of a specific solution to your actual problem.",
    regex: /error|exception|stack trace|debug|traceback|crash|fail|issue|bug/i
  },
  {
    id: "TECH_CODE_EXAMPLE",
    severity: "high",
    gap: "Missing Code Example",
    description: "The AI cannot see your code, making it hard to provide a relevant and accurate fix.",
    suggestion: "Include a minimal, reproducible example of your code that demonstrates the problem.",
    impact: "The suggested fix may not work with your codebase or could introduce new bugs.",
    regex: /code|snippet|function|class|component|module|file/i
  },
  {
    id: "TECH_VERSION",
    severity: "medium",
    gap: "Missing Version Information",
    description: "The AI doesn't know which version of the language, framework, or library you are using.",
    suggestion: "Specify the versions, e.g., 'I'm using React 18' or 'This is on Node.js v20.x'.",
    impact: "The solution might use deprecated functions or features that are not available in your version.",
    regex: /version|framework|library|package|npm|pip|maven|gradle|cargo|gem|react|angular|vue|django|flask|express/i
  },
  {
    id: "TECH_ENVIRONMENT",
    severity: "low",
    gap: "Missing Environment Details",
    description: "The AI doesn't know your operating system or environment, which can be crucial for some problems.",
    suggestion: "Mention your OS and any relevant environment details, e.g., 'I'm on Windows 11 using WSL2' or 'This is running inside a Docker container'.",
    impact: "The advice might not be applicable to your specific setup (e.g., file paths, environment variables).",
    regex: /environment|os|operating system|linux|windows|mac|docker|container|wsl/i
  }
];

enhancedGapPatterns.business = [
  {
    id: "BIZ_OBJECTIVE",
    severity: "critical",
    gap: "Missing Business Objective",
    description: "The AI doesn't know what you are trying to achieve with this task.",
    suggestion: "State your primary goal clearly. For example, 'My objective is to increase user engagement by 15%.' or 'I need to reduce customer churn.'",
    impact: "The AI's suggestions will be generic and not tailored to your specific business needs, potentially leading you in the wrong direction.",
    regex: /objective|goal|outcome|result|target|aim|purpose|kpi|metric/i
  },
  {
    id: "BIZ_AUDIENCE",
    severity: "high",
    gap: "Missing Target Audience",
    description: "You haven't specified who this is for (e.g., customers, executives, a technical team).",
    suggestion: "Define your audience. For example, 'This is for a presentation to non-technical stakeholders.' or 'The target audience is new users of our app.'",
    impact: "The tone, language, and level of detail in the response may be completely inappropriate for your intended audience.",
    regex: /audience|stakeholder|customer|user|client|team|department|reader|viewer/i
  },
  {
    id: "BIZ_CONTEXT",
    severity: "high",
    gap: "Missing Business Context",
    description: "The AI lacks background information about your company, product, or market.",
    suggestion: "Provide a brief overview. For example, 'We are a B2B SaaS company in the healthcare sector.' or 'Our main competitor just launched a similar feature.'",
    impact: "The AI's advice will be too generic to be useful and won't consider your unique competitive landscape or position.",
    regex: /background|context|situation|scenario|problem|challenge|company|product|market|industry/i
  },
  {
    id: "BIZ_CONSTRAINTS",
    severity: "medium",
    gap: "Missing Constraints",
    description: "The AI is not aware of your limitations, such as budget, timeline, or available resources.",
    suggestion: "List your key constraints. For example, 'We have a budget of $5,000' or 'This needs to be completed by the end of the week.'",
    impact: "The AI might suggest a great plan that is completely unfeasible for you to implement.",
    regex: /budget|timeline|deadline|constraint|requirement|scope|limitation|resource/i
  }
];

enhancedGapPatterns.creative_writing = [
  {
    id: "CREA_TONE_STYLE",
    severity: "critical",
    gap: "Missing Tone and Style",
    description: "The AI doesn't know the desired feeling, mood, or voice for the content.",
    suggestion: "Specify the tone and style. For example, 'Write in a witty and informal tone, similar to a stand-up comedian.' or 'The style should be professional and academic.'",
    impact: "The generated content will likely have a generic, bland tone that doesn't match your brand or engage your audience.",
    regex: /tone|style|voice|mood|feeling|emotion|atmosphere|vibe/i
  },
  {
    id: "CREA_FORMAT_LENGTH",
    severity: "high",
    gap: "Missing Format or Length",
    description: "You haven't specified the structure or length of the desired output.",
    suggestion: "Define the format and length. For example, 'Write a 300-word blog post with an introduction, three main points, and a conclusion.' or 'Generate a short poem with three stanzas.'",
    impact: "The AI might produce something that is too long, too short, or in a completely different format than you need.",
    regex: /format|length|structure|genre|type|category|medium|words|characters|pages|paragraphs|stanzas/i
  },
  {
    id: "CREA_AUDIENCE",
    severity: "high",
    gap: "Missing Target Audience",
    description: "The AI doesn't know who the creative piece is for.",
    suggestion: "Describe your target audience. For example, 'This is for young adults who are interested in science fiction.' or 'The audience is children aged 5-7.'",
    impact: "The language, themes, and complexity of the content may not be appropriate or engaging for your intended audience.",
    regex: /audience|reader|viewer|listener|target|age|demographic/i
  },
  {
    id: "CREA_EXAMPLE_INSPIRATION",
    severity: "medium",
    gap: "Missing Examples or Inspiration",
    description: "The AI has no reference point for the kind of creative work you're looking for.",
    suggestion: "Provide examples of work you like. For example, 'Write a story in the style of Neil Gaiman.' or 'Here is a painting I want you to describe.'",
    impact: "The output may be clichéd or unoriginal without specific creative influences to guide it.",
    regex: /example|reference|inspiration|similar to|like|in the style of/i
  }
];

enhancedGapPatterns.academic = [
  {
    id: "ACAD_RESEARCH_QUESTION",
    severity: "critical",
    gap: "Missing Research Question or Thesis",
    description: "The AI doesn't have a clear, focused research question or thesis statement to address.",
    suggestion: "State your research question or thesis at the beginning of your prompt. For example, 'My research question is: To what extent does... '",
    impact: "The response will lack academic focus and may not directly address the core of your research.",
    regex: /research question|thesis|hypothesis|argument|claim|topic/i
  },
  {
    id: "ACAD_SCOPE_LIMITATIONS",
    severity: "high",
    gap: "Missing Scope or Limitations",
    description: "You haven't defined the boundaries of your inquiry.",
    suggestion: "Specify the scope. For example, 'This analysis is limited to the period 2000-2010.' or 'Focus only on the economic impacts.'",
    impact: "The AI may provide information that is too broad or irrelevant to your specific area of study.",
    regex: /scope|limitation|boundary|constraint|assumption|focus on/i
  },
  {
    id: "ACAD_METHODOLOGY",
    severity: "high",
    gap: "Missing Methodology Details",
    description: "The AI doesn't know the research methods or analytical framework to use.",
    suggestion: "Describe your methodology. For example, 'Use a qualitative content analysis approach.' or 'Analyze this from a Marxist perspective.'",
    impact: "The AI's analysis will be generic and not grounded in a specific academic discipline or framework.",
    regex: /methodology|method|approach|framework|analysis|data|theory|perspective/i
  },
  {
    id: "ACAD_CITATION_STYLE",
    severity: "medium",
    gap: "Missing Citation Style",
    description: "You haven't specified the required citation format (e.g., APA, MLA).",
    suggestion: "State the required citation style, e.g., 'Please use APA 7th edition for all citations.'",
    impact: "You will have to manually reformat all the citations, which is time-consuming and error-prone.",
    regex: /citation|reference|source|apa|mla|chicago|harvard|style/i
  }
];

enhancedGapPatterns.creative_media = [
  {
    id: "MEDIA_STYLE",
    severity: "critical",
    gap: "Missing Visual Style or Aesthetic",
    description: "The AI generation tool doesn't know the visual style, mood, or aesthetic you want.",
    suggestion: "Specify the style clearly. For example, 'photorealistic, cinematic lighting, 8K resolution' or 'watercolor illustration, soft pastel palette, dreamy atmosphere' or 'in the style of [artist name]'.",
    impact: "Without a defined style, the output will be generic and unlikely to match your creative vision.",
    regex: /style|aesthetic|mood|tone|feel|look|vibe|atmosphere|photorealistic|cinematic|artistic|illustration/i
  },
  {
    id: "MEDIA_SUBJECT",
    severity: "critical",
    gap: "Vague Subject Description",
    description: "The subject of your image, video, or audio is not described in enough detail.",
    suggestion: "Describe the subject with specifics: age, appearance, clothing, expression, pose, environment. For example, 'a young woman in her 30s, wearing a red coat, standing in a rainy Tokyo street at night, looking thoughtful'.",
    impact: "Vague subjects produce generic, off-target outputs that require many regeneration attempts.",
    regex: /person|character|subject|object|scene|environment|background|setting|location/i
  },
  {
    id: "MEDIA_TECHNICAL_PARAMS",
    severity: "high",
    gap: "Missing Technical Parameters",
    description: "You haven't specified technical details like aspect ratio, resolution, or model-specific parameters.",
    suggestion: "Add technical specs: '--ar 16:9' for widescreen, '--v 6' for Midjourney version, 'steps: 30, cfg: 7' for Stable Diffusion, or 'duration: 8 seconds' for video generation.",
    impact: "Without these parameters, the output format may not match your intended use case (e.g., social media, print, web).",
    regex: /aspect ratio|resolution|size|format|ar|steps|cfg|version|quality|hd|4k|8k/i
  },
  {
    id: "MEDIA_COMPOSITION",
    severity: "high",
    gap: "Missing Composition and Framing",
    description: "The AI doesn't know how you want the scene framed or composed.",
    suggestion: "Specify composition: 'close-up portrait', 'wide establishing shot', 'bird's eye view', 'rule of thirds', 'centered symmetrical composition', 'bokeh background'.",
    impact: "Poor composition is one of the most common reasons AI-generated images don't look professional.",
    regex: /composition|framing|shot|angle|perspective|close-up|wide|portrait|landscape|view/i
  },
  {
    id: "MEDIA_LIGHTING",
    severity: "medium",
    gap: "Missing Lighting Description",
    description: "Lighting dramatically affects the mood and quality of generated visuals.",
    suggestion: "Describe the lighting: 'golden hour sunlight', 'dramatic side lighting', 'soft diffused studio light', 'neon-lit night scene', 'candlelit warm glow'.",
    impact: "Without lighting direction, the AI defaults to flat, uninspiring illumination.",
    regex: /lighting|light|shadow|illumination|glow|bright|dark|contrast|exposure/i
  },
  {
    id: "MEDIA_NEGATIVE_PROMPT",
    severity: "medium",
    gap: "Missing Negative Prompt",
    description: "You haven't specified what to avoid in the output.",
    suggestion: "Add a negative prompt: 'avoid: blurry, distorted hands, extra limbs, watermark, text, low quality, oversaturated'.",
    impact: "Without negative prompts, common AI artifacts (distorted faces, extra fingers, blurry backgrounds) are more likely to appear.",
    regex: /avoid|exclude|no |without|negative|unwanted/i
  }
];

enhancedGapPatterns.career = [
  {
    id: "CAREER_ROLE_CONTEXT",
    severity: "critical",
    gap: "Missing Role or Position Context",
    description: "The AI doesn't know your current role, industry, or experience level.",
    suggestion: "Provide your professional context. For example, 'I am a junior software developer with 2 years of experience.' or 'I am a marketing manager in the tech industry.'",
    impact: "The advice will be generic and may not be applicable to your specific career stage or field.",
    regex: /role|position|job|title|career|profession|industry|field|experience|level/i
  },
  {
    id: "CAREER_GOAL",
    severity: "high",
    gap: "Missing Career Goal",
    description: "You haven't specified what you want to achieve in your career.",
    suggestion: "State your career goal. For example, 'I want to get promoted to a senior role.' or 'I am looking to transition into a product management role.'",
    impact: "The AI's suggestions won't be targeted towards your specific aspirations.",
    regex: /goal|objective|outcome|result|target|aim|aspiration|next step/i
  },
  {
    id: "CAREER_SITUATION",
    severity: "high",
    gap: "Missing Situation Context",
    description: "The AI doesn't understand the specific situation or challenge you are facing.",
    suggestion: "Describe the situation in detail. For example, 'I have a difficult coworker who is impacting my work.' or 'I am preparing for a performance review.'",
    impact: "The AI will provide generic advice that doesn't take into account the nuances of your situation.",
    regex: /challenge|problem|situation|scenario|context|background|issue/i
  },
  {
    id: "CAREER_COMPANY_CONTEXT",
    severity: "medium",
    gap: "Missing Company or Industry Context",
    description: "The AI doesn't know anything about your company or the industry you work in.",
    suggestion: "Provide some context about your company. For example, 'I work at a large tech company with a very structured environment.' or 'I am at a fast-paced startup.'",
    impact: "The advice may not be appropriate for your company's culture or the norms of your industry.",
    regex: /company|organization|industry|sector|field|domain|culture/i
  }
];


export { enhancedGapPatterns };
