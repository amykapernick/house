import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: `index.html`,
		}),
		alias: {
			'$components': `src/lib/components`,
			'$partials': `src/lib/components/partials`,
			'$parts': `src/lib/components/parts`,
			'$layouts': `src/lib/components/layouts`,
			'$utils': `src/lib/utils`,
			'$types': `src/lib/types`,
			'$data': `src/lib/data`,
			'$img': `src/lib/img`,
			'$styles': `src/lib/styles`
		}
	}
};

export default config;
