<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MilestoneStatus, SignStatus, VaccinationStatus } from '$types/generated';

	type PillStatus = 'error' | 'warning' | 'success' | 'info';
	type DomainStatus = MilestoneStatus | SignStatus | VaccinationStatus;

	// Maps domain-specific statuses (milestones, signs, vaccinations) onto the four visual Pill statuses,
	// mirroring the groupings StatusSelect.svelte uses for the same statuses.
	const statusMap: Record<DomainStatus, PillStatus> = {
		done: 'success',
		signing_occasionally: 'success',
		in_progress: 'info',
		recognises: 'info',
		watch: 'warning',
		coming_soon: 'warning',
		upcoming: 'warning',
		introduce_next: 'warning',
	};

	const {
		children,
		status,
		outline = false,
		class: className = '',
	}: {
		children: Snippet;
		status?: PillStatus | DomainStatus;
		outline?: boolean;
		class?: string;
	} = $props();

	const resolvedStatus = $derived(status && status in statusMap ? statusMap[status as DomainStatus] : (status as PillStatus | undefined));
</script>

<div
	class={className}
	class:outline
	style={`--pill_colour: var(--${resolvedStatus ?? 'purple_bright'}); --pill_background: var(--${resolvedStatus ?? 'purple_bright'}_bg)`}
>
	{@render children()}
</div>

<style>
	div {
		display: flex;
		justify-content: start;
		width: auto;
		max-width: max-content;
		padding: 0.5em 1em;
		border-radius: 2em;
		background: var(--pill_background);
		color: var(--pill_colour);
		font-size: 0.8em;
		font-weight: 700;

		&.outline {
			border: 1px solid currentColor;
			background: none;
			font-weight: 600;
		}
	}
</style>
