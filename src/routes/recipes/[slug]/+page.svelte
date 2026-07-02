<script lang="ts">
	import { page } from '$app/stores';
	import { format, parseISO, intervalToDuration } from 'date-fns';
	import fetchClientData from '$utils/fetchClientData';

	function formatMinutes(mins: number | string | null): string {
		if (!mins) return '';
		const m = typeof mins === 'string' ? parseInt(mins, 10) : mins;
		if (isNaN(m) || m <= 0) return '';
		const { hours, minutes } = intervalToDuration({ start: 0, end: m * 60 * 1000 });
		if (hours && minutes) return `${hours}h ${minutes}m`;
		if (hours) return `${hours}h`;
		return `${minutes}m`;
	}

	let recipe = $state<any>(null);
	let loading = $state(true);

	$effect(() => {
		{
			const slug = $page.params.slug;

			function handleRecipe(res: any) {
				recipe = res.recipe ?? null;
				loading = false;
			}
			fetchClientData({
				cacheKey: `recipe-${slug}`,
				onStale: handleRecipe,
				gqlQuery: `
					query {
						recipe(slug: "${slug}") {
							id name slug image description
							totalTime prepTime cookTime performTime
							servings recipeYield rating
							orgURL dateAdded lastMade
							tags { name slug }
							categories { name slug }
							ingredients { referenceId display quantity unit food note title }
							instructions { id position title text }
							nutrition {
								calories carbohydrateContent fatContent
								proteinContent fiberContent sodiumContent sugarContent
							}
							notes { title text }
							tools
						}
					}
				`,
			}).then(handleRecipe);
		}
	});
</script>

<svelte:head>
	<title>{recipe?.name ?? 'Recipe'} | Kapers Crewe Household</title>
</svelte:head>

<a href="/recipes" class="back">← Recipes</a>

