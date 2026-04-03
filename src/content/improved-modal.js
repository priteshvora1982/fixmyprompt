/**
 * FixMyPrompt - Improved Modal with 4 Tabs
 * Extends original modal with additional improvement modes
 */

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Get domain-specific best practices
 */
function getBestPracticesForDomain(domain) {
    const practices = {
        technical: {
            title: 'Technical Writing Best Practices',
            items: [
                'Be specific about programming language and version',
                'Include error messages or stack traces',
                'Specify expected vs actual behavior',
                'Mention any constraints or limitations'
            ]
        },
        business: {
            title: 'Business Communication Best Practices',
            items: [
                'Start with the main objective',
                'Include relevant metrics or data',
                'Specify audience and context',
                'Define success criteria'
            ]
        },
        creative_writing: {
            title: 'Creative Writing Best Practices',
            items: [
                'Define tone, voice, and style clearly',
                'Specify content type and target platform',
                'Include target audience and their pain points',
                'State the desired call-to-action or outcome',
                'Provide examples or reference styles'
            ]
        },
        creative_media: {
            title: 'Creative Media Best Practices',
            items: [
                'Specify visual style, aesthetic, and mood',
                'Define aspect ratio, resolution, and platform',
                'Describe subject in detail (appearance, pose, environment)',
                'Include lighting, color palette, and composition notes',
                'Add negative prompts to avoid unwanted artifacts'
            ]
        },
        academic: {
            title: 'Academic Writing Best Practices',
            items: [
                'Cite sources and provide context',
                'Define key terms and concepts',
                'Specify academic level (high school, college, etc.)',
                'Include any formatting requirements'
            ]
        },
        career: {
            title: 'Career-Related Best Practices',
            items: [
                'Be specific about role and industry',
                'Include relevant experience level',
                'Specify desired tone (formal, friendly, etc.)',
                'Mention any specific requirements'
            ]
        },
        finance: {
            title: 'Financial Writing Best Practices',
            items: [
                'Include specific numbers and timeframes',
                'Define financial terms and metrics',
                'Specify risk tolerance and goals',
                'Mention any constraints or regulations'
            ]
        }
    };
    
    return practices[domain] || practices.technical;
}

/**
 * Create improved modal with 4 tabs
 */
