<script lang="ts">
	import NotionIcon from '$img/icons/notion.svg?component';

	const {
		icon,
		iconType,
	}: {
		icon?: string | null;
		iconType?: string | null;
	} = $props();
</script>

{#if iconType === `emoji` && icon}
	<span class="content-icon emoji" aria-hidden="true">{icon}</span>
{:else if icon}
	<img class="content-icon image" src={icon} alt="" />
{:else}
	<span class="content-icon fallback" aria-hidden="true"><NotionIcon /></span>
{/if}

<style>
	.content-icon {
		display: inline-flex;
		flex-shrink: 0;
		align-items: center;
		justify-content: center;
		width: 1.2em;
		height: 1.2em;

		&.emoji {
			font-size: 1.2em;
			line-height: 1;
		}

		&.image {
			object-fit: contain;
		}
	}
</style>
