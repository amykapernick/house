/** @param {string} name @param {string} value @param {string} indent */
const declLine = (name, value, indent) => `${indent}--${name}: ${value};`;

// Colours from PocketBase are grouped by their `theme` field (several
// colours share the same `name`, disambiguated only by theme):
// - no theme: goes in the default :root block, alongside linked colours
// - theme "Light": goes in the prefers-color-scheme: light block
// - theme "Dark": goes in the prefers-color-scheme: dark block
// Colours with no hex of their own but a `link` become a var() reference to
// the linked colour instead, so they follow that colour's theme automatically.
// Base (theme-less) colours with their own hex also get a `_base` var holding
// the same value - a copy that's never shadowed by a themed override of the
// same name. Links declared inside a Light/Dark block reference `_base`
// instead of the plain var, so they resolve to the literal default rather
// than whatever that name happens to cascade to.
// Each colour also gets a `_text` var: colours with their own hex reference
// the winning neutral's own var (computed API-side), while linked colours
// reference their link's `_text` var so they follow the same chain.
/** @param {Array<{ name: string; hex: string | null; link: string | null; theme: string | null; text: { name: string } | null }>} colours */
const buildColoursCss = (colours) => {
	/** @type {Array<{ name: string; hex: string | null; link: string | null; text: { name: string } | null }>} */
	const base = [];
	/** @type {Array<{ name: string; hex: string | null; link: string | null; text: { name: string } | null }>} */
	const light = [];
	/** @type {Array<{ name: string; hex: string | null; link: string | null; text: { name: string } | null }>} */
	const dark = [];

	for (const colour of colours) {
		if (!colour.name || (!colour.hex && !colour.link)) continue;

		const bucket = colour.theme === `Light` ? light : colour.theme === `Dark` ? dark : base;
		bucket.push({ name: colour.name, hex: colour.hex, link: colour.link, text: colour.text });
	}

	/** @param {{ name: string; hex: string | null; link: string | null; text: { name: string } | null }} colour @param {string} indent @param {boolean} isThemed */
	const linesFor = (colour, indent, isThemed) => {
		const mainValue = colour.hex ?? `var(--${colour.link}${isThemed ? `_base` : ``})`;
		const lines = [declLine(colour.name, mainValue, indent)];

		if (colour.hex && !isThemed) lines.push(declLine(`${colour.name}_base`, colour.hex, indent));

		const textValue = colour.hex
			? colour.text?.name
				? `var(--${colour.text.name})`
				: null
			: `var(--${colour.link}_text)`;

		if (textValue) lines.push(declLine(`${colour.name}_text`, textValue, indent));

		return lines.join(`\n`);
	};

	const baseLines = base.map((c) => linesFor(c, `\t`, false)).join(`\n`);
	const lightLines = light.map((c) => linesFor(c, `\t\t`, true)).join(`\n`);
	const darkLines = dark.map((c) => linesFor(c, `\t\t`, true)).join(`\n`);

	return `/* Auto-generated from the PocketBase "colours" collection by vite.config.ts - do not edit directly. */
:root {
	/* Colours without a theme, including linked colours */
${baseLines}

	@media (prefers-color-scheme: light) {
		/* Colours with theme of Light */
${lightLines}
	}

	@media (prefers-color-scheme: dark) {
		/* Colours with theme of Dark */
${darkLines}
	}
}
`;
};

export default buildColoursCss;