{#if loading}
	<p>Loading...</p>
{:else if !recipe}
	<p>Recipe not found.</p>
{:else}
	<article>
		{#if recipe.image}
			<img class="hero" src={recipe.image} alt={recipe.name} />
		{/if}

		<h1>{recipe.name}</h1>

		{#if recipe.description}
			<p class="description">{recipe.description}</p>
		{/if}

		<div class="meta-bar">
			{#if recipe.prepTime}<div class="meta-item"><span class="label">Prep</span><span>{formatMinutes(recipe.prepTime)}</span></div>{/if}
			{#if recipe.cookTime}<div class="meta-item"><span class="label">Cook</span><span>{formatMinutes(recipe.cookTime)}</span></div>{/if}
			{#if recipe.totalTime}<div class="meta-item"><span class="label">Total</span><span>{formatMinutes(recipe.totalTime)}</span></div>{/if}
			{#if recipe.performTime}<div class="meta-item"><span class="label">Perform</span><span>{formatMinutes(recipe.performTime)}</span></div>{/if}
			{#if recipe.servings}<div class="meta-item"><span class="label">Servings</span><span>{recipe.servings}</span></div>{/if}
			{#if recipe.recipeYield}<div class="meta-item"><span class="label">Yield</span><span>{recipe.recipeYield}</span></div>{/if}
		</div>

		{#if recipe.tags?.length || recipe.categories?.length}
			<div class="tag-bar">
				{#each recipe.categories as cat}
					<span class="tag category">{cat.name}</span>
				{/each}
				{#each recipe.tags as tag}
					<span class="tag">{tag.name}</span>
				{/each}
			</div>
		{/if}

		<div class="columns">
			<section class="ingredients">
				<h2>Ingredients</h2>
				{#if recipe.ingredients?.length}
					<ul>
						{#each recipe.ingredients as ingredient}
							{#if ingredient.title}
								<li class="section-title">{ingredient.title}</li>
							{:else}
								<li>{ingredient.display}</li>
							{/if}
						{/each}
					</ul>
				{:else}
					<p class="empty">No ingredients listed.</p>
				{/if}
			</section>

			<section class="instructions">
				<h2>Instructions</h2>
				{#if recipe.instructions?.length}
					<ol>
						{#each recipe.instructions as step}
							<li>
								{#if step.title}<strong>{step.title}</strong>{/if}
								<p>{step.text}</p>
							</li>
						{/each}
					</ol>
				{:else}
					<p class="empty">No instructions listed.</p>
				{/if}
			</section>
		</div>

		{#if recipe.nutrition && Object.values(recipe.nutrition).some(v => v != null)}
			<section class="nutrition">
				<h2>Nutrition</h2>
				<dl>
					{#if recipe.nutrition.calories}<div><dt>Calories</dt><dd>{recipe.nutrition.calories}</dd></div>{/if}
					{#if recipe.nutrition.proteinContent}<div><dt>Protein</dt><dd>{recipe.nutrition.proteinContent}</dd></div>{/if}
					{#if recipe.nutrition.carbohydrateContent}<div><dt>Carbs</dt><dd>{recipe.nutrition.carbohydrateContent}</dd></div>{/if}
					{#if recipe.nutrition.fatContent}<div><dt>Fat</dt><dd>{recipe.nutrition.fatContent}</dd></div>{/if}
					{#if recipe.nutrition.fiberContent}<div><dt>Fiber</dt><dd>{recipe.nutrition.fiberContent}</dd></div>{/if}
					{#if recipe.nutrition.sugarContent}<div><dt>Sugar</dt><dd>{recipe.nutrition.sugarContent}</dd></div>{/if}
					{#if recipe.nutrition.sodiumContent}<div><dt>Sodium</dt><dd>{recipe.nutrition.sodiumContent}</dd></div>{/if}
				</dl>
			</section>
		{/if}

		{#if recipe.notes?.length}
			<section>
				<h2>Notes</h2>
				{#each recipe.notes as note}
					<div class="note">
						{#if note.title}<strong>{note.title}</strong>{/if}
						<p>{note.text}</p>
					</div>
				{/each}
			</section>
		{/if}

		{#if recipe.tools?.length}
			<section>
				<h2>Tools</h2>
				<ul class="tools">
					{#each recipe.tools as tool}
						<li>{tool}</li>
					{/each}
				</ul>
			</section>
		{/if}

		<div class="footer-meta">
			{#if recipe.orgURL}
				<a href={recipe.orgURL} target="_blank" rel="noreferrer">Original recipe</a>
			{/if}
			{#if recipe.dateAdded}<span>Added: {format(parseISO(recipe.dateAdded), 'd MMM yyyy')}</span>{/if}
			{#if recipe.lastMade}<span>Last made: {format(parseISO(recipe.lastMade), 'd MMM yyyy')}</span>{/if}
		</div>
	</article>
{/if}

<style>
	@import '@mixins';

	.back {
		display: inline-block;
		margin-bottom: 1em;
		color: var(--purple_bright);
		text-decoration: none;
		font-size: 0.9em;

		&:hover {
			text-decoration: underline;
		}
	}

	.hero {
		width: 100%;
		max-height: 400px;
		object-fit: cover;
		border-radius: 0.5em;
		margin-bottom: 1em;
	}

	h1 {
		margin-bottom: 0.3em;
	}

	.description {
		font-size: 1.1em;
		color: var(--grey);
		margin: 0 0 1em;
	}

	.meta-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5em;
		margin-bottom: 1em;
		padding: 0.8em;
		background: rgba($blue, 0.08);
		border-radius: 0.3em;
	}

	.meta-item {
		display: flex;
		flex-direction: column;

		& .label {
			font-size: 0.75em;
			text-transform: uppercase;
			color: var(--grey);
			font-weight: 600;
		}
	}

	.tag-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4em;
		margin-bottom: 1.5em;
	}

	.tag {
		padding: 0.15em 0.5em;
		border: 1px solid currentColor;
		border-radius: 0.2em;
		font-size: 0.8em;
		color: var(--blue);

		&.category {
			color: var(--purple_bright);
			font-weight: 600;
		}
	}

	.columns {
		display: grid;
		grid-template-columns: 1fr 2fr;
		gap: 2em;
		margin-bottom: 2em;

		@media (max-width: 700px) {
			grid-template-columns: 1fr;
		}
	}

	.ingredients {
		& ul {
			margin: 0;
			padding: 0;
			list-style: none;
		}

		& li {
			padding: 0.4em 0;
			border-bottom: 1px solid var(--grey_light);
		}

		& .section-title {
			font-weight: 600;
			margin-top: 0.5em;
			border-bottom: none;
			color: var(--navy);
		}
	}

	.instructions {
		& ol {
			margin: 0;
			padding: 0 0 0 1.5em;
		}

		& li {
			margin-bottom: 1em;
		}

		& p {
			margin: 0.2em 0 0;
		}
	}

	.nutrition {
		& dl {
			display: grid;
			grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
			gap: 0.5em;
			margin: 0;
		}

		& div {
			padding: 0.5em;
			background: rgba($blue, 0.08);
			border-radius: 0.3em;
		}

		& dt {
			font-size: 0.75em;
			text-transform: uppercase;
			color: var(--grey);
		}

		& dd {
			margin: 0;
			font-size: 1.1em;
		}
	}

	.note {
		padding: 0.5em;
		margin: 0.3em 0;
		background: rgba($orange, 0.08);
		border-radius: 0.3em;

		& p {
			margin: 0.2em 0 0;
		}
	}

	.tools {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;
		padding: 0;
		list-style: none;

		& li {
			padding: 0.3em 0.7em;
			background: rgba($blue, 0.08);
			border-radius: 0.3em;
			font-size: 0.9em;
		}
	}

	.empty {
		color: var(--grey);
		font-style: italic;
	}

	.footer-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5em;
		margin-top: 2em;
		padding-top: 1em;
		border-top: 1px solid var(--grey_light);
		font-size: 0.85em;
		color: var(--grey);

		& a {
			color: var(--purple_bright);
		}
	}

	section {
		margin-bottom: 2em;
	}
</style>
