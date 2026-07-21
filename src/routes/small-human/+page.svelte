<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import { format, addDays, formatDate, isWithinInterval, addWeeks, differenceInWeeks } from 'date-fns';
	import fetchClientData, { setCache, getGraphqlUrl } from '$utils/fetchClientData';
	import { getToken } from '$lib/auth';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Colour } from '$types/global';
	import Allergens from '$parts/smallHuman/Allergens.svelte';
	import Teeth from '$parts/smallHuman/Teeth.svelte';
	import Stats from '$parts/Stats.svelte';
	import Growth from '$parts/smallHuman/Growth.svelte';
	import Card from '$parts/Card.svelte';
	import Cards from '$parts/Cards.svelte';
	import Pill from '$parts/Pill.svelte';
	import Tabs from '$parts/Tabs.svelte';
	import Modal from '$parts/Modal.svelte';
	import type { ModalAction } from '$parts/Modal.svelte';
	import type { Alert, AlertType, MilestoneStatus, SignStatus, ValueNote } from '$types/generated';
	import Milestone from '$parts/smallHuman/Milestone.svelte';
	import Auslan from '$parts/smallHuman/Auslan.svelte';
	import UrgentAlerts from '$parts/smallHuman/UrgentAlerts.svelte';
	import Skeleton from '$parts/Skeleton.svelte';
	import EmptyState from '$parts/EmptyState.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import Breasts from '$img/smallHuman/breasts.svg?component'
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

	let confirmingAlert = $state<Alert | null>(null);
	let confirmDismissOpen = $state(false);
	let dismissing = $state(false);

	function askDismissAlert(alert: Alert) {
		confirmingAlert = alert;
		confirmDismissOpen = true;
	}

	$effect(() => {
		if (!confirmDismissOpen) confirmingAlert = null;
	});

	async function confirmDismissAlert() {
		if (!confirmingAlert) return;
		const id = confirmingAlert.id;
		dismissing = true;

		const token = await getToken();

		await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { dismissAlert(id: "${id}") }`,
			}),
		}).then(r => r.json());

		data = { ...data, alerts: data.alerts.filter((a: Alert) => a.id !== id) };
		setCache('small-human', { smallHuman: data });

		dismissing = false;
		confirmDismissOpen = false;
	}

	let dismissAlertActions: ModalAction[] = $derived([
		{ label: `Cancel`, onclick: () => (confirmDismissOpen = false), style: `secondary`, variant: `danger`, disabled: dismissing },
		{ label: dismissing ? `Dismissing…` : `Dismiss`, onclick: confirmDismissAlert, variant: `danger`, disabled: dismissing },
	]);

	async function completeAllergen(taskId: string) {
		completing.add(taskId);
		const token = await getToken();

		await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { 'Authorization': `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				// completeHabit (not the generic completeTask) so the completion also
				// gets logged to PocketBase, which is what drives this allergen's
				// streak on the habits page (also merged in from Todoist).
				query: `mutation { completeHabit(habitId: "${taskId}") { success } }`,
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

		const res = await fetch(getGraphqlUrl(), {
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

		const res = await fetch(getGraphqlUrl(), {
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

	const tabs = [
		{ id: 'growth', label: 'Growth' },
		{ id: 'teeth', label: 'Teeth' },
		{ id: 'swimming', label: 'Swimming' },
		{ id: 'milestones', label: 'Milestones' },
		{ id: 'auslan', label: 'Auslan' },
		{ id: 'feeding', label: 'Feeding' },
		{ id: 'sleep', label: 'Sleep' },
		{ id: 'sleep-environment', label: 'Sleep Environment' },
		{ id: 'clothing-seasonal', label: 'Clothing Seasonal' },
		{ id: 'clothing-daytime', label: 'Clothing Daytime' },
		{ id: 'vaccinations', label: 'Vaccinations' },
		{ id: 'parenting-approach', label: 'Parenting Approach' },
		{ id: 'activities', label: 'Activities' },
		{ id: 'toddler-sleep-prep', label: 'Toddler Sleep Prep' },
		{ id: 'food-principles', label: 'Food Principles' },
		{ id: 'sources', label: 'Sources' },
	];

	let activeTab = $state(tabs[0].id);

	$effect(() => {
		const hash = page.url.hash.slice(1);
		if (hash && tabs.some((t) => t.id === hash)) {
			activeTab = hash;
		}
	});

	function setActiveTab(id: string) {
		activeTab = id;
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- resolve() is used; the rule can't trace it through template-literal concatenation with the hash
		goto(`${resolve('/small-human')}#${id}`, { replaceState: true, noScroll: true, keepFocus: true });
	}

</script>

<svelte:head>
	<title>{getPageTitle(`Small Human`)}</title>
</svelte:head>

<h1>Small Human</h1>

<Allergens
	{allergens}
	{completeAllergen}
	{completing}
/>

{#if loading}
	<Skeleton rows={3} />
{:else if !data}
	<EmptyState title="No data available" />
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
	{@const urgentAlerts = alerts.filter((a: Alert) => a.level === 'urgent')}
	{@const otherAlerts = alerts.filter((a: Alert) => a.level !== 'urgent')}

	<UrgentAlerts alerts={urgentAlerts} onDismiss={askDismissAlert} />

	<h2>Overview</h2>

	<Stats items={[
		{ name: 'Last Updated', value: overview.last_updated, colour: 'blue_navy' },
		{ name: 'Age', value: ageDisplay, colour: 'blue_navy' },
	]} />
	<Cards>
		{#each otherAlerts as alert (alert.id)}
			<Card {...alert} colour={alertColours[alert.level]} onDismiss={() => askDismissAlert(alert)}>
				<p>{alert.detail}</p>
			</Card>
		{/each}
		<Card title="Car Seat">
			<p>{car_seat.facing_note}</p>
			<p>{car_seat.next_transition}</p>
		</Card>
	</Cards>

	<Tabs {tabs} active={activeTab} onSelect={setActiveTab} />

	{#if activeTab === 'growth'}
	<div id="panel-growth" role="tabpanel" aria-labelledby="tab-growth" tabindex="0">
		<h2>Growth</h2>
		<Growth {growth} />
	</div>
	{/if}

	{#if activeTab === 'teeth'}
	<div id="panel-teeth" role="tabpanel" aria-labelledby="tab-teeth" tabindex="0">
		<h2>Teeth</h2>
		<Teeth {teeth} onMarkErupted={markToothErupted} />
	</div>
	{/if}

	{#if activeTab === 'swimming'}
	<div id="panel-swimming" role="tabpanel" aria-labelledby="tab-swimming" tabindex="0">
		<h2>Swimming</h2>
		<p>{swimming.note}</p>
		<Cards>
			{#each swimming.skills as m (m.id)}
				<Milestone {...m} onStatusChange={updateSwimSkillStatus} />
			{/each}
		</Cards>
	</div>
	{/if}
	{#if activeTab === 'milestones'}
	<div id="panel-milestones" role="tabpanel" aria-labelledby="tab-milestones" tabindex="0">
		<h2>Milestones</h2>
		<p>{milestones.note}</p>
		<Cards>
			{#each sortedMilestones as m (m.id)}
				<Milestone {...m} type={m.category} onStatusChange={updateMilestoneStatus} />
			{/each}
		</Cards>
	</div>
	{/if}
	{#if activeTab === 'auslan'}
	<div id="panel-auslan" role="tabpanel" aria-labelledby="tab-auslan" tabindex="0">
		<h2>Auslan</h2>
		<p>{auslan.note}</p>
		<Cards>
			{#each auslan.signs as s (s.id)}
				<Auslan {...s} onStatusChange={updateAuslanSignStatus} />
			{/each}
		</Cards>
	</div>
	{/if}
	{#if activeTab === 'feeding'}
	<div id="panel-feeding" role="tabpanel" aria-labelledby="tab-feeding" tabindex="0">
		<h2>Feeding</h2>
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
	</div>
	{/if}
	{#if activeTab === 'sleep'}
	<div id="panel-sleep" role="tabpanel" aria-labelledby="tab-sleep" tabindex="0">
		<h2>Sleep</h2>
		<pre><code>{JSON.stringify(sleep, null, 2)}</code></pre>
	</div>
	{/if}
	{#if activeTab === 'sleep-environment'}
	<div id="panel-sleep-environment" role="tabpanel" aria-labelledby="tab-sleep-environment" tabindex="0">
		<h2>Sleep Environment</h2>
		<pre><code>{JSON.stringify(sleep_environment, null, 2)}</code></pre>
	</div>
	{/if}
	{#if activeTab === 'clothing-seasonal'}
	<div id="panel-clothing-seasonal" role="tabpanel" aria-labelledby="tab-clothing-seasonal" tabindex="0">
		<h2>Clothing Seasonal</h2>
		<pre><code>{JSON.stringify(clothing_seasonal, null, 2)}</code></pre>
	</div>
	{/if}
	{#if activeTab === 'clothing-daytime'}
	<div id="panel-clothing-daytime" role="tabpanel" aria-labelledby="tab-clothing-daytime" tabindex="0">
		<h2>Clothing Daytime</h2>
		<pre><code>{JSON.stringify(clothing_daytime, null, 2)}</code></pre>
	</div>
	{/if}
	{#if activeTab === 'vaccinations'}
	<div id="panel-vaccinations" role="tabpanel" aria-labelledby="tab-vaccinations" tabindex="0">
		<h2>Vaccinations</h2>
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
	</div>
	{/if}
	{#if activeTab === 'parenting-approach'}
	<div id="panel-parenting-approach" role="tabpanel" aria-labelledby="tab-parenting-approach" tabindex="0">
		<h2>Parenting Approach</h2>
		<Cards>
			{#each parenting_approach as a (a.id)}
				<Card
				title={a.title}
				>
					<p>{a.detail}</p>
				</Card>
			{/each}
		</Cards>
	</div>
	{/if}
	{#if activeTab === 'activities'}
	<div id="panel-activities" role="tabpanel" aria-labelledby="tab-activities" tabindex="0">
		<h2>Activities</h2>
		<Cards>
			{#each activities as a (a.id)}
				<Card
				title={a.title}
				>
					<p>{a.detail}</p>
				</Card>
			{/each}
		</Cards>
	</div>
	{/if}
	{#if activeTab === 'toddler-sleep-prep'}
	<div id="panel-toddler-sleep-prep" role="tabpanel" aria-labelledby="tab-toddler-sleep-prep" tabindex="0">
		<h2>Toddler Sleep Prep</h2>
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
	</div>
	{/if}
	{#if activeTab === 'food-principles'}
	<div id="panel-food-principles" role="tabpanel" aria-labelledby="tab-food-principles" tabindex="0">
		<h2>Food Principles</h2>
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
	</div>
	{/if}
	{#if activeTab === 'sources'}
	<div id="panel-sources" role="tabpanel" aria-labelledby="tab-sources" tabindex="0">
		<h2>Sources</h2>
		{#each sources as s (s.id)}
			<h3>{s.name}</h3>
			<p>{s.detail}</p>
			{#if s.note}<p>{s.note}</p>{/if}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- s.url is an external reference source, not an internal route -->
			<a href={s.url} target="_blank">{s.url.replace('https://', '')}</a>
		{/each}
	</div>
	{/if}
{/if}

<Modal bind:open={confirmDismissOpen} title="Dismiss alert?" actions={dismissAlertActions}>
	{#if confirmingAlert}
		<p class="confirm-alert-title"><strong>{confirmingAlert.title}</strong></p>
		<p>{confirmingAlert.detail}</p>
	{/if}
	<p class="confirm-note">This permanently removes the alert - it won't reappear.</p>
</Modal>

<style>
	@import '@mixins';

	h2 {
		text-transform: capitalize;
	}

	.confirm-alert-title {
		margin: 0 0 0.3em;
	}

	.confirm-note {
		color: var(--grey);
		font-size: 0.9em;
	}

	pre {
		padding: 1em;
		overflow-x: auto;
		border-radius: 0.3em;
		background: var(--blue);
		color: var(--blue_text);
		font-size: 0.85em;
		line-height: 1.4;
	}

	div[role='tabpanel'] h2 {
		color: var(--navy);
		font-size: 1.5em;
	}

	div[role='tabpanel']:focus-visible {
		outline: 2px solid var(--purple_bright);
		outline-offset: 2px;
	}
</style>
