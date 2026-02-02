// Markdown formatting utilities

export function createFrontmatter(data: Record<string, string | number | boolean | string[]>): string {
	const lines = ['---'];
	for (const [key, value] of Object.entries(data)) {
		if (Array.isArray(value)) {
			const joined = value.join(', ');
			lines.push(`${key}: [${joined}]`);
		} else if (typeof value === 'string') {
			const escapedValue = value.replace(/"/g, '\\"');
			lines.push(`${key}: "${escapedValue}"`);
		} else {
			lines.push(`${key}: ${value}`);
		}
	}
	lines.push('---');
	return lines.join('\n');
}

export function formatActionItems(items: Array<{ text: string; assignee?: string }>): string {
	return items.map(item => {
		const assignee = item.assignee ? ` (@${item.assignee})` : '';
		return `- [ ] ${item.text}${assignee}`;
	}).join('\n');
}

// TODO: Add more markdown formatting utilities
