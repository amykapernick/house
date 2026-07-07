import path from 'path';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import svg from '@poppanator/sveltekit-svg';
import advancedVariables from 'postcss-advanced-variables';
import hexrgba from 'postcss-hexrgba';
import nesting from 'postcss-nesting';
import mixins from 'postcss-mixins';

const colours = (await import(`./src/lib/styles/config/colours.js`)).default;
const variables = (await import(`./src/lib/styles/config/variables.js`)).default;

export default defineConfig({
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
});
