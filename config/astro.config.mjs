import { defineConfig } from 'astro/config'
import image from '@astrojs/image';

export default defineConfig({
	// your configuration options here...
	// https://docs.astro.build/en/reference/configuration-reference/
	// root: new URL('../', import.meta.url)
	vite: {
		css: {
			postcss: './config'
		}
	},
	integrations: [image()],
})