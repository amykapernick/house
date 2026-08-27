import type { Writable } from 'svelte/store';

export const LAYOUT_WIDTH_CONTEXT_KEY = Symbol(`layout-width-override`);

export type LayoutWidth = `normal` | `wide` | `full`;

export type LayoutWidthContext = Writable<LayoutWidth | undefined>;
