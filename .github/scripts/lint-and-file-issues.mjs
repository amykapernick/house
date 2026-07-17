// Runs ESLint and stylelint (the full stylelint.config.cjs, same scope as
// `lint:styles`) with --fix in-memory, then opens one GitHub issue per rule
// that has errors surviving the fix (warnings are left alone), listing every
// current file:line for that rule. Auto-fixable style issues never reach
// here - only violations that need a human. Existing open issues are
// matched via a hidden marker in the body so re-runs update them in place
// instead of duplicating.
//
// Only meant to run on direct pushes to prod/dev - PRs already get fast-fail
// feedback from the plain `lint:ci` step and shouldn't spawn permanent issues
// for in-progress work.
//
// stylelint findings are reported and filed as issues but never fail this
// step / block deploy - most of the full config's non-auto-fixable rules
// (selector-nested-pattern, house/no-repeated-value, ...) flag pre-existing
// debt or judgment calls rather than a broken change, and there's a real
// backlog of them right now. ESLint errors are the only hard gate.
import { ESLint } from 'eslint';
import stylelint from 'stylelint';

const token = process.env.GITHUB_TOKEN;
const repoSlug = process.env.GITHUB_REPOSITORY;
const runId = process.env.GITHUB_RUN_ID;
const serverUrl = process.env.GITHUB_SERVER_URL ?? `https://github.com`;

const eslint = new ESLint({
	fix: true,
	overrideConfigFile: `./config/eslint.config.mjs`,
});

const eslintResults = await eslint.lintFiles([`.`]);
await ESLint.outputFixes(eslintResults);

const eslintFormatter = await eslint.loadFormatter(`stylish`);
console.log(await eslintFormatter.format(eslintResults));

const { results: stylelintResults, output: stylelintOutput } = await stylelint.lint({
	files: [`src/**/*.{css,svelte}`],
	configFile: `./config/stylelint.config.cjs`,
	fix: true,
	formatter: `string`,
});

console.log(stylelintOutput);

async function ghFetch(path, options = {}) {
	const res = await fetch(`https://api.github.com${path}`, {
		...options,
		headers: {
			'Authorization': `Bearer ${token}`,
			'Accept': `application/vnd.github+json`,
			'Content-Type': `application/json`,
			...options.headers,
		},
	});
	if (!res.ok && res.status !== 422) {
		throw new Error(`GitHub API ${path} failed: ${res.status} ${await res.text()}`);
	}
	return res.status === 204 ? null : res.json();
}

async function ensureLabelExists(owner, repo) {
	await ghFetch(`/repos/${owner}/${repo}/labels`, {
		method: `POST`,
		body: JSON.stringify({
			name: `lint`,
			color: `d93f0b`,
			description: `ESLint/stylelint error not resolved by --fix`,
		}),
	});
}

async function findExistingIssue(owner, repo, marker) {
	const q = encodeURIComponent(`repo:${owner}/${repo} is:issue is:open "${marker}" in:body`);
	const result = await ghFetch(`/search/issues?q=${q}`);
	return result?.items?.[0] ?? null;
}

// One issue per *rule* (from either linter), not per occurrence - filing one
// issue per hit would be dozens of duplicates for the same underlying
// cleanup. The body lists every current file:line for that rule, grouped by
// file. Re-runs update the existing issue's body in place (rather than
// skip) so the file list doesn't go stale as the backlog is worked down or
// grows.
function formatRuleIssueBody(ruleId, occurrencesByFile) {
	return [...occurrencesByFile.entries()]
		.map(([filePath, occurrences]) => {
			const lines = occurrences.map((o) => `  ${o.line}:${o.column}  ✖  ${o.text}  ${ruleId}`).join(`\n`);
			return `${filePath}\n${lines}`;
		})
		.join(`\n\n`);
}

async function createOrUpdateIssueForRule(owner, repo, source, ruleId, occurrencesByFile, runUrl) {
	const marker = `<!-- lint-issue-id: ${source}-rule:${ruleId} -->`;
	const body = [
		`\`\`\``,
		formatRuleIssueBody(ruleId, occurrencesByFile),
		`\`\`\``,
		``,
		runUrl ? `Found in [this run](${runUrl}).` : ``,
		``,
		marker,
	].filter(Boolean).join(`\n`);

	const existing = await findExistingIssue(owner, repo, marker);
	if (existing) {
		await ghFetch(`/repos/${owner}/${repo}/issues/${existing.number}`, {
			method: `PATCH`,
			body: JSON.stringify({ body }),
		});
		console.log(`Updated issue #${existing.number}: ${ruleId}`);
		return;
	}

	const created = await ghFetch(`/repos/${owner}/${repo}/issues`, {
		method: `POST`,
		body: JSON.stringify({ title: ruleId, body, labels: [`lint`] }),
	});
	console.log(`Created issue #${created.number}: ${ruleId}`);
}

const cwd = process.cwd();
const relativePath = (filePath) => (filePath.startsWith(cwd) ? filePath.slice(cwd.length + 1) : filePath);

// ruleId -> filePath -> { line, column, text }[]
const groupByRule = (entries) => {
	const byRule = new Map();
	for (const { filePath, ruleId, line, column, text } of entries) {
		if (!byRule.has(ruleId)) byRule.set(ruleId, new Map());
		const byFile = byRule.get(ruleId);
		if (!byFile.has(filePath)) byFile.set(filePath, []);
		byFile.get(filePath).push({ line, column, text });
	}
	return byRule;
};

const eslintErrorCount = eslintResults.reduce((total, result) => total + result.messages.filter((message) => message.severity === 2).length, 0);
const stylelintErrorCount = stylelintResults.reduce((total, result) => total + result.warnings.filter((warning) => warning.severity === `error`).length, 0);
const errorCount = eslintErrorCount + stylelintErrorCount;
const blockingErrorCount = eslintErrorCount;

const eslintByRule = groupByRule(
	eslintResults.flatMap((result) =>
		result.messages
			.filter((message) => message.severity === 2)
			.map((message) => ({ filePath: relativePath(result.filePath), ruleId: message.ruleId ?? `error`, line: message.line, column: message.column, text: message.message }))
	)
);
const stylelintByRule = groupByRule(
	stylelintResults.flatMap((result) =>
		result.warnings
			.filter((warning) => warning.severity === `error`)
			.map((warning) => ({ filePath: relativePath(result.source), ruleId: warning.rule, line: warning.line, column: warning.column, text: warning.text }))
	)
);

if (token && repoSlug) {
	const [owner, repo] = repoSlug.split(`/`);
	const runUrl = runId ? `${serverUrl}/${repoSlug}/actions/runs/${runId}` : undefined;

	await ensureLabelExists(owner, repo);

	for (const [ruleId, occurrencesByFile] of eslintByRule) {
		await createOrUpdateIssueForRule(owner, repo, `eslint`, ruleId, occurrencesByFile, runUrl);
	}

	for (const [ruleId, occurrencesByFile] of stylelintByRule) {
		await createOrUpdateIssueForRule(owner, repo, `stylelint`, ruleId, occurrencesByFile, runUrl);
	}
}
else {
	console.log(`GITHUB_TOKEN/GITHUB_REPOSITORY not set - skipping issue creation (local run?)`);
}

if (errorCount > blockingErrorCount) {
	console.log(`${errorCount - blockingErrorCount} non-blocking lint error(s) filed as issues but not blocking deploy.`);
}

if (blockingErrorCount > 0) {
	console.error(`${blockingErrorCount} lint error(s) remain after auto-fix.`);
	process.exit(1);
}
