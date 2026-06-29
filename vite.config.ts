import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

const colours = (await import('./src/lib/styles/config/colours.js')).default;
const variables = (await import('./src/lib/styles/config/variables.js')).default;

export default defineConfig({
	plugins: [sveltekit()],
	resolve: {
		alias: {
			'@mixins': path.resolve('./src/lib/styles/mixins/index.css'),
			'@styles': path.resolve('./src/lib/styles'),
		},
	},
	css: {
		postcss: {
			plugins: [
				(await import('postcss-advanced-variables')).default({
					disable: '@import',
					variables: {
						...colours,
						...variables,
					},
				}),
				(await import('postcss-hexrgba')).default(),
				(await import('postcss-nesting')).default({
					noIsPseudoSelector: true,
				}),
				(await import('postcss-mixins')).default({
					mixinsDir: path.resolve('./src/lib/styles/mixins'),
				}),
			],
		},
	},
});
