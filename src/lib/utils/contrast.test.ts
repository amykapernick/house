import { describe, it, expect } from 'vitest';
import colourContrast from './contrast';

describe(`colourContrast`, () => {
	it(`returns a ratio of 21 for black vs white`, () => {
		const { ratio } = colourContrast(`#000000`, `#ffffff`);

		expect(ratio).toBeCloseTo(21, 1);
	});

	it(`returns a ratio of 1 for identical colours`, () => {
		const { ratio } = colourContrast(`#336699`, `#336699`);

		expect(ratio).toBeCloseTo(1, 5);
	});

	it(`is symmetric regardless of argument order`, () => {
		const a = colourContrast(`#123456`, `#abcdef`).ratio;
		const b = colourContrast(`#abcdef`, `#123456`).ratio;

		expect(a).toBeCloseTo(b, 10);
	});

	it(`expands 3-char hex shorthand to the equivalent 6-char value`, () => {
		const short = colourContrast(`#000`, `#fff`);
		const long = colourContrast(`#000000`, `#ffffff`);

		expect(short.ratio).toBeCloseTo(long.ratio, 10);
	});

	it(`accepts hex codes without a leading #`, () => {
		const withHash = colourContrast(`#000000`, `#ffffff`);
		const withoutHash = colourContrast(`000000`, `ffffff`);

		expect(withoutHash.ratio).toBeCloseTo(withHash.ratio, 10);
	});

	it(`echoes back the original hex and rgb per colour`, () => {
		const { colours } = colourContrast(`#ff0000`, `#0000ff`);

		expect(colours[0]).toMatchObject({ hex: `#ff0000`, rgb: [255, 0, 0] });
		expect(colours[1]).toMatchObject({ hex: `#0000ff`, rgb: [0, 0, 255] });
	});
});
