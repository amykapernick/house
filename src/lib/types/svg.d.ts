import type { Component } from 'svelte';

// SVGs imported from src/lib/img are transformed into Svelte components
// by @poppanator/sveltekit-svg (configured via includePaths in vite.config.ts).
declare module '*.svg' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const content: any;
	export default content;
}

// Explicit component import — use when importing a single SVG as a component tag
declare module '*.svg?component' {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const content: Component<Record<string, any>>;
	export default content;
}
