// Runs ESLint with --fix in-memory, then opens a GitHub issue for each error
// that survives fixing (warnings are left alone). Auto-fixable style issues
// never reach here - only violations that need a human. Existing open issues
// are matched via a hidden marker in the body so re-runs don't duplicate them.
//
// Only meant to run on direct pushes to prod/dev - PRs already get fast-fail
// feedback from the plain `lint:ci` step and shouldn't spawn permanent issues
// for in-progress work.

import { ESLint } from 'eslint';

const token = process.env.GITHUB_TOKEN;
const repoSlug = process.env.GITHUB_REPOSITORY;
const runId = process.env.GITHUB_RUN_ID;
const serverUrl = process.env.GITHUB_SERVER_URL ?? `https://github.com`;

const eslint = new ESLint({
	fix: true,
	overrideConfigFile: `./config/eslint.config.mjs`,
});

const results = await eslint.lintFiles([`.`]);
await ESLint.outputFixes(results);

const formatter = await eslint.loadFormatter(`stylish`);
console.log(await formatter.format(results));

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
			description: `ESLint error not resolved by --fix`,
		}),
	});
}

async function findExistingIssue(owner, repo, marker) {
	const q = encodeURIComponent(`repo:${owner}/${repo} is:issue is:open "${marker}" in:body`);
	const result = await ghFetch(`/search/issues?q=${q}`);
	return result?.items?.[0] ?? null;
}

async function createIssueForError(owner, repo, message, filePath, runUrl) {
	const marker = `<!-- lint-issue-id: ${filePath}:${message.line}:${message.column}:${message.ruleId} -->`;
	const existing = await findExistingIssue(owner, repo, marker);
	if (existing) {
		console.log(`Issue already open for ${filePath}:${message.line} (${message.ruleId}): #${existing.number}`);
		return;
	}

	const title = `Lint: ${message.ruleId ?? `error`} in ${filePath}:${message.line}`;
	const body = [
		message.message,
		``,
		`\`${filePath}:${message.line}:${message.column}\``,
		message.ruleId ? `Rule: \`${message.ruleId}\`` : ``,
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
let errorCount = 0;

for (const result of results) {
	errorCount += result.errorCount;
}

if (token && repoSlug) {
	const [owner, repo] = repoSlug.split(`/`);
	const runUrl = runId ? `${serverUrl}/${repoSlug}/actions/runs/${runId}` : undefined;

	await ensureLabelExists(owner, repo);

	for (const result of results) {
		const filePath = result.filePath.startsWith(cwd) ? result.filePath.slice(cwd.length + 1) : result.filePath;
		for (const message of result.messages) {
			if (message.severity !== 2) continue; // errors only, not warnings
			await createIssueForError(owner, repo, message, filePath, runUrl);
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
