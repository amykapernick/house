<script lang="ts">
	import PillRadio from '$parts/PillRadio/index.svelte';
	import { GIFT_TAGS } from '$utils/gifts';
	import styles from './index.module.css';

	// Tag picker for an idea or purchase: one of the kids' seven-gift theme or Santa, or none.
	let {
		id,
		tag = $bindable(``),
	}: {
		/** Prefix for the radio ids and group name, unique per form. */
		id: string;
		/** `` for no tag. */
		tag?: string;
	} = $props();

	const OPTIONS = [{ value: ``, label: `None` }, ...GIFT_TAGS];
</script>

<fieldset class={styles.tags}>
	<legend>Tag</legend>
	{#each OPTIONS as option (option.value)}
		<PillRadio
			id="{id}-{option.value || `none`}"
			name={id}
			label={option.label}
			value={option.value}
			bind:group={tag}
		/>
	{/each}
</fieldset>
