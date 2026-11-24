<script lang="ts">
	import { SvelteSet } from 'svelte/reactivity';
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import Select from '$parts/Select/index.svelte';
	import PillCheckbox from '$parts/PillCheckbox/index.svelte';
	import { giftMutation, OCCASION_TYPES, MONTHS } from '$utils/gifts';
	import type { GiftOccasion, GiftPerson } from '$types/generated';
	import styles from './index.module.css';

	// Kept deliberately small. Each occasion is one year's ("Christmas 2026"): birthdays are just
	// a month and the API puts them on the 1st of its next occurrence, everything else has a
	// date. The API also adds or corrects the year at the end of the name.

	let {
		open = $bindable(false),
		occasion = null,
		/** Preselected people for a new occasion (e.g. adding a birthday from someone's page). */
		presetPersonIds = [],
		people,
		onSaved,
	}: {
		open?: boolean;
		occasion?: GiftOccasion | null;
		presetPersonIds?: string[];
		people: GiftPerson[];
		onSaved: () => void;
	} = $props();

	let name = $state(``);
	let type = $state<string>(`birthday`);
	let date = $state(``);
	let month = $state(``);
	const selected = new SvelteSet<string>();
	let saving = $state(false);
	let deleting = $state(false);
	let error = $state(``);

	$effect(() => {
		if (!open) return;
		name = occasion?.name ?? ``;
		type = occasion?.type ?? `birthday`;
		date = occasion?.date ?? ``;
		month = occasion?.date ? String(Number(occasion.date.slice(5, 7))) : ``;
		selected.clear();
		for (const id of occasion?.personIds ?? presetPersonIds) selected.add(id);
		error = ``;
	});

	// Name a birthday after its person when nothing's been typed yet.
	function handlePeopleChange() {
		if (type !== `birthday` || name.trim() || selected.size !== 1) return;
		const person = people.find((entry) => selected.has(entry.id));
		if (person) name = `${person.name}'s birthday`;
	}

	let isBirthday = $derived(type === `birthday`);
	let monthOptions = $derived([{ value: ``, label: `Choose…` }, ...MONTHS.map((label, index) => ({ value: String(index + 1), label }))]);
	let valid = $derived(name.trim().length > 0 && (isBirthday ? Boolean(month) : /^\d{4}-\d{2}-\d{2}$/.test(date)));

	async function save() {
		saving = true;
		error = ``;

		const result = await giftMutation(`saveGiftOccasion`, `$id: ID, $input: GiftOccasionInput!`, `id: $id, input: $input`, {
			id: occasion?.id ?? null,
			input: {
				name: name.trim(),
				type,
				...(isBirthday ? { month: Number(month) } : { date }),
				personIds: [...selected],
			},
		});

		saving = false;

		if (!result.success) {
			error = result.message ?? `Couldn't save. Try again.`;
			return;
		}

		open = false;
		onSaved();
	}

	async function remove() {
		if (!occasion || !confirm(`Delete ${occasion.name}? Purchases logged against it are kept.`)) return;
		deleting = true;
		const result = await giftMutation(`deleteGiftOccasion`, `$id: ID!`, `id: $id`, { id: occasion.id });
		deleting = false;

		if (!result.success) {
			error = result.message ?? `Couldn't delete. Try again.`;
			return;
		}

		open = false;
		onSaved();
	}

	let actions: ModalAction[] = $derived([
		...(occasion ? [{ label: deleting ? `Deleting…` : `Delete`, onclick: remove, variant: `danger` as const, style: `secondary` as const, disabled: saving || deleting }] : []),
		{ label: `Cancel`, onclick: () => (open = false), style: `secondary`, disabled: saving || deleting },
		{ label: saving ? `Saving…` : `Save`, onclick: save, variant: `success`, disabled: !valid || saving || deleting },
	]);
</script>

<Modal
	bind:open
	title={occasion ? `Edit occasion` : `Add an occasion`}
	{actions}
>
	<div class={styles.fields}>
		<Select
			id="occasion-type"
			label="Type"
			bind:value={type}
			options={[...OCCASION_TYPES]}
		/>

		<fieldset class={styles.people}>
			<legend>Who for</legend>
			{#each people as person (person.id)}
				<PillCheckbox
					id="occasion-person-{person.id}"
					label={person.name}
					checked={selected.has(person.id)}
					onchange={() => {
						if (selected.has(person.id)) selected.delete(person.id);
						else selected.add(person.id);
						handlePeopleChange();
					}}
				/>
			{/each}
		</fieldset>

		<label for="occasion-name">Name</label>
		<input
			id="occasion-name"
			type="text"
			bind:value={name}
			placeholder={type === `christmas` ? `Christmas` : `e.g. Mum's birthday`}
			required
		/>

		{#if isBirthday}
			<Select
				id="occasion-month"
				label="Birthday month"
				bind:value={month}
				options={monthOptions}
			/>
		{:else}
			<label for="occasion-date">Date</label>
			<input
				id="occasion-date"
				type="date"
				bind:value={date}
				required
			/>
		{/if}
	</div>

	{#if error}<p
			class={styles.error}
			role="alert"
		>
			{error}
		</p>{/if}
</Modal>
