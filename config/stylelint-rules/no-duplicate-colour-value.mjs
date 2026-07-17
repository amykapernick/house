import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import valueParser from 'postcss-value-parser';
import stylelint from 'stylelint';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import hwbPlugin from 'colord/plugins/hwb';
import labPlugin from 'colord/plugins/lab';
import lchPlugin from 'colord/plugins/lch';

// Adds support for parsing named colours (`white`), hwb(), lab() and lch() -
// core colord only understands hex/rgb/hsl out of the box. oklab()/oklch()
// have no colord plugin as of 2.9.3, so a literal written in those functions
// won't be matched against a variable - this codebase only uses oklch as a
// color-mix() interpolation space, never as a literal colour value.
extend([namesPlugin, hwbPlugin, labPlugin, lchPlugin]);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ruleName = `house/no-duplicate-colour-value`;

const messages = stylelint.utils.ruleMessages(ruleName, {
	rejected: (value, varNames) =>
		`Colour "${value}" duplicates existing variable${varNames.length > 1 ? `s` : ``} ${varNames
			.map((name) => `var(--${name})`)
			.join(` / `)} - use the variable instead of the literal value`,
	rejectedCompound: (value, varNames) =>
		`Value "${value}" duplicates existing variable${varNames.length > 1 ? `s` : ``} ${varNames
			.map((name) => `var(--${name})`)
			.join(` / `)} - use the variable instead of repeating the full expression`,
});

