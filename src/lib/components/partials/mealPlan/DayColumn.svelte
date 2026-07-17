<script lang="ts">
	import { format } from 'date-fns';
	import { resolve } from '$app/paths';
	import { formatMinutes } from '$utils/formatMinutes';

	let {
		day,
		eveningEvents = [],
	}: {
		day: {
			date: string;
			label: string;
			displayDate: string;
			isToday: boolean;
			isYesterday: boolean;
			entries: any[];
		};
		eveningEvents?: { id: string, title: string, start: Date, end: Date }[];
	} = $props();
</script>

<div class="day" class:today={day.isToday} class:yesterday={day.isYesterday}>
	<h2>
		{day.label}
		<span class="date">{day.displayDate}</span>
	</h2>

	{#if day.entries.length === 0}
		<p class="empty">No meals planned</p>
	{:else}
		{#each day.entries as entry (entry.id)}
			<div class="meal">
				<div class="meal-header">
					<span class="meal-type">{entry.entryType}</span>
				</div>
				{#if entry.recipe}
					<a href={resolve(`/recipes/[slug]`, { slug: entry.recipe.slug })} class="recipe-link">
						{#if entry.recipe.image}
							<img src={entry.recipe.image} alt={entry.recipe.name} loading="lazy" />
						{/if}
						<span class="recipe-name">{entry.recipe.name}</span>
					</a>
					{#if entry.recipe.totalTime || entry.recipe.servings}
						<span class="recipe-meta">
							{#if entry.recipe.totalTime}{formatMinutes(entry.recipe.totalTime)}{/if}
							{#if entry.recipe.servings} · {entry.recipe.servings} servings{/if}
						</span>
					{/if}
				{:else if entry.title}
					<span class="recipe-name">{entry.title}</span>
					{#if entry.text}<p class="meal-text">{entry.text}</p>{/if}
				{/if}
			</div>
		{/each}
	{/if}

	{#if eveningEvents.length}
		<ul class="evening-events">
			{#each eveningEvents as event (event.id)}
				<li>
					<span class="event-title">{event.title}</span>
					<span class="event-time">{format(event.start, `h:mma`)}–{format(event.end, `h:mma`)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>

<style>
	.day {
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;
		padding: 0.8em;
		min-height: 150px;

		&.today {
			border-color: var(--purple_bright);
			background: color-mix(in srgb, var(--purple_bright) 4%, var(--transparent));
		}

		&.yesterday {
			border-style: dashed;
		}

		& h2 {
			font-size: 0.85em;
			margin: 0 0 0.5em;
			display: flex;
			flex-direction: column;
		}
	}

	.date {
		font-size: 0.85em;
		font-weight: 400;
		color: var(--grey);
	}

	.empty {
		font-size: 0.8em;
		color: var(--grey);
		font-style: italic;
	}

	.meal {
		margin-bottom: 0.5em;
		padding: 0.4em;
		background: color-mix(in srgb, var(--blue) 6%, var(--transparent));
		border-radius: 0.3em;
	}

	.meal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
	}

	.meal-type {
		display: inline-block;
		font-size: 0.65em;
		text-transform: uppercase;
		font-weight: 600;
		color: var(--grey);
		margin-bottom: 0.2em;
	}

	.evening-events {
		margin: 0.6em 0 0;
		padding: 0.5em 0 0;
		border-top: 1px dashed var(--grey_light);
		list-style: none;
		font-size: 0.75em;

		& li {
			display: flex;
			justify-content: space-between;
			gap: 0.5em;
			margin-bottom: 0.2em;
		}
	}

	.event-title {
		color: var(--navy);
	}

	.event-time {
		flex-shrink: 0;
		color: var(--grey);
	}

	.recipe-link {
		display: block;
		text-decoration: none;
		color: inherit;

		&:hover .recipe-name {
			text-decoration: underline;
		}

		& img {
			width: 100%;
			height: 60px;
			object-fit: cover;
			border-radius: 0.2em;
			margin-bottom: 0.3em;
		}
	}

	.recipe-name {
		font-size: 0.85em;
		font-weight: 600;
		line-height: 1.2;
	}

	.recipe-meta {
		display: block;
		font-size: 0.7em;
		color: var(--grey);
	}

	.meal-text {
		font-size: 0.8em;
		color: var(--grey);
		margin: 0.2em 0 0;
	}
</style>
