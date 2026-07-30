<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import type { BinCollection } from '$types/generated';

	let {
		bins,
		class: className = '',
	}: {
		bins: BinCollection[];
		class?: string;
	} = $props();

	// Mirrors the pattern-matching already used on the existing Home Assistant trash-card,
	// so icon/colour here agree with the one it's replacing. Anything not matched (an
	// unrecognised bin type, or the backend's raw-summary fallback) still renders, just
	// with a generic icon/colour rather than being dropped.
	const BIN_STYLES: { pattern: RegExp; icon: string; colour: string }[] = [
		{ pattern: /general bin/i, icon: '🗑️', colour: 'blue' },
		{ pattern: /recycling bin/i, icon: '♻️', colour: 'yellow_bright' },
		{ pattern: /green waste/i, icon: '🌳', colour: 'green_base' },
		{ pattern: /hard rubbish/i, icon: '🚛', colour: 'grey' },
	];
	const DEFAULT_STYLE = { icon: '🗑️', colour: 'purple' };

	const styleFor = (binType: string) => BIN_STYLES.find((s) => s.pattern.test(binType)) ?? DEFAULT_STYLE;
	const formatDate = (date: string) => format(parseISO(date), 'EEEE d MMMM');
</script>

<div class="bin-days {className}">
	{#if !bins.length}
		<p class="empty">No bin calendar found - tag it with the house_app label in Home Assistant.</p>
	{:else}
		<ul>
			{#each bins as bin (bin.binType)}
				{@const style = styleFor(bin.binType)}
				<li style="background: var(--{style.colour}); color: var(--{style.colour}_text);">
					<span
						class="icon"
						aria-hidden="true">{style.icon}</span
					>
					<div>
						<p class="type">{bin.binType}</p>
						<p class="date">{formatDate(bin.nextDate)}</p>
					</div>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.bin-days {
		display: flex;
	}

	.empty {
		color: var(--grey);
	}

	ul {
		display: flex;
		flex-wrap: wrap;
		width: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
		gap: 1em;

		& li {
			display: flex;
			flex: 1 1 200px;
			align-items: center;
			padding: 1em;
			border-radius: 0.6em;
			gap: 0.8em;

			& p {
				margin: 0;
			}

			& .type {
				font-weight: 700;
			}
		}
	}

	.icon {
		font-size: 1.6em;
	}
</style>
