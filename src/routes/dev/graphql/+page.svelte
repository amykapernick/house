<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { EditorView, basicSetup } from 'codemirror';
	import { keymap } from '@codemirror/view';
	import { graphql, updateSchema } from 'cm6-graphql';
	import { buildClientSchema, getIntrospectionQuery, type GraphQLSchema } from 'graphql';
	import { getToken, isAuthenticated } from '$lib/auth';
	import { getGraphqlUrl } from '$utils/fetchClientData';

	const DEFAULT_QUERY = `query {\n  \n}\n`;

	let editorEl: HTMLDivElement | undefined = $state();
	let view: EditorView | undefined;
	let schemaLoading = $state(true);
	let schemaError = $state<string | null>(null);
	let result = $state(``);
	let running = $state(false);

	async function runOperation(query: string) {
		const token = await getToken();
		const headers: Record<string, string> = { 'Content-Type': `application/json` };
		if (token) headers.Authorization = `Bearer ${token}`;

		const res = await fetch(getGraphqlUrl(), {
			method: `POST`,
			headers,
			body: JSON.stringify({ query }),
		});

		return res.json();
	}

	async function execute() {
		if (!view || running) return;
		running = true;
		try {
			const res = await runOperation(view.state.doc.toString());
			result = JSON.stringify(res, null, 2);
		}
		catch (err) {
			result = JSON.stringify(
				{ errors: [{ message: err instanceof Error ? err.message : `Request failed` }] },
				null,
				2
			);
		}
		running = false;
	}

	onMount(() => {
		if (!import.meta.env.DEV || !editorEl) return;

		view = new EditorView({
			doc: DEFAULT_QUERY,
			extensions: [
				basicSetup,
				graphql(),
				keymap.of([
					{
						key: `Mod-Enter`,
						run: () => {
							execute();
							return true;
						},
					},
				]),
				EditorView.theme({ '&': { height: `100%` }, '.cm-scroller': { overflow: `auto` } }),
			],
			parent: editorEl,
		});

		runOperation(getIntrospectionQuery())
			.then((res) => {
				if (res.errors) {
					schemaError = res.errors.map((e: { message: string }) => e.message).join(`, `);
					return;
				}
				const schema: GraphQLSchema = buildClientSchema(res.data);
				if (view) updateSchema(view, schema);
			})
			.catch((err) => {
				schemaError = err instanceof Error ? err.message : `Failed to reach the API`;
			})
			.finally(() => {
				schemaLoading = false;
			});
	});

	onDestroy(() => view?.destroy());
</script>

<svelte:head>
	<title>GraphQL Console | Kapers Crewe Household</title>
</svelte:head>

{#if !import.meta.env.DEV}
	<p>The GraphQL console is only available when running the app locally.</p>
{:else}
	<div class="console">
		<header class="toolbar">
			<h1>GraphQL Console</h1>
			<span class="status" data-ok={$isAuthenticated}>
				{$isAuthenticated ? `Authenticated` : `Not signed in`}
			</span>
			{#if schemaLoading}
				<span class="status">Loading schema...</span>
			{:else if schemaError}
				<span class="status" data-ok={false}>Schema unavailable: {schemaError}</span>
			{:else}
				<span class="status" data-ok={true}>Schema loaded</span>
			{/if}
			<button type="button" class="run" onclick={execute} disabled={running}>
				{#if running}
					Running...
				{:else}
					Run <kbd>Ctrl</kbd><kbd>⏎</kbd>
				{/if}
			</button>
		</header>
		<div class="panes">
			<div class="editor" bind:this={editorEl}></div>
			<pre class="result">{result || `Results will appear here.`}</pre>
		</div>
	</div>
{/if}

<style>
	@import '@mixins';

	.console {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 200px);
		min-height: 500px;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 1em;
		margin-bottom: 0.75em;

		& h1 {
			margin: 0;
			font-size: 1.3em;
		}
	}

	.status {
		padding: 0.2em 0.6em;
		border-radius: 1em;
		background: var(--neutral_light);
		color: var(--neutral_light_text);
		font-size: 0.8em;

		&[data-ok='true'] {
			background: var(--green_light);
			color: var(--green_light_text);
		}

		&[data-ok='false'] {
			background: var(--red);
			color: var(--red_text);
		}
	}

	.run {
		@include button;

		margin-left: auto;

		& kbd {
			padding: 0.1em 0.4em;
			margin-left: 0.3em;
			border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
			border-radius: 0.25em;
			font-family: inherit;
			font-size: 0.85em;
		}
	}

	.panes {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1em;
		flex: 1;
		min-height: 0;

		@media (width <= 60em) {
			grid-template-columns: 1fr;
		}
	}

	.editor {
		border: 1px solid var(--neutral_light);
		border-radius: 0.3em;
		overflow: hidden;
		font-size: 0.95em;
	}

	.result {
		margin: 0;
		padding: 1em;
		border: 1px solid var(--neutral_light);
		border-radius: 0.3em;
		background: var(--neutral_light);
		color: var(--neutral_light_text);
		overflow: auto;
		font-size: 0.85em;
		white-space: pre-wrap;
		word-break: break-word;
	}
</style>
