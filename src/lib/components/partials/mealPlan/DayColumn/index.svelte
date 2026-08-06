<script lang="ts">
	import { format } from 'date-fns';
	import { resolve } from '$app/paths';
	import { formatMinutes } from '$utils/formatMinutes';
	import styles from './index.module.css';

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

<div class={[styles.day, day.isToday && styles.today, day.isYesterday && styles.yesterday]}>
	<h2>
		{day.label}
		<span class={styles.date}>{day.displayDate}</span>
	</h2>

	{#if day.entries.length === 0}
		<p class={styles.empty}>No meals planned</p>
	{:else}
		{#each day.entries as entry (entry.id)}
			<div class={styles.meal}>
				<div class={styles['meal-header']}>
					<span class={styles['meal-type']}>{entry.entryType}</span>
				</div>
				{#if entry.recipe}
					<a
						href={resolve(`/recipes/[slug]`, { slug: entry.recipe.slug })}
						class={styles['recipe-link']}
					>
						{#if entry.recipe.image}
							<img
								src={entry.recipe.image}
								alt={entry.recipe.name}
								loading="lazy"
							/>
						{/if}
						<span class={styles['recipe-name']}>{entry.recipe.name}</span>
					</a>
					{#if entry.recipe.totalTime || entry.recipe.servings}
						<span class={styles['recipe-meta']}>
							{#if entry.recipe.totalTime}{formatMinutes(entry.recipe.totalTime)}{/if}
							{#if entry.recipe.servings}
								· {entry.recipe.servings} servings{/if}
						</span>
					{/if}
				{:else if entry.title}
					<span class={styles['recipe-name']}>{entry.title}</span>
					{#if entry.text}<p class={styles['meal-text']}>{entry.text}</p>{/if}
				{/if}
			</div>
		{/each}
	{/if}

	{#if eveningEvents.length}
		<ul class={styles['evening-events']}>
			{#each eveningEvents as event (event.id)}
				<li>
					<span class={styles['event-title']}>{event.title}</span>
					<span class={styles['event-time']}>{format(event.start, `h:mma`)}–{format(event.end, `h:mma`)}</span>
				</li>
			{/each}
		</ul>
	{/if}
</div>
