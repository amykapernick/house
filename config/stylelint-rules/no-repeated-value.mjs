import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import postcssHtml from 'postcss-html';
import stylelint from 'stylelint';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ruleName = `house/no-repeated-value`;

const messages = stylelint.utils.ruleMessages(ruleName, {
	rejected: (property, value, count) =>
		`This ${property} value is repeated ${count} times across the codebase - consider extracting it to a variable: "${value}"`,
});

// Not auto-fixable - picking a name and a home for the new variable is a
// judgment call, unlike the plain literal -> existing-var swap in
// no-duplicate-colour-value.
const meta = {
	url: `https://github.com/amykapernick/house`,
	fixable: false,
};

const SRC_DIR = path.resolve(__dirname, `../../src`);
const DEFAULT_THRESHOLD = 3;

// box-shadow is checked regardless of its content (it's rarely written with
// anything else); other properties only count if they use one of the
// colour-composing functions a variable would plausibly wrap.
const COMPOUND_FN_RE = /\b(?:color-mix|linear-gradient|radial-gradient|conic-gradient)\(/;

const isCandidateDecl = (decl) => decl.prop.toLowerCase() === `box-shadow` || COMPOUND_FN_RE.test(decl.value);

// A value that's already nothing but a single var() reference has nothing
// left to extract - already exactly what this rule is trying to encourage.
const BARE_VAR_RE = /^var\(--[a-zA-Z0-9_-]+(?:\s*,.*)?\)$/;

const normalizeValue = (value) => value.trim().replace(/\s+/g, ` `);

const declKey = (decl) => `${decl.prop.toLowerCase()}::${normalizeValue(decl.value)}`;

const listSourceFiles = () => {
	const files = [];

	for (const entry of fs.readdirSync(SRC_DIR, { withFileTypes: true, recursive: true })) {
		if (!entry.isFile() || !/\.(?:css|svelte)$/.test(entry.name)) continue;
		files.push(path.join(entry.parentPath, entry.name));
	}

	return files;
};

const walkFileDecls = (file, onDecl) => {
	let contents;

	try {
		contents = fs.readFileSync(file, `utf8`);
	}
	catch {
		return;
	}

	let root;

	try {
		root = file.endsWith(`.svelte`) ? postcssHtml.parse(contents, { from: file }) : postcss.parse(contents, { from: file });
	}
	catch {
		return; // unparsable fragment (eg. a file mid-edit in the editor) - skip rather than crash the whole lint run
	}

	root.walkDecls(onDecl);
};

const buildValueCounts = () => {
	const counts = new Map();

	for (const file of listSourceFiles()) {
		walkFileDecls(file, (decl) => {
			if (!isCandidateDecl(decl)) return;
			if (BARE_VAR_RE.test(decl.value.trim())) return;

			const key = declKey(decl);
			const existing = counts.get(key) ?? 0;
			counts.set(key, existing + 1);
		});
	}

	return counts;
};

let cachedCounts = null;
let cachedAt = 0;

// Re-scan `src` at most once a second, same rationale as
// no-duplicate-colour-value's colour-file cache: keep editor/watch runs fast
// without going stale across a `vite dev` edit-save cycle.
const getValueCounts = () => {
	const now = Date.now();

	if (!cachedCounts || now - cachedAt > 1000) {
		cachedCounts = buildValueCounts();
		cachedAt = now;
	}

	return cachedCounts;
};

const ruleFunction = (enabled, options) => {
	return (root, result) => {
		const validOptions = stylelint.utils.validateOptions(
			result,
			ruleName,
			{
				actual: enabled,
				possible: [true, false],
			},
			{
				actual: options,
				possible: { threshold: [(value) => Number.isInteger(value) && value > 1] },
				optional: true,
			},
		);

		if (!validOptions || !enabled) return;

		const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
		const counts = getValueCounts();
		if (counts.size === 0) return;

		root.walkDecls((decl) => {
			if (!isCandidateDecl(decl)) return;

			const trimmedValue = decl.value.trim();
			if (BARE_VAR_RE.test(trimmedValue)) return;

			const count = counts.get(declKey(decl)) ?? 0;
			if (count < threshold) return;

			stylelint.utils.report({
				message: messages.rejected(decl.prop, trimmedValue, count),
				node: decl,
				result,
				ruleName,
			});
		});
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default stylelint.createPlugin(ruleName, ruleFunction);
