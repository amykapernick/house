<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import { format, addDays } from 'date-fns';
	import fetchClientData from '$utils/fetchClientData';
	import { getToken } from '$lib/auth';
	import Allergens from '$components/parts/smallHuman/Allergens.svelte';
	import Teeth from '$components/parts/smallHuman/Teeth.svelte';
	import Stats from '$components/parts/Stats.svelte';
	import Growth from '$components/parts/smallHuman/Growth.svelte';
	import Card from '$components/parts/Card.svelte';
	import Cards from '$components/parts/Cards.svelte';

	let data = $state<any>(null);
	let allergens = $state<any[]>([]);
	let loading = $state(true);


	$effect(() => {
		if ($isAuthenticated) {
		function handleSmallHuman(res: any) {
				data = res.smallHuman ?? null;
				loading = false;
			}
			fetchClientData({
				cacheKey: 'small-human',
				onStale: handleSmallHuman,
				gqlQuery: `
					query {
						smallHuman {
							meta {
								last_updated age_weeks age_display name birth_month summary_tags
							}
							alerts { id type title body }
							growth {
								note
								measurements { date height_cm weight_kg head_cm height_percentile weight_percentile head_percentile }
								trend_notes
							}
							feeding {
								summary {
									breastfeeds_per_day { value note }
									solid_meals_per_day { value note }
									water_per_day { value note }
									allergens { value note }
								}
								details { label value }
								feeding_schedule {
									source note current_stage
									stages {
										id label age_months_min age_months_max
										breastfeeds_per_day breastfeeds_note
										solid_meals_per_day solid_meals_note
										water_per_day_ml_max water_note
										milk_primary coming_changes
									}
									current { stage_id on_track notes }
								}
								sources
							}
							teeth {
								note possums_note teething_now teething_note
								teeth { fdi name status erupted_date erupted_age_months typical_eruption_months sources }
								dental_care { toothbrush toothpaste first_dental_visit sources }
							}
							car_seat { current_stage facing facing_note next_transition sources }
							swimming {
								current_skills { id name status note }
								upcoming_skills { id name status note }
								safety_note sources
							}
							milestones {
								note
								movement { id title status detail tag achieved_age_weeks textbook_age_weeks weeks_early sources }
								fine_motor { id title status detail tag achieved_age_weeks textbook_age_weeks weeks_early sources }
								development { id title status detail tag sources }
							}
							auslan { note signs { id name status tip } sources }
							sleep {
								framework
								current_pattern {
									naps_per_day nap_transition nap_duration_range_min nap_duration_range_max
									nap_duration_typical total_daytime_sleep_approx nap_cap nap_cutoff bedtime typical_wake
									night_waking_pattern suspected_cause notes
								}
								items { id title status detail tag sources }
							}
							sleep_environment {
								note
								bedroom_temp_pattern { bedtime_temp_c early_morning_temp_c swing_note }
								tog_reference { temp_range_c tog layer }
								current_recommendation { challenge strategy recommended_setup { sleep_sack_tog pj_layer reasoning } sources }
								current_sizes sleep_sacks_on_hand { tog sizes material note } size_watch
							}
							clothing_seasonal {
								note current_sizes size_nudge
								noongar_season { current current_period current_description next next_period next_description weeks_until_next }
								alerts { id type title body action weeks_ahead }
							}
							clothing_daytime {
								note layer_rule feet_rule
								sun_safety { uv_threshold_for_coverage note sources }
								indoor_reference { indoor_temp_c_min indoor_temp_c_max recommendation layers }
								outdoor_reference { feels_like_c_min feels_like_c_max recommendation layers extras }
								rain_suit { recommended trigger note }
								current_recommendation {
									generated_from_temp_c generated_from_feels_like_c last_updated
									indoor { summary layers { position type sleeve weight material } feet extras rain_suit }
									outdoor { summary layers { position type sleeve weight material } feet extras rain_suit }
								}
								forecast {
									date day_label temp_high_c temp_low_c feels_like_high_c feels_like_low_c
									conditions rain_expected uv_index
									indoor { summary layers { position type sleeve weight material } feet extras rain_suit }
									outdoor { summary layers { position type sleeve weight material } feet extras rain_suit }
								}
							}
							vaccinations { alert items { id name status detail date next_due } sources }
							parenting_approach { id title detail sources }
							activities { id title detail sources }
							sources { id name badge url desc priority approved approved_date notes }
							toddler_sleep_prep {
								note
								what_changes_from_baby_to_toddler { id title detail }
								transition_options_when_ready { id title detail }
								sources
							}
							food_principles {
								note core_philosophy
								current_and_ongoing { id title detail sources }
								toddler_forward_look { id title detail sources }
								sources
							}
						}
					}
				`,
			}).then(handleSmallHuman);

			function handleAllergens(res: any) { allergens = res.allergens ?? []; }
			fetchClientData({
				cacheKey: 'allergens',
				onStale: handleAllergens,
				gqlQuery: `
					query {
						allergens {
							id name due isRecurring link
						}
					}
				`,
			}).then(handleAllergens);
		}
	});

	const alertColours = {
		urgent: 'red',
		warning: 'orange',
		info: 'blue',
		ok: 'green'
	}

	let completing = $state<Set<string>>(new Set());

	async function completeAllergen(taskId: string) {
		completing = new Set([...completing, taskId]);
		const token = await getToken();

		await fetch('/api/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { completeTask(taskId: "${taskId}") { success } }`,
			}),
		}).then(r => r.json());

		const newDue = format(addDays(new Date(), 7), 'yyyy-MM-dd');
		allergens = allergens.map(a =>
			a.id === taskId ? { ...a, due: newDue } : a
		);
		const next = new Set(completing);
		next.delete(taskId);
		completing = next;
	}

