<script lang="ts">
	let { event }: { event: { text?: string; extendedProps?: Record<string, unknown> } } = $props();

	let type = $derived((event.extendedProps as { type?: string } | undefined)?.type);
	let icon = $derived(type === 'task' ? '☐' : type === 'event' ? '📅' : type === 'block' ? '' : '●');
</script>

<span>{#if icon}{icon} {/if}{event.text}</span>
