import type { Snippet } from 'svelte';
import type { Writable } from 'svelte/store';

export const TITLE_CONTEXT_KEY = Symbol(`layout-title`);

export type TitleValue = { content: Snippet; actions?: Snippet };

export type TitleContext = Writable<TitleValue | undefined>;
