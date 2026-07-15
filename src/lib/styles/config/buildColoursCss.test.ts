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

		expect(css).toContain(`--light_orange_text: #ffffff;`);
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

	it(`emits a theme-prefixed constant for a themed colour, plus a data-theme pointer at it`, () => {
		const css = buildColoursCss([
			{ name: `orange`, hex: `#bb5c04`, link: null, theme: `Light`, text: { name: null, hex: `#ffffff` } },
			{ name: `navy`, hex: `#7294fa`, link: null, theme: `Dark`, text: { name: null, hex: `#000000` } },
		]);

		expect(css).toContain(`--light_orange: #bb5c04;`);
		expect(css).toContain(`--dark_navy: #7294fa;`);

		expect(css).toContain(`:root[data-theme="light"] {`);
		expect(css).toContain(`:root[data-theme="dark"] {`);

		const lightOverride = css.slice(css.indexOf(`:root[data-theme="light"]`));
		expect(lightOverride).toContain(`--orange: var(--light_orange);`);

		const darkOverride = css.slice(css.indexOf(`:root[data-theme="dark"]`));
		expect(darkOverride).toContain(`--navy: var(--dark_navy);`);
	});

	it(`does not emit a prefers-color-scheme media query`, () => {
		const css = buildColoursCss([
			{ name: `orange`, hex: `#bb5c04`, link: null, theme: `Light`, text: null },
		]);

		expect(css).not.toContain(`prefers-color-scheme`);
	});

	it(`points a themed colour's link at the link's same-theme constant when one exists`, () => {
		const css = buildColoursCss([
			{ name: `blue_navy`, hex: `#364c93`, link: null, theme: null, text: null },
			{ name: `blue_navy`, hex: `#7294fa`, link: null, theme: `Dark`, text: null },
			{ name: `navy`, hex: null, link: `blue_navy`, theme: `Dark`, text: null },
		]);

		expect(css).toContain(`--dark_navy: var(--dark_blue_navy);`);
	});

	it(`points a themed colour that links to its own name at the _base var, not the plain var or itself`, () => {
		const css = buildColoursCss([
			{ name: `green`, hex: `#64ad66`, link: null, theme: null, text: null },
			{ name: `green`, hex: null, link: `green`, theme: `Dark`, text: null },
		]);

		expect(css).toContain(`--dark_green: var(--green_base);`);
		expect(css).not.toContain(`--dark_green: var(--dark_green);`);
		expect(css).not.toContain(`--dark_green: var(--green);`);
	});

	it(`duplicates a no-theme colour with its own hex into a _base constant, plus _base_text`, () => {
		const css = buildColoursCss([
			{ name: `green`, hex: `#64ad66`, link: null, theme: null, text: { name: `black`, hex: `#0d0d0d` } },
		]);

		expect(css).toContain(`--green: #64ad66;`);
		expect(css).toContain(`--green_base: #64ad66;`);
		expect(css).toContain(`--green_text: var(--black);`);
		expect(css).toContain(`--green_base_text: var(--black);`);
	});

	it(`does not emit a _base constant for a no-theme colour that only links (no hex of its own)`, () => {
		const css = buildColoursCss([
			{ name: `purple_bright`, hex: `#9440a0`, link: null, theme: null, text: null },
			{ name: `amy`, hex: null, link: `purple_bright`, theme: null, text: null },
		]);

		expect(css).not.toContain(`--amy_base`);
	});

	it(`points a themed colour linking to a different-named base colour at that colour's _base var`, () => {
		const css = buildColoursCss([
			{ name: `blue_navy`, hex: `#364c93`, link: null, theme: null, text: null },
			{ name: `navy`, hex: null, link: `blue_navy`, theme: `Light`, text: null },
		]);

		expect(css).toContain(`--light_navy: var(--blue_navy_base);`);
	});

	it(`points a no-theme colour's _text at its neutral's _base var, even within the plain block`, () => {
		const css = buildColoursCss([
			{ name: `background`, hex: `#f7f0eb`, link: null, theme: null, text: null },
			{ name: `black`, hex: `#0d0d0d`, link: null, theme: null, text: { name: `background`, hex: `#f7f0eb` } },
		]);

		expect(css).toContain(`--black_text: var(--background_base);`);
		expect(css).toContain(`--black_base_text: var(--background_base);`);
		expect(css).not.toContain(`--black_text: var(--background);`);
	});

	it(`points a linked no-theme colour's _text at its link's _base_text var when the link has its own hex`, () => {
		const css = buildColoursCss([
			{ name: `black`, hex: `#0d0d0d`, link: null, theme: null, text: { name: `background`, hex: `#f7f0eb` } },
			{ name: `neutral`, hex: null, link: `black`, theme: null, text: null },
		]);

		expect(css).toContain(`--neutral_text: var(--black_base_text);`);
	});

	it(`falls back to the neutral's literal hex when the winning neutral shares its name with the themed colour it's the text for`, () => {
		const css = buildColoursCss([
			{ name: `background`, hex: `#f7f0eb`, link: null, theme: null, text: null },
			{ name: `background`, hex: `#14171d`, link: null, theme: `Dark`, text: { name: `background`, hex: `#f7f0eb` } },
		]);

		expect(css).toContain(`--dark_background_text: #f7f0eb;`);
		expect(css).not.toContain(`--dark_background_text: var(--dark_background);`);
	});
});
