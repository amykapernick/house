<script lang="ts">
	import { isAuthenticated } from '$lib/auth';
	import fetchClientData from '$utils/fetchClientData';

	let data = $state<any>(null);
	let loading = $state(true);

	$effect(() => {
		if ($isAuthenticated) {
			fetchClientData({
				cacheKey: 'small-human',
				gqlQuery: `
					query {
						smallHuman {
							meta {
								last_updated
								age_weeks
								age_display
								name
								birth_month
								summary_tags
							}
							alerts {
								id
								type
								title
								body
							}
							growth {
								note
								measurements {
									date height_cm weight_kg head_cm
									height_percentile weight_percentile head_percentile
								}
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
								sources
							}
							teeth {
								note
								erupted { id name erupted_age_months }
								teething_now
								teething_note
								expected_next { id name typical_age_months }
								dental_care {
									toothbrush toothpaste first_dental_visit sources
								}
							}
							car_seat {
								current_stage facing facing_note
								next_transition sources
							}
							swimming {
								current_skills { id name status note }
								upcoming_skills { id name status note }
								safety_note
								sources
							}
							milestones {
								movement {
									id title status detail tag
									achieved_age_weeks textbook_age_weeks weeks_early
									sources
								}
								fine_motor {
									id title status detail tag
									achieved_age_weeks textbook_age_weeks weeks_early
									sources
								}
								development {
									id title status detail tag sources
								}
							}
							auslan {
								note
								signs { id name status tip }
								sources
							}
							sleep {
								framework
								current_pattern {
									naps_per_day
									nap_transition
									nap_duration_range_min
									nap_duration_range_max
									nap_duration_typical
									nap_cap
									nap_cutoff
									bedtime
									typical_wake
									night_waking_pattern
									suspected_cause
									notes
								}
								items { id title status detail tag sources }
							}
							sleep_environment {
								note
								bedroom_temp_pattern {
									bedtime_temp_c
									early_morning_temp_c
									swing_note
								}
								tog_reference { temp_range_c tog layer }
								current_recommendation {
									challenge
									strategy
									recommended_setup { sleep_sack_tog pj_layer reasoning }
									sources
								}
								current_sizes
								sleep_sacks_on_hand { tog sizes material note }
								size_watch
							}
							clothing_seasonal {
								note
								current_sizes
								size_nudge
								noongar_season {
									current current_period current_description
									next next_period next_description
									weeks_until_next
								}
								alerts { id type title body action weeks_ahead }
							}
							clothing_daytime {
								note
								layer_rule
								feet_rule
								sun_safety { uv_threshold_for_coverage note sources }
								indoor_reference { indoor_temp_c_min indoor_temp_c_max recommendation layers }
								outdoor_reference { feels_like_c_min feels_like_c_max recommendation layers extras }
								rain_suit { recommended trigger note }
								current_recommendation {
									generated_from_temp_c
									generated_from_feels_like_c
									last_updated
									indoor {
										summary
										layers { position type sleeve weight material }
										feet
										extras
										rain_suit
									}
									outdoor {
										summary
										layers { position type sleeve weight material }
										feet
										extras
										rain_suit
									}
								}
								forecast {
									date day_label
									temp_high_c temp_low_c
									feels_like_high_c feels_like_low_c
									conditions rain_expected uv_index
									indoor {
										summary
										layers { position type sleeve weight material }
										feet extras rain_suit
									}
									outdoor {
										summary
										layers { position type sleeve weight material }
										feet extras rain_suit
									}
								}
							}
							vaccinations {
								alert
								items { id name status detail date next_due }
								sources
							}
							parenting_approach { id title detail sources }
							activities { id title detail sources }
							sources { id name badge url desc priority approved approved_date notes }
						}
					}
				`,
			}).then((res) => {
				data = res.smallHuman ?? null;
				loading = false;
			});
		}
	});

	function formatLayers(layers: any[]) {
		return layers?.map((l: any) => `${l.position} ${l.type} (${l.sleeve}, ${l.weight} ${l.material})`).join(', ') ?? '';
	}
</script>

<svelte:head>
	<title>Small Human | Kapers Crewe Household</title>
</svelte:head>

