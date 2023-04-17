import { defineConfig } from 'astro/config';
import image from '@astrojs/image';
import react from "@astrojs/react";

export default defineConfig({
	// your configuration options here...
	// https://docs.astro.build/en/reference/configuration-reference/
	// root: new URL('../', import.meta.url)
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
		image(),
		react()
	],
});