export function createImprovedModal(data) {
    console.log('[FixMyPrompt] createImprovedModal called with data:', JSON.stringify(data).substring(0, 200));
    let { original, improved, originalScore, improvedScore, changes, gaps, domain, suggestions } = data;
    console.log('[FixMyPrompt] Gaps data:', gaps, 'Length:', gaps ? gaps.length : 0);
    
    // Convert string gaps to gap objects if needed
    if (gaps && gaps.length > 0 && typeof gaps[0] === 'string') {
        console.log('[FixMyPrompt] Converting string gaps to gap objects');
        const severities = ['CRITICAL', 'HIGH', 'MEDIUM'];
        gaps = gaps.map((gapStr, idx) => {
            const parts = gapStr.split('→');
            const title = parts[0].trim();
            const description = parts[1] ? parts[1].trim() : '';
            const severity = severities[idx % severities.length];
            return { title, description, severity };
        });
        console.log('[FixMyPrompt] Converted gaps:', gaps);
    }
    
    const originalCharCount = original.length;
    const improvedCharCount = improved.length;
    const scoreImprovement = improvedScore - originalScore;
    
    // Format scores as integers only
    const displayOriginalScore = Math.round(originalScore);
    const displayImprovedScore = Math.round(improvedScore);
    
    const bestPractices = getBestPracticesForDomain(domain || 'technical');
    
    // Build gaps HTML
    let gapsHtml = '<div style="display: flex; flex-direction: column; gap: 12px;">';
    if (gaps && gaps.length > 0) {
        gaps.forEach(gap => {
            const severityColor = gap.severity === 'CRITICAL' ? '#dc2626' : gap.severity === 'HIGH' ? '#ea580c' : '#eab308';
            const severityBg = gap.severity === 'CRITICAL' ? '#fee2e2' : gap.severity === 'HIGH' ? '#fed7aa' : '#fef3c7';
            const severityIcon = gap.severity === 'CRITICAL' ? '🔴' : gap.severity === 'HIGH' ? '🟠' : '🟡';
            gapsHtml += `
                <div style="padding: 12px; background: ${severityBg}; border-radius: 8px; border-left: 4px solid ${severityColor};">
                    <div style="display: flex; align-items: flex-start; gap: 8px;">
                        <input type="checkbox" style="margin-top: 2px; cursor: pointer; width: 16px; height: 16px;">
                        <div>
                            <div style="font-weight: 600; font-size: 13px; color: #1f2937; margin-bottom: 4px;">${severityIcon} ${gap.severity}: ${escapeHtml(gap.title || gap.gap || 'Gap')}</div>
                            <div style="font-size: 12px; color: #6b7280; line-height: 1.4;">${escapeHtml(gap.description || gap.reason || '')}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    } else {
        gapsHtml += '<div style="color: #9ca3af; font-size: 13px; text-align: center; padding: 20px;">No gaps identified</div>';
    }
    gapsHtml += '</div>';
    
    // Build practices HTML
    let practicesHtml = `
        <div style="padding: 0;">
            <div style="font-size: 13px; font-weight: 700; color: #1f2937; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">${bestPractices.title}</div>
            <ul style="margin: 0; padding-left: 0; list-style: none; display: flex; flex-direction: column; gap: 10px;">
                ${bestPractices.items.map(item => `
                    <li style="
                        font-size: 13px;
                        color: #374151;
                        padding: 10px;
                        background: #f3f4f6;
                        border-radius: 6px;
                        border-left: 3px solid #667eea;
                    ">✓ ${escapeHtml(item)}</li>
                `).join('')}
            </ul>
        </div>
    `;
    
    const html = `
        <div id="fixmyprompt-modal" style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 999999;
            animation: fadeIn 0.3s ease;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        ">
            <div style="
                background: white;
                border-radius: 16px;
                max-width: 700px;
                max-height: 85vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                display: flex;
                flex-direction: column;
            ">
                <!-- Header -->
                <div style="
                    padding: 24px;
                    border-bottom: 1px solid #e5e7eb;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    border-radius: 16px 16px 0 0;
                    color: white;
                ">
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 16px;
                    ">
                        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                            <button class="fixmyprompt-tab-btn" data-tab="0" style="
                                background: white;
                                color: #667eea;
                                border: none;
                                padding: 8px 14px;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s;
                            ">✨ Quick Improve</button>
                            <button class="fixmyprompt-tab-btn" data-tab="1" style="
                                background: rgba(255, 255, 255, 0.2);
                                color: white;
                                border: none;
                                padding: 8px 14px;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s;
                            ">🔧 Refine</button>
                            <button class="fixmyprompt-tab-btn" data-tab="2" style="
                                background: rgba(255, 255, 255, 0.2);
                                color: white;
                                border: none;
                                padding: 8px 14px;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s;
                            ">🎯 Manual</button>
                            <button class="fixmyprompt-tab-btn" data-tab="3" style="
                                background: rgba(255, 255, 255, 0.2);
                                color: white;
                                border: none;
                                padding: 8px 14px;
                                border-radius: 6px;
                                font-weight: 600;
                                cursor: pointer;
                                font-size: 13px;
                                transition: all 0.2s;
                            ">📚 Learn</button>
                        </div>
                        <button class="fixmyprompt-close-btn" style="
                            background: rgba(255, 255, 255, 0.2);
                            border: none;
                            color: white;
                            font-size: 28px;
                            cursor: pointer;
                            padding: 0;
                            width: 40px;
                            height: 40px;
                            border-radius: 8px;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            transition: background 0.2s;
                        " title="Close">×</button>
                    </div>
                    
                    <!-- Score Cards -->
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 16px;
                    ">
                        <!-- Before Score -->
                        <div style="
                            background: rgba(255, 255, 255, 0.15);
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(255, 255, 255, 0.2);
                        ">
                            <div style="
                                font-size: 11px;
                                font-weight: 600;
                                opacity: 0.9;
                                margin-bottom: 4px;
                                text-transform: uppercase;
                            ">Original Score</div>
                            <div style="
                                font-size: 28px;
                                font-weight: 700;
                            ">${displayOriginalScore}</div>
                        </div>
                        
                        <!-- After Score -->
                        <div style="
                            background: rgba(255, 255, 255, 0.25);
                            padding: 12px;
                            border-radius: 8px;
                            border: 1px solid rgba(255, 255, 255, 0.3);
                        ">
                            <div style="
                                font-size: 11px;
                                font-weight: 600;
                                opacity: 0.9;
                                margin-bottom: 4px;
                                text-transform: uppercase;
                            ">Improved Score</div>
                            <div style="
                                font-size: 28px;
                                font-weight: 700;
                            ">${displayImprovedScore} <span style="font-size: 16px; margin-left: 8px;">+${Math.round(scoreImprovement)}</span></div>
                        </div>
                    </div>
                </div>
                
                <!-- Body -->
                <div style="
                    padding: 24px;
                    flex: 1;
                    overflow-y: auto;
                ">
                    <!-- TAB 0: Quick Improve -->
                    <div class="fixmyprompt-tab-content" data-tab="0" style="display: block;">
                        <!-- Original Prompt -->
                        <div style="margin-bottom: 24px; background: #f3f4f6; padding: 16px; border-radius: 12px; border: 2px solid #e5e7eb;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <label style="font-size: 13px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px;">Original Prompt</label>
                                <span style="font-size: 11px; color: #6b7280; font-weight: 600;">${originalCharCount} characters</span>
                            </div>
                            <div style="background: white; padding: 12px; border-radius: 8px; border: 1px solid #d1d5db; font-size: 13px; line-height: 1.6; color: #374151; max-height: 120px; overflow-y: auto;">${escapeHtml(original)}</div>
                        </div>
                        
                        <!-- Improved Prompt -->
                        <div style="margin-bottom: 24px; background: #f0fdf4; padding: 16px; border-radius: 12px; border: 2px solid #dcfce7;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                                <label style="font-size: 13px; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.5px;">Improved Prompt</label>
                                <span style="font-size: 11px; color: #16a34a; font-weight: 600;">${improvedCharCount} characters</span>
                            </div>
                            <textarea class="fixmyprompt-improved-text" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #10b981; font-size: 13px; line-height: 1.6; color: #1f2937; background: white; font-family: inherit; resize: vertical; min-height: 200px; max-height: 300px;">${escapeHtml(improved)}</textarea>
                        </div>
                        
                        <!-- What Changed -->
                        <div style="margin-bottom: 20px;">
                            <label style="font-size: 13px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; display: block;">What Changed & Why</label>
                            <div style="display: flex; flex-direction: column; gap: 8px;">
                                ${changes && changes.length > 0 ? changes.map(change => `
                                    <div style="padding: 12px; background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); border-radius: 8px; border-left: 4px solid #667eea;">
                                        <div style="font-weight: 600; font-size: 13px; color: #1f2937; margin-bottom: 4px;">${escapeHtml(change)}</div>
                                    </div>
                                `).join('') : '<div style="color: #9ca3af; font-size: 13px;">No changes identified</div>'}
                            </div>
                        </div>
                        
                        <!-- See Likely Outcomes Button -->
                        <div style="margin-bottom: 20px;">
                            <button class="fixmyprompt-outcomes-btn" style="width: 100%; padding: 12px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;">👁 See Likely Outcomes</button>
                        </div>
                    </div>
                    
                    <!-- TAB 1: Refine (MCQ) - Will be populated by modal.js -->
                    <div class="fixmyprompt-tab-content fixmyprompt-refine-content" data-tab="1" style="display: none;">
                        <div style="text-align: center; padding: 20px; color: #9ca3af;">Loading refinement questions...</div>
                    </div>
                    
                    <!-- TAB 2: Manual (Gap Selection) -->
                    <div class="fixmyprompt-tab-content" data-tab="2" style="display: none;">
                        <div style="margin-bottom: 20px;">
                            <label style="font-size: 13px; font-weight: 700; color: #1f2937; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px; display: block;">Identified Gaps</label>
                            ${gapsHtml}
                            <button class="fixmyprompt-apply-gaps-btn" style="width: 100%; padding: 12px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; margin-top: 20px;">Apply Selected</button>
                        </div>
                    </div>
                    
                    <!-- TAB 3: Learn (Best Practices) -->
                    <div class="fixmyprompt-tab-content" data-tab="3" style="display: none;">
                        ${practicesHtml}
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="
                    padding: 16px 24px;
                    border-top: 1px solid #e5e7eb;
                    background: #f9fafb;
                    border-radius: 0 0 16px 16px;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                ">
                    <button class="fixmyprompt-reject-btn" style="
                        padding: 10px 16px;
                        background: white;
                        color: #6b7280;
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">Reject</button>
                    <button class="fixmyprompt-accept-btn" style="
                        padding: 10px 16px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">Accept & Use</button>
                </div>
            </div>
        </div>
    `;
    
    return {
        html,
        improved,
        data
    };
}
