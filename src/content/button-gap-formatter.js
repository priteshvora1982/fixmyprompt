/**
 * Simple gap formatter for string gaps from mock backend
 */
export function formatStringGapsToSuggestions(gaps) {
    if (!gaps || !Array.isArray(gaps) || gaps.length === 0) {
        return null;
    }

    const severityIcons = ['🔴', '🟠', '🟡', '🟢'];
    const severityLevels = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const severityColors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

    const balloon = gaps.slice(0, 2).map((gap, i) => {
        const icon = severityIcons[i % severityIcons.length];
        const level = severityLevels[i % severityLevels.length];
        return `${icon} ${level}: ${gap}`;
    });

    const modal = gaps.map((gap, i) => {
        const icon = severityIcons[i % severityIcons.length];
        const level = severityLevels[i % severityLevels.length];
        const color = severityColors[i % severityColors.length];
        return `<div class="suggestion-card" style="margin-bottom: 12px; padding: 12px; border-left: 4px solid ${color}; background: #f9fafb; border-radius: 4px;"><div style="font-weight: 600; margin-bottom: 4px;">${icon} ${level}: ${gap}</div></div>`;
    }).join('');

    return { balloon, modal };
}
