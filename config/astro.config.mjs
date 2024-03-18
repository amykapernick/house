import { defineConfig } from 'astro/config';
import react from "@astrojs/react";
import node from '@astrojs/node';
import netlify from '@astrojs/netlify';

export default defineConfig({
	output: 'server',
	adapter: node({
		mode: 'middleware',
	}),
	vite: {
		css: {
			postcss: `./config`
		},
		resolve: {
			alias: [
				{
					find: '@mixins',
					replacement: `./src/styles/mixins/index.css`
				}
			]
		}
	},
	integrations: [
		react()
	],
});
