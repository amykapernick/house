<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import { differenceInDays, parseISO, format, addDays } from 'date-fns';
	import fetchClientData from '$utils/fetchClientData';
	import { getToken } from '$lib/auth';

	let data = $state<any>(null);
	let allergens = $state<any[]>([]);
	let loading = $state(true);

	const sections = [
		'meta', 'alerts', 'growth', 'feeding', 'teeth', 'car_seat',
		'swimming', 'milestones', 'auslan', 'sleep', 'sleep_environment',
		'clothing_seasonal', 'clothing_daytime', 'vaccinations',
		'parenting_approach', 'activities', 'sources',
		'toddler_sleep_prep', 'food_principles',
	];

	$effect(() => {
		if ($isAuthenticated) {
			fetchClientData({
				cacheKey: 'small-human',
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
								note erupted { id name erupted_age_months }
								teething_now teething_note
								expected_next { id name typical_age_months }
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
			}).then((res) => {
				data = res.smallHuman ?? null;
				loading = false;
			});

			fetchClientData({
				gqlQuery: `
					query {
						allergens {
							id name due isRecurring link
						}
					}
				`,
			}).then((res) => {
				allergens = res.allergens ?? [];
			});
		}
	});

	let sortedAllergens = $derived(
		[...allergens].sort((a, b) => {
			if (!a.due) return 1;
			if (!b.due) return -1;
			return parseISO(a.due).getTime() - parseISO(b.due).getTime();
		})
	);

	function allergenUrgency(due: string | null): 'red' | 'orange' | 'green' {
		if (!due) return 'green';
		const days = differenceInDays(parseISO(due), new Date());
		if (days <= 2) return 'red';
		if (days <= 4) return 'orange';
		return 'green';
	}

	function allergenDueLabel(due: string | null): string {
		if (!due) return '';
		const days = differenceInDays(parseISO(due), new Date());
		if (days < 0) return `${Math.abs(days)}d overdue`;
		if (days === 0) return 'today';
		if (days === 1) return 'tomorrow';
		return format(parseISO(due), 'EEE');
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

	function formatHeading(key: string) {
		return key.replaceAll('_', ' ');
	}
</script>

<svelte:head>
	<title>Small Human | Kapers Crewe Household</title>
</svelte:head>

<h1>Small Human</h1>

{#if allergens.length}
	<section class="allergens">
		<h2>Allergens</h2>
		<div class="allergen-list">
			{#each sortedAllergens as allergen}
				{@const urgency = allergenUrgency(allergen.due)}
				<button
					class="allergen-btn"
					data-urgency={urgency}
					disabled={completing.has(allergen.id)}
					onclick={() => completeAllergen(allergen.id)}
				>
					<span class="allergen-name">{allergen.name}</span>
					<span class="allergen-due">{allergenDueLabel(allergen.due)}</span>
				</button>
			{/each}
		</div>
	</section>
{/if}

{#if loading}
	<p>Loading...</p>
{:else if !data}
	<p>No data available</p>
{:else}
	{#each sections as section}
		{#if data[section]}
			<section>
				<h2>{formatHeading(section)}</h2>
				<pre><code>{JSON.stringify(data[section], null, 2)}</code></pre>
			</section>
		{/if}
	{/each}
{/if}

<style>
	@import '@mixins';

	.allergens {
		margin-bottom: 2em;
		padding-bottom: 1em;
		border-bottom: 1px solid var(--grey_light);
	}

	.allergen-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;
	}

	.allergen-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.6em 1em;
		border: 2px solid;
		border-radius: 0.4em;
		cursor: pointer;
		font-size: 0.9em;
		transition: opacity 0.15s;

		&:disabled {
			opacity: 0.4;
			cursor: wait;
		}

		&[data-urgency='red'] {
			border-color: var(--red, #e53e3e);
			background: rgba(229, 62, 62, 0.1);
			color: var(--red, #e53e3e);
		}

		&[data-urgency='orange'] {
			border-color: var(--orange);
			background: rgba($orange, 0.1);
			color: var(--orange);
		}

		&[data-urgency='green'] {
			border-color: var(--green);
			background: rgba($green, 0.1);
			color: var(--green);
		}

		&:hover:not(:disabled) {
			opacity: 0.7;
		}
	}

	.allergen-name {
		font-weight: 600;
	}

	.allergen-due {
		font-size: 0.75em;
		opacity: 0.8;
	}

	section {
		margin-bottom: 2em;
		padding-bottom: 1em;
		border-bottom: 1px solid var(--grey_light);
	}

	h2 {
		text-transform: capitalize;
	}

	pre {
		background: rgba($blue, 0.08);
		padding: 1em;
		border-radius: 0.3em;
		overflow-x: auto;
		font-size: 0.85em;
		line-height: 1.4;
	}
</style>