</script>

<svelte:head>
	<title>Small Human | Kapers Crewe Household</title>
</svelte:head>

<h1>Small Human</h1>

<Allergens
	{allergens}
	{completeAllergen}
	{completing}
/>

{#if loading}
	<p>Loading...</p>
{:else if !data}
	<p>No data available</p>
{:else}
<h2>Overview</h2>
	<Stats items={[
		{ name: 'Last Updated', value: data.meta.last_updated, colour: 'blue_navy' },
		{ name: 'Age', value: data.meta.age_display, colour: 'blue_navy' },
	]} />
	<Cards>
		{#each data.alerts as alert}
			<Card
			title={alert.title}
				colour={alertColours[alert.type]}	
			>
				{alert.body}
			</Card>
		{/each}
		<Card
		title="Car Seat"
		>
			<p>{data.car_seat.facing_note}</p>
			<p>{data.car_seat.next_transition}</p>
		</Card>
	</Cards>
	<Growth growth={data.growth} />
	
	<Teeth teeth={data.teeth} />
	<section>
		<h2>Swimming</h2>
		<p>{data.swimming.safety_note}</p>
		<Cards>
			{#each data.swimming.upcoming_skills as m}
				<Card
				title={m.name}
				>
					<p>{m.note}</p>
					<span>{m.status}</span>
				</Card>
			{/each}
			{#each data.swimming.current_skills as m}
				<Card
				title={m.name}
				>
					<p>{m.note}</p>
					<span>{m.status}</span>
				</Card>
			{/each}
		</Cards>
	</section>
	<section>
		<h2>Milestones</h2>
		<p>{data.milestones.note}</p>
		<Cards>
			{#each data.milestones.movement as m}
				<Card
				title={m.title}
				>
					<p>{m.detail}</p>
					<span>{m.textbook_age_weeks}</span>
					<span>{m.status}</span>
					<span>{m.textbook_age_weeks}</span>
					<span>Movement</span>
				</Card>
			{/each}
			{#each data.milestones.fine_motor as m}
				<Card
				title={m.title}
				>
					<p>{m.detail}</p>
					<span>{m.textbook_age_weeks}</span>
					<span>{m.status}</span>
					<span>{m.textbook_age_weeks}</span>
					<span>Fine Movement</span>
				</Card>
			{/each}
			{#each data.milestones.development as m}
				<Card
				title={m.title}
				>
					<p>{m.detail}</p>
					<span>{m.status}</span>
					<span>Development</span>
				</Card>
			{/each}
		</Cards>
	</section>
	<section>
		<h2>Auslan</h2>
		<p>{data.auslan.note}</p>
		<Cards>
			{#each data.auslan.signs as s}
				<Card
				title={s.name}
				>
					<p>{s.tip}</p>
					<span>{s.status}</span>
				</Card>
			{/each}
		</Cards>
	</section>
	<section>
		<h2>Feeding</h2>
		<pre><code>{JSON.stringify(data.feeding, null, 2)}</code></pre>
	</section>
	<section>
		<h2>Sleep</h2>
		<pre><code>{JSON.stringify(data.sleep, null, 2)}</code></pre>
	</section>
	<section>
		<h2>Sleep Environment</h2>
		<pre><code>{JSON.stringify(data.sleep_environment, null, 2)}</code></pre>
	</section>
	<section>
		<h2>Clothing Seasonal</h2>
		<pre><code>{JSON.stringify(data.clothing_seasonal, null, 2)}</code></pre>
	</section>
	<section>
		<h2>Clothing Daytime</h2>
		<pre><code>{JSON.stringify(data.clothing_daytime, null, 2)}</code></pre>
	</section>
	<section>
		<h2>Vaccinations</h2>
		<p>{data.vaccinations.alert}</p>
		<Cards>
			{#each data.vaccinations.items as s}
				<Card
				title={s.name}
				>
					<p>{s.detail}</p>
					<span>{s.date}</span>
					<span>{s.next_due}</span>
					<span>{s.status}</span>
				</Card>
			{/each}
		</Cards>
	</section>
	<section>
		<h2>Parenting Approach</h2>
		<pre><code>{JSON.stringify(data.parenting_approach, null, 2)}</code></pre>
	</section>
	<section>
		<h2>Activities</h2>
		<Cards>
			{#each data.activities as a}
				<Card
				title={a.title}
				>
					<p>{a.detail}</p>
				</Card>
			{/each}
		</Cards>
	</section>
	<section>
		<h2>Toddler Sleep Prep</h2>
		<pre><code>{JSON.stringify(data.toddler_sleep_prep, null, 2)}</code></pre>
	</section>
	<section>
		<h2>Food Principles</h2>
		<pre><code>{JSON.stringify(data.food_principles, null, 2)}</code></pre>
	</section>
	<section>
		<h2>Sources</h2>
		<Cards>
			{#each data.sources as a}
				<Card
				title={a.name}
				>
					<p>{a.desc}</p>
					<p>{a.notes}</p>
					<a href={a.url} target="_blank">{a.url.replace('https://', '')}</a>
				</Card>
			{/each}
		</Cards>
	</section>
{/if}

<style>
	@import '@mixins';

	section {
		margin-bottom: 2em;
		padding-bottom: 1em;
		border-bottom: 1px solid var(--grey_light);
	}

	h2 {
		text-transform: capitalize;
	}

	pre {
		background: var(--blue);
		padding: 1em;
		border-radius: 0.3em;
		overflow-x: auto;
		font-size: 0.85em;
		line-height: 1.4;
	}

	.alerts {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;
		margin-bottom: 2em;
	}
</style>
