<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import { format, addDays, formatDate, isWithinInterval, addWeeks, differenceInWeeks } from 'date-fns';
	import fetchClientData, { setCache, getGraphqlUrl } from '$utils/fetchClientData';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { getToken } from '$lib/auth';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import type { Colour } from '$types/global';
	import Allergens from '$parts/smallHuman/Allergens/index.svelte';
	import Growth from '$parts/smallHuman/Growth/index.svelte';
	import Teeth from '$components/partials/smallHuman/Teeth/index.svelte';
	import Swimming from '$components/partials/smallHuman/Swimming.svelte';
	import Milestones from '$components/partials/smallHuman/Milestones.svelte';
	import Auslan from '$components/partials/smallHuman/Auslan.svelte';
	import Feeding from '$components/partials/smallHuman/Feeding.svelte';
	import Sleep from '$components/partials/smallHuman/Sleep/index.svelte';
	import ClothingSeasonal from '$components/partials/smallHuman/Clothing/index.svelte';
	import Vaccinations from '$components/partials/smallHuman/Vaccinations/index.svelte';
	import ParentingApproach from '$components/partials/smallHuman/ParentingApproach.svelte';
	import Activities from '$components/partials/smallHuman/Activities.svelte';
	import Sources from '$components/partials/smallHuman/Sources/index.svelte';
	import Stats from '$parts/Stats/index.svelte';
	import Card from '$parts/Card/index.svelte';
	import Cards from '$parts/Cards/index.svelte';
	import Tabs from '$parts/Tabs/index.svelte';
	import Modal from '$parts/Modal/index.svelte';
	import type { ModalAction } from '$parts/Modal/index.svelte';
	import type { Alert, AlertType, MilestoneStatus, SignStatus } from '$types/generated';
	import UrgentAlerts from '$parts/smallHuman/UrgentAlerts/index.svelte';
	import Skeleton from '$parts/Skeleton/index.svelte';
	import EmptyState from '$parts/EmptyState/index.svelte';
	import { getPageTitle } from '$utils/pageTitle';
	import { SvelteSet } from 'svelte/reactivity';
	import Title from '$parts/Title/index.svelte';

	let data = $state<any>(null);
	let allergens = $state<any[]>([]);
	let weather = $state<any>(null);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			function handleSmallHuman(res: any) {
				data = res.smallHuman ?? null;
				weather = res.house ?? null;
				loading = false;
			}
			fetchClientData({
				cacheKey: 'small-human',
				onStale: handleSmallHuman,
				gqlQuery: `
					query {
						house {
							weather { condition temperature humidity forecast { condition shortText extendedText uvIndex } }
							uv { value }
							sun { sunrise sunset }
						}
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
								schedule { source note }
								sources
								current {
									id title expected_age
									breastfeeds { value unit note }
									solid_meals { value unit note }
									water { value unit note }
									upcoming
								}
								upcoming {
									id title expected_age
									breastfeeds { value unit note }
									solid_meals { value unit note }
									water { value unit note }
									upcoming
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
									bedroom_temp_pattern { bedtime_temp early_morning_temp swing_note }
									current_recommendation { challenge strategy recommended_setup { sleep_sack_tog pj_layer reasoning } sources }
									forecast { date sleep_sack_tog }
									current_sizes size_watch
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
									rain_suit { recommended trigger note }
									current_recommendation {
										generated_from_temp generated_from_feels_like last_updated
										indoor { summary layers { position type sleeve weight material } feet extras { hat hat_reason beanie mittens sunscreen sunscreen_reason } rain_suit }
										outdoor { summary layers { position type sleeve weight material } feet extras { hat hat_reason beanie mittens sunscreen sunscreen_reason } rain_suit }
									}
									forecast {
										date temp
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

			function handleAllergens(res: any) {
				allergens = res.allergens ?? [];
			}
			const today = format(new Date(), DATE_FORMATS.iso);
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
	};

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
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { dismissAlert(id: "${id}") }`,
			}),
		}).then((r) => r.json());

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
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				// completeHabit (not the generic completeTask) so the completion also
				// gets logged to PocketBase, which is what drives this allergen's
				// streak on the habits page (also merged in from Todoist).
				query: `mutation { completeHabit(habitId: "${taskId}") { success } }`,
			}),
		}).then((r) => r.json());

		const newDue = format(addDays(new Date(), 7), DATE_FORMATS.iso);
		allergens = allergens.map((a) => (a.id === taskId ? { ...a, due: newDue } : a));
		completing.delete(taskId);
	}

	async function updateStatus({ mutation, fields, id, status, sectionKey, itemsKey }: { mutation: string; fields: string; id: string; status: string; sectionKey: string; itemsKey: string }) {
		const token = await getToken();

		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { ${mutation}(id: "${id}", status: ${status}) { ${fields} } }`,
			}),
		}).then((r) => r.json());

		const updated = res?.data?.[mutation];
		if (!updated) return;

		data = {
			...data,
			[sectionKey]: {
				...data[sectionKey],
				[itemsKey]: data[sectionKey][itemsKey].map((item: any) => (item.id === updated.id ? { ...item, ...updated } : item)),
			},
		};
		setCache('small-human', { smallHuman: data });
	}

	const updateMilestoneStatus = (id: string, status: MilestoneStatus) => updateStatus({ mutation: 'updateMilestoneStatus', fields: 'id status achieved_date', id, status, sectionKey: 'milestones', itemsKey: 'items' });

	const updateSwimSkillStatus = (id: string, status: MilestoneStatus) => updateStatus({ mutation: 'updateSwimSkillStatus', fields: 'id status', id, status, sectionKey: 'swimming', itemsKey: 'skills' });

	const updateAuslanSignStatus = (id: string, status: SignStatus) => updateStatus({ mutation: 'updateAuslanSignStatus', fields: 'id status', id, status, sectionKey: 'auslan', itemsKey: 'signs' });

	async function markToothErupted(fdi: number) {
		const token = await getToken();

		const res = await fetch(getGraphqlUrl(), {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				query: `mutation { markToothErupted(fdi: ${fdi}) { fdi status erupted_date } }`,
			}),
		}).then((r) => r.json());

		const updated = res?.data?.markToothErupted;
		if (!updated) return;

		data = {
			...data,
			teeth: {
				...data.teeth,
				teeth: data.teeth.teeth.map((t: any) => (t.fdi === updated.fdi ? { ...t, ...updated } : t)),
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
		return wholeMonths > 0 ? `${wholeMonths} month${wholeMonths !== 1 ? 's' : ''} ${remainingWeeks} week${remainingWeeks !== 1 ? 's' : ''}` : `${ageWeeks} week${ageWeeks !== 1 ? 's' : ''}`;
	});

	const tabs = [
		{ id: 'growth', label: 'Growth' },
		{ id: 'teeth', label: 'Teeth' },
		{ id: 'swimming', label: 'Swimming' },
		{ id: 'milestones', label: 'Milestones' },
		{ id: 'auslan', label: 'Auslan' },
		{ id: 'feeding', label: 'Feeding' },
		{ id: 'sleep', label: 'Sleep' },
		{ id: 'clothing', label: 'Clothing' },
		{ id: 'vaccinations', label: 'Vaccinations' },
		{ id: 'parenting-approach', label: 'Parenting Approach' },
		{ id: 'activities', label: 'Activities' },
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

<Title>Small Human</Title>

<Allergens
	{allergens}
	{completeAllergen}
	{completing}
/>

{#if loading}
	<Skeleton rows={3} />
{:else if !data}
	<EmptyState
		page={true}
		title="No data available"
	/>
{:else}
	{@const { overview, alerts, growth, teeth, swimming, milestones, auslan, feeding, sleep, clothing, vaccinations, notes, activities, sources } = data}
	{@const car_seat = notes.find((n: any) => n.__typename === 'CarSeat')}
	{@const parenting_approach = notes.find((n: any) => n.__typename === 'ParentingApproachNote')?.parentingApproachItems ?? []}
	{@const urgentAlerts = alerts.filter((a: Alert) => a.level === 'urgent')}
	{@const otherAlerts = alerts.filter((a: Alert) => a.level !== 'urgent')}

	<UrgentAlerts
		alerts={urgentAlerts}
		onDismiss={askDismissAlert}
	/>

	<h2>Overview</h2>

	<Stats
		items={[
			{ name: 'Last Updated', value: overview.last_updated, colour: 'blue_navy' },
			{ name: 'Age', value: ageDisplay, colour: 'blue_navy' },
		]}
	/>
	<Cards>
		{#each otherAlerts as alert (alert.id)}
			<Card
				{...alert}
				theme={alertColours[alert.level]}
				onDismiss={() => askDismissAlert(alert)}
			>
				<p>{alert.detail}</p>
			</Card>
		{/each}
		<Card title="Car Seat">
			<p>{car_seat.facing_note}</p>
			<p>{car_seat.next_transition}</p>
		</Card>
	</Cards>

	<Tabs
		{tabs}
		active={activeTab}
		onSelect={setActiveTab}
	/>

	{#if activeTab === 'growth'}
		<div
			id="panel-growth"
			role="tabpanel"
			aria-labelledby="tab-growth"
			tabindex="0"
		>
			<h2>Growth</h2>
			<Growth {growth} />
		</div>
	{/if}

	{#if activeTab === 'teeth'}
		<div
			id="panel-teeth"
			role="tabpanel"
			aria-labelledby="tab-teeth"
			tabindex="0"
		>
			<h2>Teeth</h2>
			<Teeth
				{teeth}
				onMarkErupted={markToothErupted}
			/>
		</div>
	{/if}

	{#if activeTab === 'swimming'}
		<div
			id="panel-swimming"
			role="tabpanel"
			aria-labelledby="tab-swimming"
			tabindex="0"
		>
			<h2>Swimming</h2>
			<Swimming
				{swimming}
				onStatusChange={updateSwimSkillStatus}
			/>
		</div>
	{/if}
	{#if activeTab === 'milestones'}
		<div
			id="panel-milestones"
			role="tabpanel"
			aria-labelledby="tab-milestones"
			tabindex="0"
		>
			<h2>Milestones</h2>
			<Milestones
				{milestones}
				onStatusChange={updateMilestoneStatus}
			/>
		</div>
	{/if}
	{#if activeTab === 'auslan'}
		<div
			id="panel-auslan"
			role="tabpanel"
			aria-labelledby="tab-auslan"
			tabindex="0"
		>
			<h2>Auslan</h2>
			<Auslan
				{auslan}
				onStatusChange={updateAuslanSignStatus}
			/>
		</div>
	{/if}
	{#if activeTab === 'feeding'}
		<div
			id="panel-feeding"
			role="tabpanel"
			aria-labelledby="tab-feeding"
			tabindex="0"
		>
			<h2>Feeding</h2>
			<Feeding {feeding} />
		</div>
	{/if}
	{#if activeTab === 'sleep'}
		<div
			id="panel-sleep"
			role="tabpanel"
			aria-labelledby="tab-sleep"
			tabindex="0"
		>
			<h2>Sleep</h2>
			<Sleep {sleep} />
		</div>
	{/if}
	{#if activeTab === 'clothing'}
		<div
			id="panel-clothing"
			role="tabpanel"
			aria-labelledby="tab-clothing"
			tabindex="0"
		>
			<h2>Clothing</h2>
			<ClothingSeasonal
				{clothing}
				{weather}
			/>
		</div>
	{/if}
	{#if activeTab === 'vaccinations'}
		<div
			id="panel-vaccinations"
			role="tabpanel"
			aria-labelledby="tab-vaccinations"
			tabindex="0"
		>
			<h2>Vaccinations</h2>
			<Vaccinations {vaccinations} />
		</div>
	{/if}
	{#if activeTab === 'parenting-approach'}
		<div
			id="panel-parenting-approach"
			role="tabpanel"
			aria-labelledby="tab-parenting-approach"
			tabindex="0"
		>
			<h2>Parenting Approach</h2>
			<ParentingApproach items={parenting_approach} />
		</div>
	{/if}
	{#if activeTab === 'activities'}
		<div
			id="panel-activities"
			role="tabpanel"
			aria-labelledby="tab-activities"
			tabindex="0"
		>
			<h2>Activities</h2>
			<Activities {activities} />
		</div>
	{/if}
	{#if activeTab === 'sources'}
		<div
			id="panel-sources"
			role="tabpanel"
			aria-labelledby="tab-sources"
			tabindex="0"
		>
			<h2>Sources</h2>
			<Sources {sources} />
		</div>
	{/if}
{/if}

<Modal
	bind:open={confirmDismissOpen}
	title="Dismiss alert?"
	actions={dismissAlertActions}
>
	{#if confirmingAlert}
		<p class="confirm-alert-title"><strong>{confirmingAlert.title}</strong></p>
		<p>{confirmingAlert.detail}</p>
	{/if}
	<p class="confirm-note">This permanently removes the alert - it won't reappear.</p>
</Modal>

<!-- TODO: migrate to CSS Modules (see #641) -->
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

	div[role='tabpanel'] {
		&:focus,
		&:focus-visible {
			outline: none;
		}

		& h2 {

			@include sr_only;
		}
	}
</style>