<h1>Small Human</h1>
{#if loading}
	<p>Loading...</p>
{:else if !data}
	<p>No data available</p>
{:else}
	{#if data.meta}
		<p class="age">{data.meta.name} — {data.meta.age_display}</p>
		{#if data.meta.summary_tags?.length}
			<ul class="tags">
				{#each data.meta.summary_tags as tag}
					<li>{tag}</li>
				{/each}
			</ul>
		{/if}
	{/if}

	{#if data.alerts?.length}
		<section>
			<h2>Alerts</h2>
			{#each data.alerts as alert}
				<div class="alert" data-type={alert.type}>
					<strong>{alert.title}</strong>
					<p>{alert.body}</p>
				</div>
			{/each}
		</section>
	{/if}

	{#if data.growth}
		<section>
			<h2>Growth</h2>
			<p>{data.growth.note}</p>
			{#if data.growth.measurements?.length}
				<table>
					<thead>
						<tr><th>Date</th><th>Height</th><th>Weight</th><th>Head</th></tr>
					</thead>
					<tbody>
						{#each data.growth.measurements as m}
							<tr>
								<td>{m.date}</td>
								<td>{m.height_cm}cm {#if m.height_percentile != null}<span class="meta">({m.height_percentile}%ile)</span>{/if}</td>
								<td>{m.weight_kg}kg {#if m.weight_percentile != null}<span class="meta">({m.weight_percentile}%ile)</span>{/if}</td>
								<td>{m.head_cm}cm {#if m.head_percentile != null}<span class="meta">({m.head_percentile}%ile)</span>{/if}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			{#if data.growth.trend_notes}<p class="note">{data.growth.trend_notes}</p>{/if}
		</section>
	{/if}

	{#if data.feeding}
		<section>
			<h2>Feeding</h2>
			<dl class="summary">
				{#each Object.entries(data.feeding.summary) as [key, item]}
					<div>
						<dt>{key.replaceAll('_', ' ')}</dt>
						<dd>{item.value}</dd>
						{#if item.note}<dd class="note">{item.note}</dd>{/if}
					</div>
				{/each}
			</dl>
			{#if data.feeding.details?.length}
				<dl class="details">
					{#each data.feeding.details as detail}
						<div>
							<dt>{detail.label}</dt>
							<dd>{detail.value}</dd>
						</div>
					{/each}
				</dl>
			{/if}
		</section>
	{/if}

	{#if data.teeth}
		<section>
			<h2>Teeth</h2>
			<p>{data.teeth.note}</p>
			{#if data.teeth.teething_now}
				<div class="alert" data-type="info">
					<strong>Currently teething</strong>
					{#if data.teeth.teething_note}<p>{data.teeth.teething_note}</p>{/if}
				</div>
			{/if}
			{#if data.teeth.erupted?.length}
				<h3>Erupted</h3>
				<ul class="items">
					{#each data.teeth.erupted as tooth}
						<li data-status="done">
							<strong>{tooth.name}</strong>
							<span class="meta">at {tooth.erupted_age_months} months</span>
						</li>
					{/each}
				</ul>
			{/if}
			{#if data.teeth.expected_next?.length}
				<h3>Expected next</h3>
				<ul class="items">
					{#each data.teeth.expected_next as tooth}
						<li data-status="upcoming">
							<strong>{tooth.name}</strong>
							<span class="meta">typically {tooth.typical_age_months} months</span>
						</li>
					{/each}
				</ul>
			{/if}
			{#if data.teeth.dental_care}
				<h3>Dental care</h3>
				<dl class="details">
					<div><dt>Toothbrush</dt><dd>{data.teeth.dental_care.toothbrush}</dd></div>
					<div><dt>Toothpaste</dt><dd>{data.teeth.dental_care.toothpaste}</dd></div>
					<div><dt>First visit</dt><dd>{data.teeth.dental_care.first_dental_visit}</dd></div>
				</dl>
			{/if}
		</section>
	{/if}

	{#if data.car_seat}
		<section>
			<h2>Car Seat</h2>
			<dl class="summary">
				<div><dt>Stage</dt><dd>{data.car_seat.current_stage}</dd></div>
				<div><dt>Facing</dt><dd>{data.car_seat.facing}</dd></div>
				<div><dt>Next transition</dt><dd>{data.car_seat.next_transition}</dd></div>
			</dl>
			{#if data.car_seat.facing_note}<p class="note">{data.car_seat.facing_note}</p>{/if}
		</section>
	{/if}

	{#if data.swimming}
		<section>
			<h2>Swimming</h2>
			{#if data.swimming.current_skills?.length}
				<h3>Current skills</h3>
				<ul class="items">
					{#each data.swimming.current_skills as skill}
						<li data-status={skill.status}>
							<strong>{skill.name}</strong>
							<span class="status">{skill.status.replaceAll('_', ' ')}</span>
							{#if skill.note}<p>{skill.note}</p>{/if}
						</li>
					{/each}
				</ul>
			{/if}
			{#if data.swimming.upcoming_skills?.length}
				<h3>Upcoming skills</h3>
				<ul class="items">
					{#each data.swimming.upcoming_skills as skill}
						<li data-status={skill.status}>
							<strong>{skill.name}</strong>
							{#if skill.note}<p>{skill.note}</p>{/if}
						</li>
					{/each}
				</ul>
			{/if}
			{#if data.swimming.safety_note}<p class="note">{data.swimming.safety_note}</p>{/if}
		</section>
	{/if}

	{#if data.milestones}
		<section>
			<h2>Milestones</h2>
			{#if data.milestones.movement?.length}
				<h3>Movement</h3>
				<ul class="items">
					{#each data.milestones.movement as m}
						<li data-status={m.status}>
							<strong>{m.title}</strong>
							<span class="status">{m.status.replaceAll('_', ' ')}</span>
							<p>{m.detail}</p>
							{#if m.achieved_age_weeks}
								<span class="meta">Achieved at {m.achieved_age_weeks} weeks {#if m.weeks_early}({m.weeks_early}w early){/if}</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
			{#if data.milestones.fine_motor?.length}
				<h3>Fine Motor</h3>
				<ul class="items">
					{#each data.milestones.fine_motor as m}
						<li data-status={m.status}>
							<strong>{m.title}</strong>
							<span class="status">{m.status.replaceAll('_', ' ')}</span>
							<p>{m.detail}</p>
							{#if m.achieved_age_weeks}
								<span class="meta">Achieved at {m.achieved_age_weeks} weeks {#if m.weeks_early}({m.weeks_early}w early){/if}</span>
							{/if}
						</li>
					{/each}
				</ul>
			{/if}
			{#if data.milestones.development?.length}
				<h3>Development</h3>
				<ul class="items">
					{#each data.milestones.development as m}
						<li data-status={m.status}>
							<strong>{m.title}</strong>
							<span class="status">{m.status.replaceAll('_', ' ')}</span>
							<p>{m.detail}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	{#if data.auslan}
		<section>
			<h2>Auslan</h2>
			<p>{data.auslan.note}</p>
			{#if data.auslan.signs?.length}
				<ul class="items">
					{#each data.auslan.signs as sign}
						<li data-status={sign.status}>
							<strong>{sign.name}</strong>
							<span class="status">{sign.status.replaceAll('_', ' ')}</span>
							{#if sign.tip}<p>{sign.tip}</p>{/if}
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	{#if data.sleep}
		<section>
			<h2>Sleep</h2>
			<p class="note">Framework: {data.sleep.framework}</p>
			{@const p = data.sleep.current_pattern}
			<dl class="summary">
				<div><dt>Naps/day</dt><dd>{p.naps_per_day}</dd></div>
				{#if p.nap_transition}<div><dt>Nap transition</dt><dd>{p.nap_transition}</dd></div>{/if}
				<div><dt>Nap duration</dt><dd>{p.nap_duration_typical} ({p.nap_duration_range_min}–{p.nap_duration_range_max} min)</dd></div>
				<div><dt>Nap cutoff</dt><dd>{p.nap_cutoff}{#if p.nap_cap} (capped){/if}</dd></div>
				<div><dt>Bedtime</dt><dd>{p.bedtime}</dd></div>
				<div><dt>Typical wake</dt><dd>{p.typical_wake}</dd></div>
				<div><dt>Night waking</dt><dd>{p.night_waking_pattern}</dd></div>
				{#if p.suspected_cause}<div><dt>Suspected cause</dt><dd>{p.suspected_cause}</dd></div>{/if}
			</dl>
			{#if p.notes}<p class="note">{p.notes}</p>{/if}
			{#if data.sleep.items?.length}
				<h3>Sleep items</h3>
				<ul class="items">
					{#each data.sleep.items as item}
						<li data-status={item.status}>
							<strong>{item.title}</strong>
							<span class="status">{item.status.replaceAll('_', ' ')}</span>
							<p>{item.detail}</p>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	{#if data.sleep_environment}
		<section>
			<h2>Sleep Environment</h2>
			<p>{data.sleep_environment.note}</p>
			{@const temp = data.sleep_environment.bedroom_temp_pattern}
			<dl class="summary">
				<div><dt>Bedtime temp</dt><dd>{temp.bedtime_temp_c}°C</dd></div>
				<div><dt>Early morning</dt><dd>{temp.early_morning_temp_c}°C</dd></div>
				<div><dt>Swing</dt><dd>{temp.swing_note}</dd></div>
			</dl>
			{@const rec = data.sleep_environment.current_recommendation}
			<h3>Current recommendation</h3>
			<p><strong>Challenge:</strong> {rec.challenge}</p>
			<p><strong>Strategy:</strong> {rec.strategy}</p>
			<p>{rec.recommended_setup.sleep_sack_tog} TOG, {rec.recommended_setup.pj_layer} — {rec.recommended_setup.reasoning}</p>
			{#if data.sleep_environment.tog_reference?.length}
				<h3>TOG reference</h3>
				<table>
					<thead><tr><th>Temp</th><th>TOG</th><th>Layer</th></tr></thead>
					<tbody>
						{#each data.sleep_environment.tog_reference as ref}
							<tr><td>{ref.temp_range_c}</td><td>{ref.tog}</td><td>{ref.layer}</td></tr>
						{/each}
					</tbody>
				</table>
			{/if}
			{#if data.sleep_environment.sleep_sacks_on_hand?.length}
				<h3>Sleep sacks on hand</h3>
				<ul class="items">
					{#each data.sleep_environment.sleep_sacks_on_hand as sack}
						<li>
							<strong>{sack.tog} TOG</strong> — {sack.material}, sizes: {sack.sizes.join(', ')}
							{#if sack.note}<p class="note">{sack.note}</p>{/if}
						</li>
					{/each}
				</ul>
			{/if}
			{#if data.sleep_environment.size_watch}<p class="note">{data.sleep_environment.size_watch}</p>{/if}
		</section>
	{/if}

	{#if data.clothing_seasonal}
		<section>
			<h2>Clothing &amp; Seasonal</h2>
			<p>{data.clothing_seasonal.note}</p>
			<p>Current sizes: {data.clothing_seasonal.current_sizes.join(', ')}</p>
			{#if data.clothing_seasonal.size_nudge}<p class="note">{data.clothing_seasonal.size_nudge}</p>{/if}
			{@const season = data.clothing_seasonal.noongar_season}
			<h3>Noongar Season</h3>
			<dl class="summary">
				<div><dt>Current</dt><dd>{season.current} ({season.current_period})</dd></div>
				<div><dt></dt><dd>{season.current_description}</dd></div>
				<div><dt>Next</dt><dd>{season.next} ({season.next_period}) — {season.weeks_until_next} weeks</dd></div>
				<div><dt></dt><dd>{season.next_description}</dd></div>
			</dl>
			{#if data.clothing_seasonal.alerts?.length}
				{#each data.clothing_seasonal.alerts as alert}
					<div class="alert" data-type={alert.type}>
						<strong>{alert.title}</strong>
						<p>{alert.body}</p>
						{#if alert.action}<p><em>{alert.action}</em></p>{/if}
					</div>
				{/each}
			{/if}
		</section>
	{/if}

	{#if data.clothing_daytime}
		<section>
			<h2>Clothing (Daytime)</h2>
			<p>{data.clothing_daytime.note}</p>
			<dl class="details">
				<div><dt>Layer rule</dt><dd>{data.clothing_daytime.layer_rule}</dd></div>
				<div><dt>Feet rule</dt><dd>{data.clothing_daytime.feet_rule}</dd></div>
			</dl>
			{#if data.clothing_daytime.sun_safety}
				<h3>Sun Safety</h3>
				<p>{data.clothing_daytime.sun_safety.note} (UV threshold: {data.clothing_daytime.sun_safety.uv_threshold_for_coverage})</p>
			{/if}
			{@const rec = data.clothing_daytime.current_recommendation}
			{#if rec}
				<h3>Current recommendation</h3>
				<dl class="summary">
					{#if rec.generated_from_temp_c}<div><dt>Indoor temp</dt><dd>{rec.generated_from_temp_c}°C</dd></div>{/if}
					{#if rec.generated_from_feels_like_c}<div><dt>Feels like</dt><dd>{rec.generated_from_feels_like_c}°C</dd></div>{/if}
				</dl>
				{#if rec.indoor}
					<h4>Indoor</h4>
					{#if rec.indoor.summary}<p>{rec.indoor.summary}</p>{/if}
					{#if rec.indoor.layers?.length}<p class="meta">Layers: {formatLayers(rec.indoor.layers)}</p>{/if}
					{#if rec.indoor.feet}<p class="meta">Feet: {rec.indoor.feet}</p>{/if}
				{/if}
				{#if rec.outdoor}
					<h4>Outdoor</h4>
					{#if rec.outdoor.summary}<p>{rec.outdoor.summary}</p>{/if}
					{#if rec.outdoor.layers?.length}<p class="meta">Layers: {formatLayers(rec.outdoor.layers)}</p>{/if}
					{#if rec.outdoor.feet}<p class="meta">Feet: {rec.outdoor.feet}</p>{/if}
					{#if rec.outdoor.extras?.length}<p class="meta">Extras: {rec.outdoor.extras.join(', ')}</p>{/if}
					{#if rec.outdoor.rain_suit}<p class="meta">Rain suit needed</p>{/if}
				{/if}
			{/if}
			{#if data.clothing_daytime.forecast?.length}
				<h3>Forecast</h3>
				<div class="forecast-grid">
					{#each data.clothing_daytime.forecast as day}
						<div class="forecast-day">
							<strong>{day.day_label}</strong>
							<span class="meta">{day.date}</span>
							<p>{day.conditions} {#if day.rain_expected}🌧{/if}</p>
							<p>{day.temp_low_c}–{day.temp_high_c}°C (feels {day.feels_like_low_c}–{day.feels_like_high_c}°C)</p>
							<p class="meta">UV: {day.uv_index}</p>
							{#if day.indoor?.summary}<p><strong>In:</strong> {day.indoor.summary}</p>{/if}
							{#if day.outdoor?.summary}<p><strong>Out:</strong> {day.outdoor.summary}</p>{/if}
						</div>
					{/each}
				</div>
			{/if}
			{#if data.clothing_daytime.indoor_reference?.length}
				<h3>Indoor reference</h3>
				<table>
					<thead><tr><th>Temp range</th><th>Recommendation</th><th>Layers</th></tr></thead>
					<tbody>
						{#each data.clothing_daytime.indoor_reference as ref}
							<tr>
								<td>{ref.indoor_temp_c_min ?? ''}–{ref.indoor_temp_c_max ?? ''}°C</td>
								<td>{ref.recommendation}</td>
								<td>{ref.layers}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			{#if data.clothing_daytime.outdoor_reference?.length}
				<h3>Outdoor reference</h3>
				<table>
					<thead><tr><th>Feels like</th><th>Recommendation</th><th>Layers</th><th>Extras</th></tr></thead>
					<tbody>
						{#each data.clothing_daytime.outdoor_reference as ref}
							<tr>
								<td>{ref.feels_like_c_min ?? ''}–{ref.feels_like_c_max ?? ''}°C</td>
								<td>{ref.recommendation}</td>
								<td>{ref.layers}</td>
								<td>{ref.extras?.join(', ') ?? ''}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
			{@const rain = data.clothing_daytime.rain_suit}
			{#if rain}
				<h3>Rain suit</h3>
				<p>{rain.recommended ? 'Recommended' : 'Not needed'} — {rain.trigger}</p>
				{#if rain.note}<p class="note">{rain.note}</p>{/if}
			{/if}
		</section>
	{/if}

	{#if data.vaccinations}
		<section>
			<h2>Vaccinations</h2>
			{#if data.vaccinations.alert}<p class="alert" data-type="info">{data.vaccinations.alert}</p>{/if}
			<ul class="items">
				{#each data.vaccinations.items as v}
					<li data-status={v.status}>
						<strong>{v.name}</strong>
						<span class="status">{v.status}</span>
						<p>{v.detail}</p>
						{#if v.date}<span class="meta">Date: {v.date}</span>{/if}
						{#if v.next_due}<span class="meta">Next due: {v.next_due}</span>{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.parenting_approach?.length}
		<section>
			<h2>Parenting Approach</h2>
			<ul class="items">
				{#each data.parenting_approach as item}
					<li>
						<strong>{item.title}</strong>
						<p>{item.detail}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.activities?.length}
		<section>
			<h2>Activities</h2>
			<ul class="items">
				{#each data.activities as item}
					<li>
						<strong>{item.title}</strong>
						<p>{item.detail}</p>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.sources?.length}
		<section>
			<h2>Sources</h2>
			<ul class="sources">
				{#each data.sources as source}
					<li>
						<a href={source.url} target="_blank" rel="noreferrer">
							<span class="badge">{source.badge}</span>
							<strong>{source.name}</strong>
						</a>
						<p>{source.desc}</p>
						{#if source.notes}<p class="note">{source.notes}</p>{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/if}
{/if}

<style>
	.age {
		font-size: 1.5em;
		font-weight: 600;
		color: var(--purple_bright);
		margin: 0;
	}

	.tags {
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
		margin: 0.5em 0 1em;
		padding: 0;
		list-style: none;

		& li {
			padding: 0.1em 0.5em;
			border: 1px solid currentColor;
			border-radius: 0.2em;
			font-size: 0.85em;
			color: var(--blue);
		}
	}

	section {
		margin-bottom: 2em;
		padding-bottom: 1em;
		border-bottom: 1px solid var(--grey_light);
	}

	h2 {
		text-transform: capitalize;
	}

	.alert {
		padding: 0.5em 1em;
		border-radius: 0.3em;
		margin: 0.5em 0;

		&[data-type='warn'] {
			background: rgba($orange, 0.15);
			border-left: 3px solid var(--orange);
		}

		&[data-type='info'] {
			background: rgba($blue, 0.15);
			border-left: 3px solid var(--blue);
		}

		&[data-type='ok'] {
			background: rgba($green, 0.15);
			border-left: 3px solid var(--green);
		}

		& p {
			margin: 0.3em 0;
		}
	}

	.summary {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 10px;
		margin: 0.5em 0;
		padding: 0;

		& div {
			padding: 0.5em;
			border-radius: 0.3em;
			background: rgba($blue, 0.08);
		}

		& dt {
			font-weight: 600;
			font-size: 0.85em;
			text-transform: capitalize;
			color: var(--navy);
		}

		& dd {
			margin: 0;
			font-size: 1.1em;
		}
	}

	.details {
		margin: 0.5em 0;
		padding: 0;

		& div {
			display: flex;
			gap: 1ch;
			padding: 0.2em 0;
		}

		& dt {
			font-weight: 600;
			min-width: 10em;
		}

		& dd {
			margin: 0;
		}
	}

	.items {
		margin: 0;
		padding: 0;
		list-style: none;

		& li {
			padding: 0.5em;
			margin: 0.3em 0;
			border-radius: 0.3em;
			border-left: 3px solid var(--grey_light);

			&[data-status='done'] {
				border-left-color: var(--green);
			}

			&[data-status='in_progress'] {
				border-left-color: var(--blue);
			}

			&[data-status='watch'] {
				border-left-color: var(--orange);
			}

			&[data-status='upcoming'] {
				border-left-color: var(--grey);
			}

			&[data-status='signing_occasionally'],
			&[data-status='recognises'] {
				border-left-color: var(--purple_bright);
			}

			&[data-status='introduce_next'],
			&[data-status='coming_soon'] {
				border-left-color: var(--blue_light);
			}
		}

		& p {
			margin: 0.2em 0;
		}
	}

	.status {
		display: inline-block;
		padding: 0.1em 0.4em;
		border-radius: 0.1em;
		font-size: 0.7em;
		text-transform: capitalize;
		background: var(--grey_light);
		margin-left: 0.5em;
	}

	.meta {
		display: block;
		font-size: 0.85em;
		color: var(--grey);
	}

	.note {
		font-size: 0.9em;
		font-style: italic;
		color: var(--grey);
	}

	.forecast-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 10px;
		margin: 0.5em 0;
	}

	.forecast-day {
		padding: 0.5em;
		border-radius: 0.3em;
		background: rgba($blue, 0.08);

		& p {
			margin: 0.2em 0;
			font-size: 0.9em;
		}
	}

	.sources {
		margin: 0;
		padding: 0;
		list-style: none;

		& li {
			padding: 0.5em;
			margin: 0.3em 0;
		}

		& a {
			display: flex;
			align-items: center;
			gap: 0.5em;
			color: inherit;
			text-decoration: none;

			&:hover {
				text-decoration: underline;
			}
		}

		& p {
			margin: 0.2em 0;
		}
	}

	.badge {
		font-size: 1.2em;
	}
</style>
