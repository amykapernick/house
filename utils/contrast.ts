type HexCode = string

type RGB = number[]

type Luminance = number

type ContrastRatio = number

type Colour = {
  rgb: RGB,
  luminance: number,
  hex: HexCode
}

const convertToRGB = (code: HexCode): RGB => {
	let hex = code.replace(/^#/, '');

	if (hex.length === 3) {
		hex = hex.split('')
			.map(c => c + c)
			.join('');
	}
	const num = parseInt(hex, 16);
	const rgb = [(num >> 16) & 255, (num >> 8) & 255, num & 255];

	return rgb
}

const calculateLuminance = (rgb: RGB): Luminance => {
	const [r, g, b] = rgb
	
	const a = [r, g, b].map(v => {
		v /= 255;
		return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
	});

	const luminance = a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;

	return luminance
}

const colourContrast = (hex_1: HexCode, hex_2: HexCode): {
	ratio: ContrastRatio,
	colours: Colour[]
} => {
	const rgb_1 = convertToRGB(hex_1)
	const rgb_2 = convertToRGB(hex_2)

	const lum_1 = calculateLuminance(rgb_1)
	const lum_2 = calculateLuminance(rgb_2)

	const contrast = (Math.max(lum_1, lum_2) + 0.05) / (Math.min(lum_1, lum_2) + 0.05)

	return ({
		ratio: contrast,
		colours: [
			{
				rgb: rgb_1,
				luminance: lum_1,
				hex: hex_1
			},
			{
				rgb: rgb_2,
				luminance: lum_2,
				hex: hex_2
			}
		]
	})
}

export default colourContrast