<script lang="ts">
	import styles from './index.module.css';

	let {
		id,
		label,
		count,
		checked = $bindable(false),
		onchange,
		class: className = '',
		...rest
	}: {
		id: string;
		label: string;
		/** Rendered as smaller, de-emphasised secondary text after the label - eg. an item count. */
		count?: number | string;
		checked?: boolean;
		onchange?: () => void;
		class?: string;
		[key: string]: unknown;
	} = $props();
</script>

<!--
	The checkbox stays in the DOM (visually hidden, not display:none) so this
	stays a real, focusable/keyboard-operable checkbox - only its own box is
	hidden, the sibling label is what's actually shown as the pill. Colour is
	themed per-use via --pill_colour/--pill_text (defaults to the app's purple),
	the same custom-property-override pattern as the button mixins.
-->
<input
	type="checkbox"
	{id}
	bind:checked
	{onchange}
	class={styles.input}
	{...rest}
/>
<label for={id} class="{styles.pill} {className}">
	{label}
	{#if count !== undefined}<span class={styles.count}>{count}</span>{/if}
</label>
