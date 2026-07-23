import { describe, it, expect } from 'vitest';
import { getUvBand } from './uvBand';

describe(`getUvBand`, () => {
	it.each([
		[0, `low`],
		[2.9, `low`],
		[3, `moderate`],
		[5.9, `moderate`],
		[6, `high`],
		[6.1, `high`],
		[11, `high`],
	])(`bands a value of %s as %s`, (value, band) => {
		expect(getUvBand(value).band).toBe(band);
	});

	it.each([
		[0, `var(--success)`],
		[4, `var(--warning)`],
		[8, `var(--error)`],
	])(`gives value %s the colour %s`, (value, colour) => {
		expect(getUvBand(value).colour).toBe(colour);
	});
});
