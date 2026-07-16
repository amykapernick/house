'use strict';

const fs = require(`fs`);
const path = require(`path`);
const valueParser = require(`postcss-value-parser`);
const stylelint = require(`stylelint`);

const ruleName = `house/no-duplicate-colour-value`;

const messages = stylelint.utils.ruleMessages(ruleName, {
	rejected: (value, varNames) =>
		`Colour "${value}" duplicates existing variable${varNames.length > 1 ? `s` : ``} ${varNames
			.map((name) => `var(--${name})`)
			.join(` / `)} - use the variable instead of the literal value`,
});

const meta = {
	url: `https://github.com/amykapernick/house`,
};

// The two files that own colour values: hand-written app-semantic aliases
// (colours.css) and the PocketBase-generated palette (colours.generated.css,
// gitignored - only present once `vite dev`/`vite build` has run). Every
// other file in the project should reference a colour through one of these,
// never repeat its literal value.
const COLOUR_SOURCE_FILES = [
	path.resolve(__dirname, `../../src/lib/styles/global/colours.css`),
	path.resolve(__dirname, `../../src/lib/styles/global/colours.generated.css`),
].map((file) => path.normalize(file));

const HEX_DECL_RE = /--([a-zA-Z0-9_-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*[;}]/g;

const normalizeHex = (raw) => {
	const hex = raw.slice(1).toLowerCase();
	const expanded = hex.length <= 4 ? [...hex].map((char) => `${char}${char}`).join(``) : hex;
	return `#${expanded}`;
};

// `_base`/`light_`/`dark_` constants exist purely so other declarations have
// a stable, theme-independent handle to point at (see buildColoursCss.js) -
// when a shorter plain alias shares the same value, suggest that instead.
const preferredNames = (names) => {
	const plain = names.filter((name) => !name.endsWith(`_base`) && !name.startsWith(`light_`) && !name.startsWith(`dark_`));
	return plain.length ? plain : names;
};

let cachedMap = null;
let cachedAt = 0;

const buildColourMap = () => {
	const map = new Map();

	for (const file of COLOUR_SOURCE_FILES) {
		let contents;

		try {
			contents = fs.readFileSync(file, `utf8`);
		}
		catch {
			continue; // colours.generated.css doesn't exist until the vite config's colour-fetch plugin has run at least once
		}

		for (const match of contents.matchAll(HEX_DECL_RE)) {
			const [, name, hex] = match;
			const normalized = normalizeHex(hex);
			const existing = map.get(normalized) ?? [];

			if (!existing.includes(name)) existing.push(name);
			map.set(normalized, existing);
		}
	}

	return map;
};

// Re-read the (tiny) colour source files at most once a second rather than
// once per rule instantiation, so `vite dev` regenerating colours.generated.css
// is picked up without needing to restart the stylelint watcher/extension.
const getColourMap = () => {
	const now = Date.now();

	if (!cachedMap || now - cachedAt > 1000) {
		cachedMap = buildColourMap();
		cachedAt = now;
	}

	return cachedMap;
};

const ruleFunction = (enabled) => {
	return (root, result) => {
		const validOptions = stylelint.utils.validateOptions(result, ruleName, {
			actual: enabled,
			possible: [true, false],
		});

		if (!validOptions || !enabled) return;

		const filePath = root.source?.input?.file ? path.normalize(root.source.input.file) : null;
		if (filePath && COLOUR_SOURCE_FILES.includes(filePath)) return;

		const colourMap = getColourMap();
		if (colourMap.size === 0) return;

		root.walkDecls((decl) => {
			const parsed = valueParser(decl.value);

			parsed.walk((node) => {
				if (node.type !== `word` || !/^#[0-9a-fA-F]{3,8}$/.test(node.value)) return;

				const names = colourMap.get(normalizeHex(node.value));
				if (!names) return;

				stylelint.utils.report({
					message: messages.rejected(node.value, preferredNames(names)),
					node: decl,
					result,
					ruleName,
					word: node.value,
				});
			});
		});
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

module.exports = stylelint.createPlugin(ruleName, ruleFunction);
