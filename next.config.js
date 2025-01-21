// @ts-check

/**
 * @type {import('next').NextConfig}
 **/

module.exports = async (phase, { defaultConfig }) => {
	const nextConfig = {
		...defaultConfig,
		output: `standalone`,
		distDir: `.next`,
		reactStrictMode: true,
		images: {
			remotePatterns: [
				{
					protocol: `https`,
					hostname: `prod-files-secure.s3.us-west-2.amazonaws.com`,
					port: ``,
				},
			],
		},
		typescript: {
			ignoreBuildErrors: true
		},
		webpack(config) {
			const fileLoaderRule = config.module.rules.find((rule) =>
				rule.test?.test?.(`.svg`)
			);

			config.module.rules.push(
				{
					...fileLoaderRule,
					test: /\.svg$/i,
					resourceQuery: /url/, // *.svg?url
				},
				{
					test: /\.svg$/i,
					issuer: fileLoaderRule.issuer,
					resourceQuery: {
						not: [...fileLoaderRule.resourceQuery.not, /url/],
					},
					use: [`@svgr/webpack`],
				}
			);

			fileLoaderRule.exclude = /\.svg$/i;

			return config;
		},
	};

	return nextConfig;
};
