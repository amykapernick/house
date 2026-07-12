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
		},
	},
	test: {
		environment: `happy-dom`,
		include: [`src/**/*.test.ts`],
		// date-fns formatting in dateRanges.ts/schedule logic uses local time -
		// pin to UTC so date-boundary tests are deterministic across CI runners.
		env: { TZ: `UTC` },
	},
});
