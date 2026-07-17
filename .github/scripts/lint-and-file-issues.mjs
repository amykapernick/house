// Runs ESLint and stylelint (the `house/*` colour rules only, same scope as
// `lint:colours`) with --fix in-memory, then opens a GitHub issue for each
// error that survives fixing (warnings are left alone). Auto-fixable style
// issues never reach here - only violations that need a human. Existing open
// issues are matched via a hidden marker in the body so re-runs don't
// duplicate them.
//
// Only meant to run on direct pushes to prod/dev - PRs already get fast-fail
// feedback from the plain `lint:ci` step and shouldn't spawn permanent issues
// for in-progress work.

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
	configFile: `./config/stylelint.colours.config.cjs`,
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

// `problem` is normalized to `{ line, column, ruleId, message }` regardless
// of which linter produced it.
async function createIssueForError(owner, repo, problem, filePath, runUrl) {
	const marker = `<!-- lint-issue-id: ${filePath}:${problem.line}:${problem.column}:${problem.ruleId} -->`;
	const existing = await findExistingIssue(owner, repo, marker);
	if (existing) {
		console.log(`Issue already open for ${filePath}:${problem.line} (${problem.ruleId}): #${existing.number}`);
		return;
	}

	const title = `Lint: ${problem.ruleId ?? `error`} in ${filePath}:${problem.line}`;
	const body = [
		problem.message,
		``,
		`\`${filePath}:${problem.line}:${problem.column}\``,
		problem.ruleId ? `Rule: \`${problem.ruleId}\`` : ``,
		``,
		runUrl ? `Found in [this run](${runUrl}).` : ``,
		``,
		marker,
	].filter(Boolean).join(`\n`);

	const created = await ghFetch(`/repos/${owner}/${repo}/issues`, {
		method: `POST`,
		body: JSON.stringify({ title, body, labels: [`lint`] }),
	});
	console.log(`Created issue #${created.number}: ${title}`);
}

const cwd = process.cwd();
const relativePath = (filePath) => (filePath.startsWith(cwd) ? filePath.slice(cwd.length + 1) : filePath);

// Each entry: normalized file path + the errors (severity 2 for ESLint,
// `'error'` for stylelint - warnings of either kind are left for a human to
// notice locally, same as today).
const fileProblems = [
	...eslintResults.map((result) => ({
		filePath: relativePath(result.filePath),
		problems: result.messages
			.filter((message) => message.severity === 2)
			.map((message) => ({ line: message.line, column: message.column, ruleId: message.ruleId, message: message.message })),
	})),
	...stylelintResults.map((result) => ({
		filePath: relativePath(result.source),
		problems: result.warnings
			.filter((warning) => warning.severity === `error`)
			.map((warning) => ({ line: warning.line, column: warning.column, ruleId: warning.rule, message: warning.text })),
	})),
];

const errorCount = fileProblems.reduce((total, { problems }) => total + problems.length, 0);

if (token && repoSlug) {
	const [owner, repo] = repoSlug.split(`/`);
	const runUrl = runId ? `${serverUrl}/${repoSlug}/actions/runs/${runId}` : undefined;

	await ensureLabelExists(owner, repo);

	for (const { filePath, problems } of fileProblems) {
		for (const problem of problems) {
			await createIssueForError(owner, repo, problem, filePath, runUrl);
		}
	}
}
else {
	console.log(`GITHUB_TOKEN/GITHUB_REPOSITORY not set - skipping issue creation (local run?)`);
}

if (errorCount > 0) {
	console.error(`${errorCount} lint error(s) remain after auto-fix.`);
	process.exit(1);
}
