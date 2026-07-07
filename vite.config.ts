import path from 'path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';
import svg from '@poppanator/sveltekit-svg';
import advancedVariables from 'postcss-advanced-variables';
import hexrgba from 'postcss-hexrgba';
import nesting from 'postcss-nesting';
import mixins from 'postcss-mixins';

const variables = (await import(`./src/lib/styles/config/variables.js`)).default;

const fetchColours = async (apiUrl: string): Promise<Record<string, string>> => {
	const response = await fetch(`${apiUrl}/graphql`, {
		method: `POST`,
		headers: { 'Content-Type': `application/json` },
		body: JSON.stringify({ query: `query { colours { name hex } }` }),
	}).then((res) => res.json());

	if (!response?.data?.colours) {
		throw new Error(`[vite.config] Failed to fetch colours from API - ${JSON.stringify(response?.errors ?? response)}`);
	}

	return Object.fromEntries(
		response.data.colours.map((colour: { name: string; hex: string }) => [colour.name, colour.hex])
	);
};

export default defineConfig(async ({ mode }) => {
	const env = loadEnv(mode, process.cwd(), ``);
	const colours = await fetchColours(env.API_URL);

	return {
		plugins: [
			sveltekit(),
			svg({
				includePaths: [`./src/lib/img`],
				svgoOptions: {
					plugins: [
						{
							name: `prefixIds`,
							params: {
								// Only scope gradient/mask ids per-file - class names (e.g. teeth.svg's
								// t_<fdi> selectors) are targeted directly by app code and must stay stable.
								prefixClassNames: false,
							},
						},
					]
				}
			}),
		],
		resolve: {
			alias: {
				'@mixins': path.resolve(`./src/lib/styles/mixins/index.css`),
				'@styles': path.resolve(`./src/lib/styles`),
			},
		},
		css: {
			postcss: {
				plugins: [
					advancedVariables({
						disable: `@import`,
						variables: {
							...colours,
							...variables,
						},
					}),
					hexrgba(),
					nesting({
						noIsPseudoSelector: true,
					}),
					mixins({
						mixinsDir: path.resolve(`./src/lib/styles/mixins`),
					}),
				],
			},
		},
	};
});
