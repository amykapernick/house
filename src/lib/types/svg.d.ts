import type { Component } from 'svelte';

// SVGs imported from src/lib/img are transformed into Svelte components
// by @poppanator/sveltekit-svg (configured via includePaths in vite.config.ts).
declare module '*.svg' {
	 
	const content: any;
	export default content;
}

// Explicit component import — use when importing a single SVG as a component tag
declare module '*.svg?component' {

	const content: Component<Record<string, any>>;
	export default content;
}

// Raw SVG markup as a string — use when embedding an icon inside HTML built
// as a plain string rather than mounting a real Svelte component.
declare module '*.svg?src' {
	const content: string;
	export default content;
}
