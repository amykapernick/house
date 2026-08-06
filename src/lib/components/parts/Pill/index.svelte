<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { MilestoneStatus, SignStatus, VaccinationStatus } from '$types/generated';
	import styles from './index.module.css';

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
	class={[styles.root, className, outline && styles.outline]}
	style={`--pill_colour: var(--${resolvedStatus ?? 'purple_bright'}); --pill_background: var(--${resolvedStatus ?? 'purple_bright'}_bg)`}
>
	{@render children()}
</div>
