<script lang="ts">
	import NotionIcon from '$img/icons/notion.svg?component';
	import styles from './index.module.css';

	const {
		icon,
		iconType,
		class: className = '',
	}: {
		icon?: string | null;
		iconType?: string | null;
		class?: string;
	} = $props();
</script>

{#if iconType === `emoji` && icon}
	<span class={[styles['content-icon'], styles.emoji, className]} aria-hidden="true">{icon}</span>
{:else if icon}
	<img class={[styles['content-icon'], styles.image, className]} src={icon} alt="" />
{:else}
	<span class={[styles['content-icon'], 'fallback', className]} aria-hidden="true"><NotionIcon /></span>
{/if}
