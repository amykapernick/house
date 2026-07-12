import { describe, it, expect } from 'vitest';
import buildColoursCss from './buildColoursCss.js';

describe(`buildColoursCss`, () => {
	it(`references the named winning-neutral var when the API resolved one`, () => {
		const css = buildColoursCss([
			{ name: `yellow`, hex: `#ffce03`, link: null, theme: null, text: { name: `black`, hex: `#0d0d0d` } },
		]);

		expect(css).toContain(`--yellow_text: var(--black);`);
	});

	it(`falls back to a literal hex when the API found no AA-compliant curated neutral`, () => {
		const css = buildColoursCss([
			{ name: `orange`, hex: `#bb5c04`, link: null, theme: `Light`, text: { name: null, hex: `#ffffff` } },
		]);

		expect(css).toContain(`--orange_text: #ffffff;`);
	});

	it(`omits the _text var entirely when the API returned no text at all`, () => {
		const css = buildColoursCss([{ name: `mystery`, hex: `#336699`, link: null, theme: null, text: null }]);

		expect(css).not.toContain(`--mystery_text`);
	});

	it(`points a linked colour's _text var at its link's _text var`, () => {
		const css = buildColoursCss([
			{ name: `amy`, hex: null, link: `purple_bright`, theme: null, text: null },
		]);

		expect(css).toContain(`--amy_text: var(--purple_bright_text);`);
	});
});
