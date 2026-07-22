import path from 'node:path';
import { defineConfig } from 'vitest/config';

// Deliberately standalone, not reusing vite.config.ts - that config does a
// live fetch to the real API at load time to generate colours.generated.css,
// which would make every unit test run network-dependent.
export default defineConfig({
	resolve: {
		alias: {
			'$lib': path.resolve(`./src/lib`),
			'$utils': path.resolve(`./src/lib/utils`),
			'$types': path.resolve(`./src/lib/types`),
			// $app/paths is normally a virtual module from the SvelteKit vite
			// plugin, which this config deliberately doesn't load (see above) -
			// stubbed so utils that call resolve() (e.g. searchResults.ts) are
			// still unit-testable. Extend src/test/mocks/app-paths.ts if a util
			// under test starts needing another $app/* export.
			'$app/paths': path.resolve(`./src/test/mocks/app-paths.ts`),
		},
	},
	test: {
		environment: `happy-dom`,
		include: [`src/**/*.test.ts`],
		// date-fns formatting in dateRanges.ts/schedule logic uses local time -
		// pin to UTC so date-boundary tests are deterministic across CI runners.
		env: { TZ: `UTC` },
	},
	define: {
		// Mirrors vite.config.ts's build-time SITE_TITLE substitution, since this
		// config doesn't reuse that one (see comment above).
		__SITE_TITLE__: JSON.stringify(`Test Site`),
	},
});
