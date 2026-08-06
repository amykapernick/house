<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import { DATE_FORMATS } from '$lib/utils/dateFormats';
	import type { Sleep } from '$types/smallHuman';
	import DebugJson from '$parts/DebugJson/index.svelte';
	import Chip from '$parts/Chip/index.svelte';
	import Cards from '$components/parts/Cards/index.svelte';
	import Card from '$components/parts/smallHuman/Card/index.svelte';
	import BaseCard from '$parts/Card/index.svelte';
	import Stats from '$components/parts/Stats/index.svelte';
	import Outfit from '$components/parts/smallHuman/Outfit/index.svelte';
	import OutfitIcon from '$components/parts/smallHuman/OutfitIcon/index.svelte';
	import styles from './index.module.css';

	const {
		sleep,
		class: className = '',
	}: {
		sleep: Sleep;
		class?: string;
	} = $props();

	// bedtime_temp/early_morning_temp are nullable - each tracker update only ever writes
	// whichever one matches the time of day it ran, so one can be missing until an update has
	// landed in both windows at least once.
	const formatTempRange = (a: number | null | undefined, b: number | null | undefined) => {
		if (a == null && b == null) return '—';
		if (a == null || b == null) return `${a ?? b}°C`;
		if (a > b) return `${b} - ${a}°C`;

		return `${a} - ${b}°C`;
	};
</script>

<div class={styles.overview}>
	<Chip
		label="Naps/day"
		value={sleep.current_pattern.naps}
		info={sleep.current_pattern.naps_transition}
	/>
	<Chip
		label="Nap Length"
		// TODO: Format nap range better
		value={`${sleep.current_pattern.nap_duration_range_min} - ${sleep.current_pattern.nap_duration_range_max}`}
		info={sleep.current_pattern.naps_transition}
	/>
	<Chip
		label="Total Daytime"
		// TODO: get actual number from api
		// value={sleep.current_pattern.naps}
		info={sleep.current_pattern.total_daytime_sleep_approx}
	/>
	<Chip
		label="Nap Cap"
		value={sleep.current_pattern.nap_cap ? 'Yes' : 'No'}
	/>
	<Chip
		label="Nap Cutoff"
		value={sleep.current_pattern.nap_cutoff}
	/>
	<Chip
		label="Bedtime"
		value={sleep.current_pattern.bedtime}
	/>
	<Chip
		label="Wake Time"
		value={sleep.current_pattern.naps}
		info={sleep.current_pattern.typical_wake}
	/>
</div>
<h3>Current Recommendation</h3>
<div>
	<p>{sleep.environment.current_recommendation.challenge}</p>
	<p>{sleep.environment.current_recommendation.strategy}</p>

	<Stats
		items={[
			{
				value: sleep.environment.current_recommendation.recommended_setup.sleep_sack_tog,
				name: 'tog',
				note: sleep.environment.current_recommendation.recommended_setup.reasoning,
			},
			{
				name: 'Layer',
				// TODO: Pass pjs_layer to outfit component
				Icon: OutfitIcon,
				note: sleep.environment.current_recommendation.recommended_setup.pj_layer,
			},
		]}
	/>
</div>
<h3>Sleep environment</h3>
<BaseCard theme="white">
	<p>{sleep.environment.note}</p>
	<dl class={styles.temp_range}>
		<dt>Bedtime temp range</dt>
		<dd>{formatTempRange(sleep.environment.bedroom_temp_pattern.bedtime_temp, sleep.environment.bedroom_temp_pattern.early_morning_temp)}</dd>
	</dl>
	<p>{sleep.environment.bedroom_temp_pattern.swing_note}</p>
</BaseCard>
{#if sleep.environment.forecast?.length}
	<h3>Forecast</h3>
	<!-- TODO: Check this data as tog seems to be 0 every night -->
	<Stats
		items={sleep.environment.forecast.map((night) => ({
			name: format(parseISO(night.date), DATE_FORMATS.dayName),
			value: String(night.sleep_sack_tog),
		}))}
	/>
{/if}
<h3>Notes</h3>
<Cards>
	{#each sleep.items as item (item.title)}
		<Card title={item.title}>
			<p>{item.detail}</p>
			{#if item.tag}
				<span>{item.tag}</span>
			{/if}
		</Card>
	{/each}
</Cards>
