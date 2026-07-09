import type { Result } from 'axe-core';

export function formatViolations(violations: Result[]): string {
	if (violations.length === 0) return `no violations`;
	return violations
		.map((v) => `${v.id} (${v.help}): ${v.nodes.map((n) => n.target.join(` `)).join(`, `)}`)
		.join(`\n`);
}
