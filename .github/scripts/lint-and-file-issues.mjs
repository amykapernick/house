// Runs ESLint and stylelint (the full stylelint.config.cjs, same scope as
// `lint:styles`) with --fix in-memory, then opens one GitHub issue per rule
// that has errors surviving the fix (warnings are left alone), listing every
// current file:line for that rule. Auto-fixable style issues never reach
// here - only violations that need a human. Existing open issues are
// matched via a hidden marker in the body so re-runs update them in place
// instead of duplicating. Issues whose rule/file no longer has any
// violations get closed (with a comment) rather than left open forever.
//
// Only meant to run on direct pushes to prod/dev - PRs already get fast-fail
// feedback from the plain `lint:ci` step and shouldn't spawn permanent issues
// for in-progress work.
//
// stylelint findings are reported and filed as issues but mostly don't fail
// this step / block deploy - most of the full config's non-auto-fixable
// rules (selector-nested-pattern, house/no-repeated-value, ...) flag
// pre-existing debt or judgment calls rather than a broken change. ESLint
// errors are a hard gate, and so is stylelint's declaration-no-important -
// there's no legitimate use of !important in this codebase.
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

async function listOpenLintIssues(owner, repo) {
	const issues = [];
	for (let page = 1; ; page += 1) {
		const batch = await ghFetch(`/repos/${owner}/${repo}/issues?labels=lint&state=open&per_page=100&page=${page}`);
		if (!batch?.length) break;
		issues.push(...batch.filter((issue) => !issue.pull_request));
		if (batch.length < 100) break;
	}
	return issues;
}

// Handles both issue shapes: the current per-rule format this script writes
// (title is the bare ruleId, marker is "{source}-rule:{ruleId}") and the
// older per-occurrence format some still-open issues predate this script
// version with (title "Lint: {ruleId} in {filePath}:{line}", marker
// "{filePath}:{line}:{col}:{ruleId}"). filePath is null for the per-rule
// shape, since that issue covers every file for the rule at once.
function parseLintIssue(issue) {
	const oldTitleMatch = issue.title.match(/^Lint: (.+) in (.+):\d+$/);
	if (oldTitleMatch) return { ruleId: oldTitleMatch[1], filePath: oldTitleMatch[2] };

	const markerMatch = issue.body?.match(/<!-- lint-issue-id: (?:eslint|stylelint)-rule:(.+) -->/);
	return markerMatch ? { ruleId: markerMatch[1], filePath: null } : null;
}

// Re-runs only ever create or update issues for rules that currently have
// violations - nothing ever closed an issue once its rule/file combo was
// cleaned up, so fixed issues sat open forever. This closes any open `lint`
// issue whose rule (and, for the older per-occurrence shape, file) no longer
// shows up in this run's results.
async function closeResolvedIssues(owner, repo, runUrl) {
	const openIssues = await listOpenLintIssues(owner, repo);
	for (const issue of openIssues) {
		const parsed = parseLintIssue(issue);
		if (!parsed) continue;

		const { ruleId, filePath } = parsed;
		const occurrencesByFile = eslintByRule.get(ruleId) ?? stylelintByRule.get(ruleId);
		const stillOpen = filePath ? (occurrencesByFile?.has(filePath) ?? false) : Boolean(occurrencesByFile);
		if (stillOpen) continue;

		await ghFetch(`/repos/${owner}/${repo}/issues/${issue.number}/comments`, {
			method: `POST`,
			body: JSON.stringify({
				body: `No more \`${ruleId}\` violations${filePath ? ` in \`${filePath}\`` : ``} as of ${runUrl ? `[this run](${runUrl})` : `this run`}.`,
			}),
		});
		await ghFetch(`/repos/${owner}/${repo}/issues/${issue.number}`, {
			method: `PATCH`,
			body: JSON.stringify({ state: `closed`, state_reason: `completed` }),
		});
		console.log(`Closed resolved issue #${issue.number}: ${ruleId}${filePath ? ` (${filePath})` : ``}`);
	}
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

const BLOCKING_STYLELINT_RULES = new Set([`declaration-no-important`]);

const eslintErrorCount = eslintResults.reduce((total, result) => total + result.messages.filter((message) => message.severity === 2).length, 0);
const stylelintErrorCount = stylelintResults.reduce((total, result) => total + result.warnings.filter((warning) => warning.severity === `error`).length, 0);
const blockingStylelintErrorCount = stylelintResults.reduce(
	(total, result) => total + result.warnings.filter((warning) => warning.severity === `error` && BLOCKING_STYLELINT_RULES.has(warning.rule)).length,
	0
);
const errorCount = eslintErrorCount + stylelintErrorCount;
const blockingErrorCount = eslintErrorCount + blockingStylelintErrorCount;

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
	await closeResolvedIssues(owner, repo, runUrl);

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
