<script lang="ts">
	// Add/edit form for one resource (a memo in the API's Memos Resources space). Saving goes
	// straight through the API, which writes the memo in its fixed format.
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import type { Resource } from '$types/resources';
	import {
		createResource,
		deleteResource,
		MAX_ICON_BYTES,
		readIconFile,
		updateResource,
		type ResourceIconUpload,
		type ResourceInput,
	} from '$utils/resources';
	import styles from './index.module.css';

	let {
		open = $bindable(false),
		resource = null,
		categories = [],
		onSaved,
	}: {
		open?: boolean;
		// null adds a new resource
		resource?: Resource | null;
		categories?: string[];
		onSaved: () => void;
	} = $props();

	let name = $state(``);
	let category = $state(``);
	let description = $state(``);
	let url = $state(``);
	let login = $state(``);
	let localUrl = $state(``);
	let archived = $state(false);

	// `iconText` is an emoji or image URL. An uploaded icon comes back from the API as a data:
	// URI, which is shown as a preview but never put in the text box.
	let iconText = $state(``);
	let iconPreview = $state<string | null>(null);
	let iconUpload = $state<ResourceIconUpload | null>(null);
	let iconChanged = $state(false);

	let saving = $state(false);
	let confirmingDelete = $state(false);
	let error = $state(``);

	const editing = $derived(Boolean(resource?.id));
	const valid = $derived(name.trim().length > 0);
	const listId = `resource-categories`;

	// Reset the form each time it opens.
	$effect(() => {
		if (!open) return;
		const icon = resource?.icon ?? ``;
		name = resource?.name ?? ``;
		category = typeof resource?.category === `string` ? resource.category : ``;
		description = resource?.description ?? ``;
		url = resource?.url ?? ``;
		login = resource?.login ?? ``;
		localUrl = resource?.localUrl ?? ``;
		archived = Boolean(resource?.archived);
		iconText = icon.startsWith(`data:`) ? `` : icon;
		iconPreview = icon.startsWith(`data:`) || icon.startsWith(`http`) ? icon : null;
		iconUpload = null;
		iconChanged = false;
		confirmingDelete = false;
		error = ``;
	});

	function onIconText() {
		iconChanged = true;
		iconUpload = null;
		iconPreview = /^https?:\/\//.test(iconText.trim()) ? iconText.trim() : null;
	}

	async function onIconFile(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		input.value = ``;
		if (!file) return;

		if (!file.type.startsWith(`image/`)) {
			error = `The icon has to be an image.`;
			return;
		}
		if (file.size > MAX_ICON_BYTES) {
			error = `That image is over 256 KB. Try a smaller one.`;
			return;
		}

		error = ``;
		iconUpload = await readIconFile(file);
		iconPreview = `data:${iconUpload.type};base64,${iconUpload.content}`;
		iconText = ``;
		iconChanged = true;
	}

	function removeIcon() {
		iconText = ``;
		iconPreview = null;
		iconUpload = null;
		iconChanged = true;
	}

	async function save() {
		saving = true;
		error = ``;

		const input: ResourceInput = {
			name: name.trim(),
			category: category.trim() || null,
			description: description.trim() || null,
			url: url.trim() || null,
			login: login.trim() || null,
			localUrl: localUrl.trim() || null,
			archived,
		};
		if (iconUpload) input.iconUpload = iconUpload;
		else if (!editing || iconChanged) input.icon = iconText.trim() || null;

		const result = editing ? await updateResource(resource!.id, input) : await createResource(input);
		saving = false;

		if (!result.ok) {
			error = result.message;
			return;
		}

		open = false;
		onSaved();
	}

	async function remove() {
		if (!confirmingDelete) {
			confirmingDelete = true;
			return;
		}

		saving = true;
		error = ``;
		const result = await deleteResource(resource!.id);
		saving = false;

		if (!result.ok) {
			error = result.message;
			return;
		}

		open = false;
		onSaved();
	}

	let actions: ModalAction[] = $derived([
		...(editing
			? [{
				label: confirmingDelete ? `Really delete?` : `Delete`,
				onclick: remove,
				style: `secondary` as const,
				variant: `danger` as const,
				disabled: saving,
			}]
			: []),
		{
			label: `Cancel`,
			onclick: () => (open = false),
			style: `secondary`,
			disabled: saving,
		},
		{
			label: saving ? `Saving…` : editing ? `Save` : `Add`,
			onclick: save,
			variant: `success`,
			disabled: !valid || saving,
		},
	]);
</script>

<Modal
	bind:open
	title={editing ? `Edit resource` : `Add resource`}
	{actions}
>
	<form
		class={styles.form}
		onsubmit={(e) => {
			e.preventDefault();
			if (valid && !saving) save();
		}}
	>
		<div class={styles.field}>
			<label for="resource-name">Name</label>
			<input
				id="resource-name"
				type="text"
				required
				bind:value={name}
				disabled={saving}
			/>
		</div>

		<div class={styles.field}>
			<label for="resource-category">Category</label>
			<input
				id="resource-category"
				type="text"
				list={listId}
				placeholder="e.g. Smart Home"
				bind:value={category}
				disabled={saving}
			/>
			<datalist id={listId}>
				{#each categories as option (option)}
					<option value={option}></option>
				{/each}
			</datalist>
		</div>

		<div class={styles.field}>
			<label for="resource-description">Notes</label>
			<textarea
				id="resource-description"
				rows="3"
				bind:value={description}
				disabled={saving}
			></textarea>
		</div>

		<div class={styles.field}>
			<label for="resource-url">Website</label>
			<input
				id="resource-url"
				type="text"
				inputmode="url"
				placeholder="https://… or /reference/…"
				bind:value={url}
				disabled={saving}
			/>
		</div>

		<div class={styles.field}>
			<label for="resource-login">1Password link</label>
			<input
				id="resource-login"
				type="text"
				inputmode="url"
				placeholder="https://start.1password.com/…"
				bind:value={login}
				disabled={saving}
			/>
		</div>

		<div class={styles.field}>
			<label for="resource-local">Local URL</label>
			<input
				id="resource-local"
				type="text"
				inputmode="url"
				placeholder="http://192.168.…"
				bind:value={localUrl}
				disabled={saving}
			/>
		</div>

		<div class={styles.field}>
			<label for="resource-icon">Icon</label>
			<div class={styles['icon-row']}>
				{#if iconPreview}
					<img
						class={styles.preview}
						src={iconPreview}
						alt=""
					/>
				{/if}
				<input
					id="resource-icon"
					type="text"
					placeholder={iconUpload || iconPreview?.startsWith(`data:`) ? `Uploaded image` : `Emoji or image URL`}
					bind:value={iconText}
					oninput={onIconText}
					disabled={saving}
				/>
				<label class={styles.upload}>
					Upload
					<input
						type="file"
						accept="image/*"
						onchange={onIconFile}
						disabled={saving}
					/>
				</label>
				{#if iconText || iconPreview}
					<button
						type="button"
						class={styles.remove}
						onclick={removeIcon}
						disabled={saving}>Remove</button
					>
				{/if}
			</div>
		</div>

		<label class={styles.checkbox}>
			<input
				type="checkbox"
				bind:checked={archived}
				disabled={saving}
			/>
			Archived
		</label>

		{#if error}<p class={styles.error}>{error}</p>{/if}
	</form>
</Modal>
