// Runs pa11y (HTML_CodeSniffer WCAG2AA ruleset) against every route in
// tests/a11y/routes.ts. Complements the @axe-core/playwright checks with a
// second, independently-implemented accessibility engine.
//
// Authenticated routes reuse the Clerk session cookies captured by the
// Playwright `setup` project (tests/setup/.auth/state.json) instead of logging
// in a second time.

import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pa11y from 'pa11y';
import { routes } from '../tests/a11y/routes.ts';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:5173`;
const authStatePath = path.join(dirname, `../tests/setup/.auth/state.json`);
const reportDir = path.join(dirname, `../pa11y-report`);

async function loadAuthCookies() {
	try {
		const state = JSON.parse(await readFile(authStatePath, `utf-8`));
		return state.cookies ?? [];
	}
	catch {
		throw new Error(
			`Could not read ${authStatePath}. Run "npx playwright test --project=setup" first to sign in.`
		);
	}
}

async function main() {
	const authCookies = await loadAuthCookies();
	await mkdir(reportDir, { recursive: true });

	const results = [];
	let hasErrors = false;

	for (const route of routes) {
		const url = new URL(route.path, baseURL).toString();
		console.log(`pa11y: scanning ${route.name} (${url})`);

		const result = await pa11y(url, {
			standard: `WCAG2AA`,
			runners: [`htmlcs`],
			timeout: 30000,
			cookies: route.auth ? authCookies : [],
			chromeLaunchConfig: {
				args: [`--no-sandbox`, `--disable-dev-shm-usage`],
			},
		});

		results.push({ route: route.name, url, ...result });

		const errors = result.issues.filter((issue) => issue.type === `error`);
		if (errors.length > 0) {
			hasErrors = true;
			console.error(`\n${errors.length} error(s) on ${route.name} (${url}):`);
			for (const issue of errors) {
				console.error(`  - ${issue.message} [${issue.selector}]`);
			}
		}
	}

	await writeFile(path.join(reportDir, `results.json`), JSON.stringify(results, null, 2));

	if (hasErrors) {
		console.error(`\npa11y found accessibility errors. See pa11y-report/results.json for details.`);
		process.exit(1);
	}

	console.log(`\npa11y: no errors found across ${routes.length} routes.`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
