<script lang="ts">
	import type { Sleep } from '$types/smallHuman';
	import DebugJson from '$parts/DebugJson.svelte';
	import Chip from '$parts/Chip.svelte';
	import Cards from '$components/parts/Cards.svelte';
	import Card from '$components/parts/smallHuman/Card.svelte';
	import BaseCard from '$parts/Card.svelte';
	import Stats from '$components/parts/Stats.svelte';
	import Onesie from '$img/smallHuman/onesie-long.svg?component';

	const {
		sleep,
		class: className = '',
	}: {
		sleep: Sleep;
		class?: string;
	} = $props();

	const formatTempRange = (a, b) => {
		if (a > b) return `${b} - ${a}°C`;

		return `${a} - ${b}°C`;
	};
</script>

<div class="overview">
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

	<BaseCard>
		<Stats
			items={[
				{
					value: sleep.environment.current_recommendation.recommended_setup.sleep_sack_tog,
					name: 'tog',
				},
				{
					// TODO: Add icon selection based on layer
					name: 'Layer',
					Icon: Onesie,
					note: sleep.environment.current_recommendation.recommended_setup.pj_layer,
				},
			]}
		/>
		<p>{sleep.environment.current_recommendation.recommended_setup.reasoning}</p>
	</BaseCard>
</div>
<h3>Sleep environment</h3>
<BaseCard>
	<p>{sleep.environment.note}</p>
	<dl>
		<dt>Bedtime temp range</dt>
		<dd>{formatTempRange(sleep.environment.bedroom_temp_pattern.bedtime_temp_c, sleep.environment.bedroom_temp_pattern.early_morning_temp_c)}</dd>
	</dl>
	<p>{sleep.environment.bedroom_temp_pattern.swing_note}</p>
</BaseCard>
<h3>TOG Reference</h3>
<table>
	<thead>
		<tr>
			<th>Room Temp</th>
			<th>TOG</th>
			<th>Layer</th>
		</tr>
	</thead>
	<tbody>
		{#each sleep.environment.tog_reference as tog}
			<tr>
				<td>{tog.temp_range_c}°C</td>
				<td>{tog.tog}</td>
				<td>{tog.layer}</td>
			</tr>
		{/each}
	</tbody>
</table>
<h3>Notes</h3>
<Cards>
	{#each sleep.items as item}
		<Card title={item.title}>
			<p>{item.detail}</p>
			{#if item.tag}
				<span>{item.tag}</span>
			{/if}
		</Card>
	{/each}
</Cards>

<DebugJson
	data={sleep}
	class={className}
/>

<style>
	.overview {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, max-content));
		gap: 1em;
	}
</style>
