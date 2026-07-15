/** @param {string} name @param {string} value @param {string} indent */
const declLine = (name, value, indent) => `${indent}--${name}: ${value};`;

// Colours from PocketBase are grouped by their `theme` field (several
// colours share the same `name`, disambiguated only by theme):
// - no theme: plain declaration, alongside linked colours
// - theme "Light": becomes a `light_{name}` constant
// - theme "Dark": becomes a `dark_{name}` constant
// All of these are emitted as one flat, unconditional :root block - there's
// no prefers-color-scheme media query, since src/lib/utils/theme.ts always
// resolves an explicit light/dark choice in JS (falling back to the system
// preference only as its own default) and stamps it onto <html data-theme>,
// so the CSS never needs to branch on the media feature itself.
// Colours with no hex of their own but a `link` become a var() reference to
// the linked colour instead, so they follow that colour's theme automatically.
// A colour with an explicit Light/Dark theme gets its `{theme}_{name}` var
// (e.g. a Dark "red" becomes `dark_red`) declared as a plain constant in that
// same flat block - a stable handle other declarations can point at even when
// that theme isn't the active one. The `:root[data-theme="light"/"dark"]`
// blocks then just point the plain `--{name}` at its `{theme}_{name}` var, so
// everyday consumers of `--{name}` cascade with whichever theme is active.
// A no-theme colour with its own hex (e.g. "green") also gets a `{name}_base`
// constant (plus `{name}_base_text`) duplicating its plain declaration. This
// exists because the plain `--{name}` is itself subject to the data-theme
// override above when a themed sibling of the same name exists - so any
// `{theme}_{name}` constant that needs to reference the *unthemed* value
// (rather than round-tripping back through the very var it's the override
// for, which would be a cycle) points at `{name}_base` instead of `{name}`.
// Each colour also gets a `_text` var: colours with their own hex reference
// the winning neutral's own var (computed API-side) when one actually meets
// WCAG AA contrast, or a literal pure black/white hex when none of the
// curated neutrals do (the API guarantees one of those two always clears AA
// - see resolveTextColour in household_api). If that neutral has a variant
// for the current theme, its `{theme}_{name}` var is referenced instead of
// the plain one, so the reference doesn't drift onto whichever value the
// plain name happens to cascade to. If the neutral is instead a no-theme
// colour with its own hex (e.g. "background"), the reference points at its
// `_base` constant rather than its plain var, for the same cascade reason as
// above - a `_text` value must stay fixed, and the plain var of a no-theme
// neutral can itself be overridden by a `:root[data-theme]` block. This
// applies even to `_text` declared within the plain no-theme block itself
// (e.g. `black_text` referencing `background_base`, not `background`).
// Linked colours reference their link's `_text` var (its `_base_text` when
// the link target is itself a no-theme colour with its own hex) so they
// follow the same chain.
/** @param {Array<{ name: string; hex: string | null; link: string | null; theme: string | null; text: { name: string | null; hex: string | null } | null }>} colours */
const buildColoursCss = (colours) => {
	/** @type {Array<{ name: string; hex: string | null; link: string | null; text: { name: string | null; hex: string | null } | null }>} */
	const base = [];
	/** @type {Array<{ name: string; hex: string | null; link: string | null; text: { name: string | null; hex: string | null } | null }>} */
	const light = [];
	/** @type {Array<{ name: string; hex: string | null; link: string | null; text: { name: string | null; hex: string | null } | null }>} */
	const dark = [];

	for (const colour of colours) {
		if (!colour.name || (!colour.hex && !colour.link)) continue;

		const bucket = colour.theme === `Light` ? light : colour.theme === `Dark` ? dark : base;
		bucket.push({ name: colour.name, hex: colour.hex, link: colour.link, text: colour.text });
	}

	const lightNames = new Set(light.map((c) => c.name));
	const darkNames = new Set(dark.map((c) => c.name));
	const baseHexNames = new Set(base.filter((c) => c.hex).map((c) => c.name));

	/** Points a var() reference at a colour's `{theme}_{name}` constant when one exists for this theme, else its `{name}_base` constant when the target is a no-theme colour with its own hex, else its plain var. A colour linking to its own name (a "no themed override, use the base" marker) never resolves to its own `{theme}_{name}` constant - that's this very declaration - so it falls through to `{name}_base` instead, since the plain var would cascade back to this declaration under the matching data-theme and form a cycle. @param {string} name @param {'light' | 'dark' | null} theme @param {string} [selfName] */
	const refFor = (name, theme, selfName) => {
		if (name !== selfName) {
			if (theme === `light` && lightNames.has(name)) return `light_${name}`;
			if (theme === `dark` && darkNames.has(name)) return `dark_${name}`;
		}
		if (theme && baseHexNames.has(name)) return `${name}_base`;
		return name;
	};

	/** Like refFor, but for a *text-colour* reference specifically: a base-hex colour is always pointed at its `_base` constant, even from within the plain no-theme block (theme null). A colour's `_text` value should stay fixed regardless of which data-theme is active, so it must never resolve through a plain var (e.g. "background") that a `:root[data-theme]` block might itself override. @param {string} name @param {'light' | 'dark' | null} theme @param {string} [selfName] */
	const textRefFor = (name, theme, selfName) => {
		if (name !== selfName) {
			if (theme === `light` && lightNames.has(name)) return `light_${name}`;
			if (theme === `dark` && darkNames.has(name)) return `dark_${name}`;
		}
		if (baseHexNames.has(name)) return `${name}_base`;
		return name;
	};

	/** @param {{ name: string; hex: string | null; link: string | null; text: { name: string | null; hex: string | null } | null }} colour @param {string} indent @param {string} declName @param {'light' | 'dark' | null} refTheme */
	const linesFor = (colour, indent, declName, refTheme) => {
		const mainValue = colour.hex ?? `var(--${refFor(colour.link, refTheme, colour.name)})`;
		const lines = [declLine(declName, mainValue, indent)];

		// The winning neutral can share its *name* with the colour it's the text
		// for (e.g. a themed "background" colour whose best-contrast neutral is
		// the plain "background" cream) without being the same record. refFor's
		// theme-prefixed routing can't tell those apart, so it'd point this
		// declaration's `_text` var at `{refTheme}_{name}` - which for a
		// same-name match is this very declaration, producing a literal
		// self-reference (dark_background_text: var(--dark_background)). Fall
		// back to the API's literal hex for the neutral instead, same as the
		// no-AA-match case below.
		const isSelfText = colour.text?.name === colour.name;
		const textValue = colour.hex
			? colour.text?.name
				? isSelfText
					? (colour.text.hex ?? `var(--${colour.text.name})`)
					: `var(--${textRefFor(colour.text.name, refTheme)})`
				: (colour.text?.hex ?? null)
			: `var(--${textRefFor(colour.link, refTheme, colour.name)}_text)`;

		if (textValue) lines.push(declLine(`${declName}_text`, textValue, indent));

		return { lines: lines.join(`\n`), hasText: Boolean(textValue) };
	};

	/** Points the plain `--{name}` (and `_text`) at a colour's `{theme}_{name}` constant. @param {{ name: string }} colour @param {string} indent @param {'light' | 'dark'} theme @param {boolean} hasText */
	const pointerLinesFor = (colour, indent, theme, hasText) => {
		const themedName = `${theme}_${colour.name}`;
		const lines = [declLine(colour.name, `var(--${themedName})`, indent)];
		if (hasText) lines.push(declLine(`${colour.name}_text`, `var(--${themedName}_text)`, indent));
		return lines.join(`\n`);
	};

	const baseLines = base
		.map((c) => {
			const ownLines = linesFor(c, `\t`, c.name, null).lines;
			if (!c.hex) return ownLines;

			const baseConstantLines = linesFor(c, `\t`, `${c.name}_base`, null).lines;
			return `${ownLines}\n${baseConstantLines}`;
		})
		.join(`\n`);

	const lightConstants = light.map((c) => linesFor(c, `\t`, `light_${c.name}`, `light`));
	const darkConstants = dark.map((c) => linesFor(c, `\t`, `dark_${c.name}`, `dark`));
	const constantLines = [...lightConstants, ...darkConstants].map((c) => c.lines).join(`\n`);

	const lightLines = light.map((c, i) => pointerLinesFor(c, `\t`, `light`, lightConstants[i].hasText)).join(`\n`);
	const darkLines = dark.map((c, i) => pointerLinesFor(c, `\t`, `dark`, darkConstants[i].hasText)).join(`\n`);

	return `/* Auto-generated from the PocketBase "colours" collection by vite.config.ts - do not edit directly. */
:root {
	/* Colours without a theme, including linked colours */
${baseLines}

	/* Per-theme constants - always available, regardless of which theme is active */
${constantLines}
}

/* Explicit theme override - set by the header's theme switch (and on load,
   the resolved system/stored preference) via a data-theme attribute on
   <html>. An attribute selector is more specific than the plain :root used
   above, so it always wins regardless of source order. */
:root[data-theme="light"] {
${lightLines}
}

:root[data-theme="dark"] {
${darkLines}
}
`;
};

export default buildColoursCss;
