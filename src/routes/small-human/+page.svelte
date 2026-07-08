<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import { format, addDays, formatDate, isWithinInterval, addWeeks, differenceInWeeks } from 'date-fns';
	import fetchClientData, { setCache } from '$utils/fetchClientData';
	import { getToken } from '$lib/auth';
	import type { Colour } from '$types/global';
	import Allergens from '$parts/smallHuman/Allergens.svelte';
	import Teeth from '$parts/smallHuman/Teeth.svelte';
	import Stats from '$parts/Stats.svelte';
	import Growth from '$parts/smallHuman/Growth.svelte';
	import Card from '$parts/Card.svelte';
	import Cards from '$parts/Cards.svelte';
	import Pill from '$parts/Pill.svelte';
	import type { Alert, AlertType, MilestoneStatus, SignStatus, ValueNote } from '$types/generated';
	import Milestone from '$parts/smallHuman/Milestone.svelte';
	import Auslan from '$parts/smallHuman/Auslan.svelte';
	import Breasts from '$img/icons/breasts.svg?component'
	import Water from '$img/icons/glass-water.svg?component'
	import Food from '$img/icons/soup.svg?component'
	import type { Component } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let data = $state<any>(null);
	let allergens = $state<any[]>([]);
	let loading = $state(true);

	function formatValueNote({ value, unit, note }: ValueNote): string {
		if (!value?.length) return note;
		const joined = value.length > 1 ? `${Math.min(...value)}-${Math.max(...value)}` : `${value[0]}`;
		return unit ? `${joined} ${unit}` : joined;
	}


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
							overview {
								last_updated age_weeks age_months birth_month
							}
							alerts(orderBy: urgency) { id level title detail }
							growth {
								last_updated check_frequency note trend_notes
								measurements {
									date
									height { value percentile unit }
									weight { value percentile unit }
									head { value percentile unit }
								}
							}
							feeding {
								last_updated check_frequency
								details { label value }
								schedule {
									source note
									stages {
										id title expected_age
										breastfeeds { value unit note }
										solid_meals { value unit note }
										water { value unit note }
										upcoming
									}
									upcoming
								}
								sources
								principles {
									note core_philosophy
									current_and_ongoing { id title detail sources }
									toddler_forward_look { id title detail sources }
									sources
								}
							}
							teeth {
								last_updated check_frequency note possums_note teething_now teething_note
								teeth { fdi name status erupted_date erupted_age_months expected_months sources }
								dental_care { toothbrush toothpaste note todoist_task { id name status due link } sources }
							}
							swimming {
								last_updated check_frequency
								skills { id title status detail }
								note sources
							}
							milestones {
								last_updated check_frequency note
								items { id category title status detail achieved_date expected_weeks expected_months sources }
							}
							auslan {
								last_updated check_frequency note sources
								signs {
									id name status tip
									reference { url video note}
								}
							}
							sleep {
								last_updated check_frequency framework
								current_pattern {
									naps nap_transition nap_duration_range_min nap_duration_range_max
									nap_duration_typical total_daytime_sleep_approx nap_cap nap_cutoff bedtime typical_wake
									night_waking_pattern suspected_cause note
								}
								items { id title status detail tag sources }
								environment {
									note
									bedroom_temp_pattern { bedtime_temp_c early_morning_temp_c swing_note }
									tog_reference { temp_range_c tog layer }
									current_recommendation { challenge strategy recommended_setup { sleep_sack_tog pj_layer reasoning } sources }
									current_sizes sleep_sacks_on_hand { tog sizes material note } size_watch
								}
							}
							clothing {
								seasonal {
									note current_sizes current_sizes_note
									noongar_season { current current_period current_description next next_period next_description weeks_until_next }
									alerts { id type title detail action weeks_ahead }
								}
								daytime {
									note layer_rule feet_rule
									sun_safety { uv_threshold_for_coverage note sources }
									indoor_reference { indoor_temp_c_min indoor_temp_c_max recommendation layers }
									outdoor_reference { feels_like_c_min feels_like_c_max recommendation layers extras }
									rain_suit { recommended trigger note }
									current_recommendation {
										generated_from_temp_c generated_from_feels_like_c last_updated
										indoor { summary layers { position type sleeve weight material } feet extras { hat hat_reason beanie mittens sunscreen sunscreen_reason } rain_suit }
										outdoor { summary layers { position type sleeve weight material } feet extras { hat hat_reason beanie mittens sunscreen sunscreen_reason } rain_suit }
									}
									forecast {
										date day_label temp_high_c temp_low_c feels_like_high_c feels_like_low_c
										conditions rain_expected uv_index
										indoor { summary layers { position type sleeve weight material } feet extras { hat hat_reason beanie mittens sunscreen sunscreen_reason } rain_suit }
										outdoor { summary layers { position type sleeve weight material } feet extras { hat hat_reason beanie mittens sunscreen sunscreen_reason } rain_suit }
									}
								}
							}
							vaccinations { note items(orderBy: due_date) { id title status detail date next_due todoist_task { id name status due link } } sources }
							notes {
								__typename
								... on CarSeat {
									name last_updated check_frequency current_stage facing facing_note next_transition sources
								}
								... on ParentingApproachNote {
									name
									parentingApproachItems: items { id title detail sources }
								}
								... on ToddlerSleepPrepNote {
									name
									toddlerSleepPrepDetail: items {
										note trigger_age_weeks status
										alert_when_due { id level title detail }
										reading { id title note sources }
										sources
									}
								}
							}
							activities { id title status detail sources }
							sources { id name badge url detail priority approved note }
						}
					}
				`,
			}).then(handleSmallHuman);

			function handleAllergens(res: any) { allergens = res.allergens ?? []; }
			const today = format(new Date(), 'yyyy-MM-dd');
			fetchClientData({
				cacheKey: `allergens-${today}`,
				onStale: handleAllergens,
				gqlQuery: `
					query {
						allergens(today: "${today}") {
							id name due isRecurring link urgency daysUntilDue
						}
					}
				`,
			}).then(handleAllergens);
		}
	});

	const alertColours: Record<AlertType, Colour> = {
		urgent: 'red',
		warn: 'orange',
		info: 'blue',
		ok: 'green',
	}

	let completing = new SvelteSet<string>();

	async function completeAllergen(taskId: string) {
		completing.add(taskId);
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
		completing.delete(taskId);
	}

	async function updateStatus({
		mutation,
		fields,
		id,
		status,
		sectionKey,
		itemsKey,
	}: {
		mutation: string;
		fields: string;
		id: string;
		status: string;
		sectionKey: string;
		itemsKey: string;
	}) {
		const token = await getToken();

		const res = await fetch('/api/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { ${mutation}(id: "${id}", status: ${status}) { ${fields} } }`,
			}),
		}).then(r => r.json());

		const updated = res?.data?.[mutation];
		if (!updated) return;

		data = {
			...data,
			[sectionKey]: {
				...data[sectionKey],
				[itemsKey]: data[sectionKey][itemsKey].map((item: any) =>
					item.id === updated.id ? { ...item, ...updated } : item
				),
			},
		};
		setCache('small-human', { smallHuman: data });
	}

	const updateMilestoneStatus = (id: string, status: MilestoneStatus) =>
		updateStatus({ mutation: 'updateMilestoneStatus', fields: 'id status achieved_date', id, status, sectionKey: 'milestones', itemsKey: 'items' });

	const updateSwimSkillStatus = (id: string, status: MilestoneStatus) =>
		updateStatus({ mutation: 'updateSwimSkillStatus', fields: 'id status', id, status, sectionKey: 'swimming', itemsKey: 'skills' });

	const updateAuslanSignStatus = (id: string, status: SignStatus) =>
		updateStatus({ mutation: 'updateAuslanSignStatus', fields: 'id status', id, status, sectionKey: 'auslan', itemsKey: 'signs' });

	async function markToothErupted(fdi: number) {
		const token = await getToken();

		const res = await fetch('/api/graphql', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { markToothErupted(fdi: ${fdi}) { fdi status erupted_date } }`,
			}),
		}).then(r => r.json());

		const updated = res?.data?.markToothErupted;
		if (!updated) return;

		data = {
			...data,
			teeth: {
				...data.teeth,
				teeth: data.teeth.teeth.map((t: any) =>
					t.fdi === updated.fdi ? { ...t, ...updated } : t
				),
			},
		};
		setCache('small-human', { smallHuman: data });
	}

	const ageDisplay = $derived.by(() => {
		const ageWeeks = data?.overview?.age_weeks;
		const ageMonths = data?.overview?.age_months;
		if (ageWeeks == null || ageMonths == null) return '';
		const wholeMonths = Math.floor(ageMonths);
		const remainingWeeks = Math.round(ageWeeks - (wholeMonths * 52) / 12);
		return wholeMonths > 0
			? `${wholeMonths} month${wholeMonths !== 1 ? 's' : ''} ${remainingWeeks} week${remainingWeeks !== 1 ? 's' : ''}`
			: `${ageWeeks} week${ageWeeks !== 1 ? 's' : ''}`;
	});

	const sortedMilestones = $derived.by(() => {
		const items = data?.milestones?.items ?? [];
		return [...items].sort((a, b) => {
			const aWeek = a.expected_weeks?.[0] ?? Infinity;
			const bWeek = b.expected_weeks?.[0] ?? Infinity;
			return aWeek - bWeek;
		});
	});

	const feedingStage = $derived({
		current: data?.feeding?.schedule?.stages?.find((s: any) => s.id === data.feeding.schedule.upcoming?.[0]),
		upcoming: data?.feeding?.schedule?.stages?.find((s: any) => s.id === data.feeding.schedule.upcoming?.[1])
	})

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
	{@const {
		overview,
		alerts,
		growth,
		teeth,
		swimming,
		milestones,
		auslan,
		feeding,
		sleep,
		clothing,
		vaccinations,
		notes,
		activities,
		sources,
	} = data}
	{@const car_seat = notes.find((n: any) => n.__typename === 'CarSeat')}
	{@const parenting_approach = notes.find((n: any) => n.__typename === 'ParentingApproachNote')?.parentingApproachItems ?? []}
	{@const toddler_sleep_prep = notes.find((n: any) => n.__typename === 'ToddlerSleepPrepNote')?.toddlerSleepPrepDetail}
	{@const sleep_environment = sleep.environment}
	{@const clothing_seasonal = clothing.seasonal}
	{@const clothing_daytime = clothing.daytime}
	{@const food_principles = feeding.principles}

	<h2 id="overview">Overview</h2>

	<Stats items={[
		{ name: 'Last Updated', value: overview.last_updated, colour: 'blue_navy' },
		{ name: 'Age', value: ageDisplay, colour: 'blue_navy' },
	]} />
	<Cards>
		{#each alerts as alert (alert.id)}
			<Card {...alert} colour={alertColours[alert.level]}>
				<p>{alert.detail}</p>
			</Card>
		{/each}
		<Card title="Car Seat">
			<p>{car_seat.facing_note}</p>
			<p>{car_seat.next_transition}</p>
		</Card>
	</Cards>

	<details name="section">
		<summary><h2>Growth</h2></summary>
		<Growth {growth} />
	</details>

	<details name="section">
		<summary><h2>Teeth</h2></summary>
		<Teeth {teeth} onMarkErupted={markToothErupted} />
	</details>

	<details name="section">
		<summary><h2>Swimming</h2></summary>
		<p>{swimming.note}</p>
		<Cards>
			{#each swimming.skills as m (m.id)}
				<Milestone {...m} onStatusChange={updateSwimSkillStatus} />
			{/each}
		</Cards>
	</details>
	<details name="section">
		<summary><h2 id="milestones">Milestones</h2></summary>
		<p>{milestones.note}</p>
		<Cards>
			{#each sortedMilestones as m (m.id)}
				<Milestone {...m} type={m.category} onStatusChange={updateMilestoneStatus} />
			{/each}
		</Cards>
	</details>
	<details name="section">
		<summary><h2 id="auslan">Auslan</h2></summary>
		<p>{auslan.note}</p>
		<Cards>
			{#each auslan.signs as s (s.id)}
				<Auslan {...s} onStatusChange={updateAuslanSignStatus} />
			{/each}
		</Cards>
	</details>
	<details name="section">
		<summary><h2 id="feeding">Feeding</h2></summary>
		{#if feedingStage.current}
			<h3>Current Stage - {feedingStage.current.title}</h3>
			<Stats
				items={[
					{
						name: 'Breastfeeds',
						value: formatValueNote(feedingStage.current.breastfeeds),
						Icon: Breasts
					},
					{
						name: 'Solid Meals',
						value: formatValueNote(feedingStage.current.solid_meals),
						Icon: Food
					},
					{
						name: 'Water',
						value: formatValueNote(feedingStage.current.water),
						Icon: Water
					}
				]}
			/>
		{/if}
		{#if feedingStage.upcoming}
			<h3>Upcoming Stage - {feedingStage.upcoming.title}</h3>
			<Stats
				items={[
					{
						name: 'Breastfeeds',
						value: formatValueNote(feedingStage.current.breastfeeds),
						Icon: Breasts
					},
					{
						name: 'Solid Meals',
						value: formatValueNote(feedingStage.current.solid_meals),
						Icon: Food
					},
					{
						name: 'Water',
						value: formatValueNote(feedingStage.current.water),
						Icon: Water
					}
				]}
			/>
		{/if}
		<pre><code>{JSON.stringify(feeding, null, 2)}</code></pre>
	</details>
	<details name="section">
		<summary><h2>Sleep</h2></summary>
		<pre><code>{JSON.stringify(sleep, null, 2)}</code></pre>
	</details>
	<details name="section">
		<summary><h2>Sleep Environment</h2></summary>
		<pre><code>{JSON.stringify(sleep_environment, null, 2)}</code></pre>
	</details>
	<details name="section">
		<summary><h2>Clothing Seasonal</h2></summary>
		<pre><code>{JSON.stringify(clothing_seasonal, null, 2)}</code></pre>
	</details>
	<details name="section">
		<summary><h2>Clothing Daytime</h2></summary>
		<pre><code>{JSON.stringify(clothing_daytime, null, 2)}</code></pre>
	</details>
	<details name="section">
		<summary><h2>Vaccinations</h2></summary>
		<p>{vaccinations.note}</p>
		<Cards>
			{#each vaccinations.items as v (v.id)}
				<Card
					title={v.title}
					icon={v.todoist_task ? 'calendar' : 'vaccine'}
					footer={v.todoist_task && formatDate(new Date(v.todoist_task.due), 'dd MMM')}
				>
					<p>{v.detail}</p>
				</Card>
			{/each}
		</Cards>
	</details>
	<details name="section">
		<summary><h2>Parenting Approach</h2></summary>
		<Cards>
			{#each parenting_approach as a (a.id)}
				<Card
				title={a.title}
				>
					<p>{a.detail}</p>
				</Card>
			{/each}
		</Cards>
	</details>
	<details name="section">
		<summary><h2>Activities</h2></summary>
		<Cards>
			{#each activities as a (a.id)}
				<Card
				title={a.title}
				>
					<p>{a.detail}</p>
				</Card>
			{/each}
		</Cards>
	</details>
	<details name="section">
		<summary><h2>Toddler Sleep Prep</h2></summary>
		<p>{toddler_sleep_prep.note}</p>
		{#if toddler_sleep_prep.status === 'due'}
			<Card
				title={toddler_sleep_prep.alert_when_due.title}
				colour={alertColours[toddler_sleep_prep.alert_when_due.level as AlertType]}
			>
				<p>{toddler_sleep_prep.alert_when_due.detail}</p>
			</Card>
		{:else}
			<Pill colour="blue">Not yet due</Pill>
		{/if}
		<h3>Reading</h3>
		{#each toddler_sleep_prep.reading as i (i.id)}
			<h4>{i.title}</h4>
			<p>{i.note}</p>
		{/each}
	</details>
	<details name="section">
		<summary><h2>Food Principles</h2></summary>
		<p>{food_principles.core_philosophy}</p>
		<p>{food_principles.note}</p>
		<h3>Current Principles</h3>
		{#each food_principles.current_and_ongoing as i (i.id)}
			<h4>{i.title}</h4>
			<p>{i.detail}</p>
		{/each}
		<h3>What to expect from a toddler</h3>
		{#each food_principles.toddler_forward_look as i (i.id)}
			<h4>{i.title}</h4>
			<p>{i.detail}</p>
		{/each}
	</details>
	<details name="section">
		<summary><h2>Sources</h2></summary>
		{#each sources as s (s.id)}
			<h3>{s.name}</h3>
			<p>{s.detail}</p>
			{#if s.note}<p>{s.note}</p>{/if}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- s.url is an external reference source, not an internal route -->
			<a href={s.url} target="_blank">{s.url.replace('https://', '')}</a>
		{/each}
	</details>
{/if}

<style>
	@import '@mixins';

	h2 {
		text-transform: capitalize;
	}

	pre {
		background: var(--blue);
		color: var(--blue_text);
		padding: 1em;
		border-radius: 0.3em;
		overflow-x: auto;
		font-size: 0.85em;
		line-height: 1.4;
	}

	summary {
		cursor: pointer;

		& h2 {
			display: inline;
			margin: 0;
			font-size: 1em;
		}

		&:has(h2) {
			color: var(--navy);
			font-size: 1.5em;
			margin-top: 1em;
		}
	}
</style>