const meta = {
	url: `https://github.com/amykapernick/house`,
	fixable: true,
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

// Captures every custom property declaration's raw value, whatever format
// it's written in (hex, rgb(), hsl(), a bare keyword, a var() reference, a
// gradient/color-mix() call, ...) - format/literal-ness is sorted out
// afterwards by attempting to parse it with colord.
const CUSTOM_PROP_DECL_RE = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;

// Colour functions colord can parse; matched as a whole so eg. `rgba(255, 0,
// 0, 0.5)` is compared as one colour rather than four unrelated numbers.
// Functions colord can't parse (var, calc, color-mix, light-dark, oklch, ...)
// are left alone and walked into instead, so literal colours nested inside
// them (eg. the `#1f242d` in `light-dark(var(--white), #1f242d)`) still get
// picked up individually.
const COLOUR_FUNCTIONS = new Set([`rgb`, `rgba`, `hsl`, `hsla`, `hwb`, `lab`, `lch`]);

// Colour keywords that intentionally have no fixed value and so can never
// duplicate a variable's concrete colour.
const CONTEXTUAL_KEYWORDS = new Set([`currentcolor`, `inherit`, `initial`, `unset`, `revert`, `revert-layer`]);

/** @param {string} value */
const normalizeColour = (value) => {
	const trimmed = value.trim();
	if (CONTEXTUAL_KEYWORDS.has(trimmed.toLowerCase())) return null;

	const parsed = colord(trimmed);
	return parsed.isValid() ? parsed.toRgbString() : null;
};

// Whitespace-insensitive key for matching a whole compound expression
// (gradient/color-mix/etc.) against a variable's declared value - source
// files format multi-value declarations across lines, call sites don't.
// Purely syntactic: `color-mix(in oklch, ...)` won't match an otherwise
// identical `color-mix(in srgb, ...)`, by design (see rule doc comment).
/** @param {string} value */
const normalizeCompoundValue = (value) => value.trim().replace(/\s+/g, ` `);

// A bare `var(--x)` (optionally with a fallback) is a semantic alias, eg.
// `--amy: var(--purple_bright)` - not a compound colour formula. Using the
// base name where the alias exists is a legitimate, unrelated style choice,
// so these never enter the compound map.
const BARE_VAR_RE = /^var\(--[a-zA-Z0-9_-]+(?:\s*,.*)?\)$/;

// `_text` vars are per-colour computed contrast fallbacks (see
// buildColoursCss.js) - they're allowed to coincide with a plain literal
// used for an unrelated purpose (eg. a generic gradient mix), so they're not
// meaningful "duplicates".
const isTextVar = (name) => name.endsWith(`_text`);

// `_base`/`light_`/`dark_` constants exist purely so other declarations have
// a stable, theme-independent handle to point at (see buildColoursCss.js) -
// when a shorter plain alias shares the same value, suggest that instead.
const preferredNames = (names) => {
	const plain = names.filter((name) => !name.endsWith(`_base`) && !name.startsWith(`light_`) && !name.startsWith(`dark_`));
	return plain.length ? plain : names;
};

let cachedMaps = null;
let cachedAt = 0;

const buildColourMap = () => {
	const map = new Map();
	const compoundMap = new Map();

	for (const file of COLOUR_SOURCE_FILES) {
		let contents;

		try {
			contents = fs.readFileSync(file, `utf8`);
		}
		catch {
			continue; // colours.generated.css doesn't exist until the vite config's colour-fetch plugin has run at least once
		}

		for (const match of contents.matchAll(CUSTOM_PROP_DECL_RE)) {
			const [, name, rawValue] = match;
			if (isTextVar(name)) continue;

			const normalized = normalizeColour(rawValue);
			if (normalized) {
				const existing = map.get(normalized) ?? [];
				if (!existing.includes(name)) existing.push(name);
				map.set(normalized, existing);
				continue;
			}

			// Not a bare colour. Skip semantic aliases (a single var() ref) -
			// only real compound expressions (gradient(), color-mix(), light-dark(),
			// ...) are worth matching whole.
			const trimmedValue = rawValue.trim();
			if (BARE_VAR_RE.test(trimmedValue)) continue;

			const key = normalizeCompoundValue(rawValue);
			const existing = compoundMap.get(key) ?? [];
			if (!existing.includes(name)) existing.push(name);
			compoundMap.set(key, existing);
		}
	}

	return { map, compoundMap };
};

// Re-read the (tiny) colour source files at most once a second rather than
// once per rule instantiation, so `vite dev` regenerating colours.generated.css
// is picked up without needing to restart the stylelint watcher/extension.
const getColourMaps = () => {
	const now = Date.now();

	if (!cachedMaps || now - cachedAt > 1000) {
		cachedMaps = buildColourMap();
		cachedAt = now;
	}

	return cachedMaps;
};

/** Finds every standalone colour token in a declaration value: word nodes (hex, named keywords, `transparent`) and whole colour-function calls (rgb/hsl/hwb/lab/lch). Returns each token's source span (rather than just its text) so a fix can splice `var(--name)` in over exactly that span. @param {string} value */
const collectColourTokens = (value) => {
	const parsed = valueParser(value);
	const tokens = [];

	parsed.walk((node) => {
		if (node.type === `function`) {
			if (!COLOUR_FUNCTIONS.has(node.value.toLowerCase())) return; // descend into var()/calc()/color-mix()/light-dark()/oklch() etc.

			tokens.push({ start: node.sourceIndex, end: node.sourceEndIndex });
			return false; // don't also inspect its numeric/percentage arguments as standalone words
		}

		if (node.type === `word`) {
			tokens.push({ start: node.sourceIndex, end: node.sourceEndIndex });
		}
	});

	return tokens;
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

		const { map: colourMap, compoundMap } = getColourMaps();
		if (colourMap.size === 0 && compoundMap.size === 0) return;

		root.walkDecls((decl) => {
			const tokenMatches = [];

			for (const { start, end } of collectColourTokens(decl.value)) {
				const raw = decl.value.slice(start, end);
				const normalized = normalizeColour(raw);
				if (!normalized) continue;

				const names = colourMap.get(normalized);
				if (!names) continue;

				tokenMatches.push({ start, end, raw, names });
			}

			// Build the value as it'd read once every literal token above is
			// swapped for its variable, and check *that* against known compound
			// expressions - source vars like `--border` are themselves written
			// with var() refs, so this only has a chance of matching post-substitution.
			let substituted = decl.value;
			if (tokenMatches.length) {
				const sortedDesc = [...tokenMatches].sort((a, b) => b.start - a.start);
				for (const { start, end, names } of sortedDesc) {
					substituted = substituted.slice(0, start) + `var(--${preferredNames(names)[0]})` + substituted.slice(end);
				}
			}

			const compoundNames = compoundMap.get(normalizeCompoundValue(substituted));
			if (compoundNames) {
				const [preferred] = preferredNames(compoundNames);

				stylelint.utils.report({
					message: messages.rejectedCompound(decl.value, preferredNames(compoundNames)),
					node: decl,
					result,
					ruleName,
					fix: () => {
						decl.value = `var(--${preferred})`; 
					},
				});
				return;
			}

			if (!tokenMatches.length) return;

			// Fix callbacks (only invoked in `--fix` mode) push here instead of
			// mutating decl.value immediately - later tokens' spans are computed
			// against the *original* string, so edits must be applied in one
			// right-to-left pass afterwards to avoid earlier splices shifting
			// the source positions of tokens still to come.
			const edits = [];

			for (const { start, end, raw, names } of tokenMatches) {
				const [preferred] = preferredNames(names);

				stylelint.utils.report({
					message: messages.rejected(raw, preferredNames(names)),
					node: decl,
					result,
					ruleName,
					word: raw,
					fix: () => edits.push({ start, end, replacement: `var(--${preferred})` }),
				});
			}

			if (!edits.length) return;

			edits.sort((a, b) => b.start - a.start);
			for (const { start, end, replacement } of edits) {
				decl.value = decl.value.slice(0, start) + replacement + decl.value.slice(end);
			}
		});
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default stylelint.createPlugin(ruleName, ruleFunction);
