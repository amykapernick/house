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
		eveningEvents?: { id: string; title: string; start: Date; end: Date }[];
	} = $props();
</script>

<div
	class="day"
	class:today={day.isToday}
	class:yesterday={day.isYesterday}
>
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
					<a
						href={resolve(`/recipes/[slug]`, { slug: entry.recipe.slug })}
						class="recipe-link"
					>
						{#if entry.recipe.image}
							<img
								src={entry.recipe.image}
								alt={entry.recipe.name}
								loading="lazy"
							/>
						{/if}
						<span class="recipe-name">{entry.recipe.name}</span>
					</a>
					{#if entry.recipe.totalTime || entry.recipe.servings}
						<span class="recipe-meta">
							{#if entry.recipe.totalTime}{formatMinutes(entry.recipe.totalTime)}{/if}
							{#if entry.recipe.servings}
								· {entry.recipe.servings} servings{/if}
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
		min-height: 150px;
		padding: 0.8em;
		border: 1px solid var(--grey_light);
		border-radius: 0.3em;

		&.today {
			border-color: var(--purple_bright);
			background: color-mix(in oklch, var(--purple_bright) 4%, var(--transparent));
		}

		&.yesterday {
			border-style: dashed;
		}

		& h2 {
			display: flex;
			flex-direction: column;
			margin: 0 0 0.5em;
			font-size: 0.85em;
		}
	}

	.date {
		color: var(--grey);
		font-size: 0.85em;
		font-weight: 400;
	}

	.empty {
		color: var(--grey);
		font-size: 0.8em;
		font-style: italic;
	}

	.meal {
		margin-bottom: 0.5em;
		padding: 0.4em;
		border-radius: 0.3em;
		background: color-mix(in oklch, var(--blue) 6%, var(--transparent));
	}

	.meal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5em;
	}

	.meal-type {
		display: inline-block;
		margin-bottom: 0.2em;
		color: var(--grey);
		font-size: 0.65em;
		font-weight: 600;
		text-transform: uppercase;
	}

	.evening-events {
		margin: 0.6em 0 0;
		padding: 0.5em 0 0;
		border-top: 1px dashed var(--grey_light);
		font-size: 0.75em;
		list-style: none;

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
		color: inherit;
		text-decoration: none;

		&:hover .recipe-name {
			text-decoration: underline;
		}

		& img {
			width: 100%;
			height: 60px;
			margin-bottom: 0.3em;
			border-radius: 0.2em;
			object-fit: cover;
		}
	}

	.recipe-name {
		font-size: 0.85em;
		font-weight: 600;
		line-height: 1.2;
	}

	.recipe-meta {
		display: block;
		color: var(--grey);
		font-size: 0.7em;
	}

	.meal-text {
		margin: 0.2em 0 0;
		color: var(--grey);
		font-size: 0.8em;
	}
</style>
