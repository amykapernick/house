<script lang="ts">
	import styles from '../PillCheckbox/index.module.css';

	// One choice in a group of pills, eg. picking a person. The radio version of PillCheckbox,
	// with the same look: wrap a set in a <fieldset> with a <legend> and give them one `name`.
	let {
		id,
		name,
		label,
		value,
		group = $bindable(),
		class: className = '',
		...rest
	}: {
		id: string;
		name: string;
		label: string;
		value: string;
		group: string;
		class?: string;
		[key: string]: unknown;
	} = $props();
</script>

<input
	type="radio"
	{id}
	{name}
	{value}
	bind:group
	class={styles.input}
	{...rest}
/>
<label
	for={id}
	class="{styles.pill} {className}">{label}</label
>
