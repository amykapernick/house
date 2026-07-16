<script lang="ts">
	import { page } from '$app/stores';
	import { format, parseISO } from 'date-fns';
	import fetchClientData from '$utils/fetchClientData';
	import { recipeQuery, RECIPE_CACHE_TTL } from '$utils/prefetchRecipes';
	import { resolve } from '$app/paths';
	import { formatMinutes } from '$utils/formatMinutes';
	import { getPageTitle } from '$utils/pageTitle';
	import {
		compatibleUnits,
		convertQuantity,
		unitFamilyLabel,
		unitLabel,
		unitOptionLabel,
		unitRoot,
		unitsInFamily,
	} from '$lib/utils/units';
	import type { RecipeIngredientUnit } from '$lib/types/generated';

	let recipe = $state<any>(null);
	let loading = $state(true);
	let multiplier = $state(1);
	let allUnits = $state<RecipeIngredientUnit[]>([]);
	let selectedUnitId = $state<Record<number, string>>({});
	let defaultUnitId = $state<Record<string, string>>({});
	let checkedIngredients = $state<Record<number, boolean>>({});
	let checkedSteps = $state<Record<number, boolean>>({});

	// Distinct unit families (mass, volume, ...) present across the recipe's ingredients,
	// each with every configured unit that can be converted to/from it - powers the
	// top-of-page "default unit" pickers.
	let unitFamilies = $derived.by(() => {
		const families: { root: string; units: RecipeIngredientUnit[] }[] = [];
		for (const ingredient of recipe?.ingredients ?? []) {
			if (!ingredient.unit) continue;
			const root = unitRoot(ingredient.unit, allUnits);
			if (!root || families.some((f) => f.root === root)) continue;
			const units = unitsInFamily(root, allUnits);
			if (units.length > 1) families.push({ root, units });
		}
		return families;
	});

	const SCALE_PRESETS = [1, 2, 3];

	// Common cooking fractions, checked in descending order so eg. 0.75 matches ¾ before ½.
	const FRACTIONS: [number, string][] = [
		[7 / 8, '⅞'], [3 / 4, '¾'], [5 / 8, '⅝'], [2 / 3, '⅔'], [1 / 2, '½'],
		[3 / 8, '⅜'], [1 / 3, '⅓'], [1 / 4, '¼'], [1 / 8, '⅛'],
	];

	function formatQuantity(value: number): string {
		const whole = Math.floor(value);
		const frac = value - whole;
		if (frac < 0.02) return `${whole}`;
		for (const [f, symbol] of FRACTIONS) {
			if (Math.abs(frac - f) < 0.02) return whole > 0 ? `${whole}${symbol}` : symbol;
		}
		return `${Math.round(value * 100) / 100}`;
	}

	function ingredientUnitOptions(ingredient: any): RecipeIngredientUnit[] {
		if (!ingredient.unit) return [];
		return compatibleUnits(ingredient.unit, allUnits);
	}

	function selectedUnit(ingredient: any, i: number): RecipeIngredientUnit | null {
		if (!ingredient.unit) return null;

		// An explicit per-ingredient choice always wins over the family default.
		const chosenId = selectedUnitId[i];
		if (chosenId) return allUnits.find((u) => u.id === chosenId) ?? ingredient.unit;

		const root = unitRoot(ingredient.unit, allUnits);
		const defaultId = root ? defaultUnitId[root] : undefined;
		if (defaultId) return allUnits.find((u) => u.id === defaultId) ?? ingredient.unit;

		return ingredient.unit;
	}

	function scaledIngredientText(ingredient: any, i: number): string {
		const unit = selectedUnit(ingredient, i);
		const converting = unit && ingredient.unit && unit.id !== ingredient.unit.id;
		if (multiplier === 1 && !converting) return ingredient.display;
		if (ingredient.quantity == null) return ingredient.display;

		const baseQuantity = converting
			? (convertQuantity(ingredient.quantity, ingredient.unit, unit!, allUnits) ?? ingredient.quantity)
			: ingredient.quantity;
		const quantity = baseQuantity * multiplier;
		const unitText = unit ? unitLabel(unit, quantity) : ingredient.unit;
		const parts = [formatQuantity(quantity), unitText, ingredient.food].filter(Boolean);
		const text = parts.join(' ');
		return ingredient.note ? `${text} (${ingredient.note})` : text;
	}

	$effect(() => {
		{
			const slug = $page.params.slug;

			function handleRecipe(res: any) {
				recipe = res.recipe ?? null;
				allUnits = res.recipeUnits ?? [];
				selectedUnitId = {};
				defaultUnitId = {};
				checkedIngredients = {};
				checkedSteps = {};
				loading = false;
			}
			fetchClientData({
				cacheKey: `recipe-${slug}`,
				ttl: RECIPE_CACHE_TTL,
				onStale: handleRecipe,
				gqlQuery: recipeQuery(slug ?? ''),
			}).then(handleRecipe);
		}
	});
</script>

<svelte:head>
	<title>{getPageTitle(recipe?.name ?? `Recipe`)}</title>
</svelte:head>

<a href={resolve('/recipes')} class="back">← Recipes</a>

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
			{#if recipe.servings}<div class="meta-item"><span class="label">Servings</span><span>{formatQuantity(recipe.servings * multiplier)}</span></div>{/if}
			{#if recipe.recipeYield}<div class="meta-item"><span class="label">Yield</span><span>{recipe.recipeYield}</span></div>{/if}
		</div>

		{#if recipe.tags?.length || recipe.categories?.length}
			<div class="tag-bar">
				{#each recipe.categories as cat (cat.slug)}
					<span class="tag category">{cat.name}</span>
				{/each}
				{#each recipe.tags as tag (tag.slug)}
					<span class="tag">{tag.name}</span>
				{/each}
			</div>
		{/if}

		<div class="columns">
			<section class="ingredients">
				<div class="ingredients-header">
					<h2>Ingredients</h2>
					<div class="scale-bar">
					<!-- TODO: Style recipe scale -->
						<span class="label">Scale</span>
						{#each SCALE_PRESETS as preset (preset)}
							<button
								type="button"
								class="scale-btn"
								class:active={multiplier === preset}
								onclick={() => (multiplier = preset)}
							>×{preset}</button>
						{/each}
						<input
							type="number"
							min="0.25"
							step="0.25"
							bind:value={multiplier}
							class="scale-custom"
							aria-label="Custom scale"
						/>
					</div>
				</div>
				<!-- TODO: Style recipe unit selection -->
				{#if unitFamilies.length}
					<div class="unit-defaults-bar">
						<span class="label">Units</span>
						{#each unitFamilies as family (family.root)}
							{@const fieldId = `unit-default-${family.root}`}
							<div class="unit-default">
								<label for={fieldId}>{unitFamilyLabel(family.root, allUnits)}</label>
								<select
									id={fieldId}
									class="unit-select"
									value={defaultUnitId[family.root] ?? ''}
									onchange={(e) => {
										const value = e.currentTarget.value;
										if (value) defaultUnitId[family.root] = value;
										else delete defaultUnitId[family.root];
									}}
								>
									<option value="">As written</option>
									{#each family.units as unit (unit.id)}
										<option value={unit.id}>{unitOptionLabel(unit)}</option>
									{/each}
								</select>
							</div>
						{/each}
					</div>
				{/if}
				{#if recipe.ingredients?.length}
					<ul>
						{#each recipe.ingredients as ingredient, i (i)}
							{#if ingredient.title}
								<li class="section-title">{ingredient.title}</li>
							{:else}
								{@const options = ingredientUnitOptions(ingredient)}
								<li class:checked={checkedIngredients[i]}>
									<input
										type="checkbox"
										id="ingredient-{i}"
										checked={checkedIngredients[i] ?? false}
										onchange={() => (checkedIngredients[i] = !checkedIngredients[i])}
										aria-label={`Mark ${ingredient.food ?? ingredient.display} as done`}
									/>
									<label class="check-label" for="ingredient-{i}">
										<span>{scaledIngredientText(ingredient, i)}</span>
									</label>
									{#if options.length}
									<!-- TODO: Style ingredient unit selection -->
										<select
											class="unit-select"
											aria-label={`Convert unit for ${ingredient.food ?? ingredient.display}`}
											value={selectedUnit(ingredient, i)?.id}
											onchange={(e) => (selectedUnitId[i] = e.currentTarget.value)}
										>
											<option value={ingredient.unit.id}>{unitOptionLabel(ingredient.unit)}</option>
											{#each options as option (option.id)}
												<option value={option.id}>{unitOptionLabel(option)}</option>
											{/each}
										</select>
									{/if}
								</li>
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
						{#each recipe.instructions as step, i (i)}
							<li class:checked={checkedSteps[i]}>
								<input
									type="checkbox"
									id="step-{i}"
									checked={checkedSteps[i] ?? false}
									onchange={() => (checkedSteps[i] = !checkedSteps[i])}
									aria-label={`Mark step ${i + 1} as done`}
								/>
								<label class="check-label" for="step-{i}">
									<span>
										{#if step.title}<strong>{step.title}</strong>{/if}
										<p>{step.text}</p>
									</span>
								</label>
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
				{#each recipe.notes as note, i (i)}
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
					{#each recipe.tools as tool, i (i)}
						<li>{tool}</li>
					{/each}
				</ul>
			</section>
		{/if}

		<div class="footer-meta">
			{#if recipe.orgURL}
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- orgURL is the external source recipe page, not an internal route -->
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
		background: color-mix(in srgb, var(--blue) 8%, transparent);
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
		color: var(--navy);

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
		& .ingredients-header {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			justify-content: space-between;
			gap: 0.5em;

			& h2 {
				margin: 0;
			}
		}

		& .scale-bar {
			display: flex;
			align-items: center;
			gap: 0.3em;

			& .label {
				font-size: 0.75em;
				text-transform: uppercase;
				color: var(--grey);
				font-weight: 600;
				margin-right: 0.2em;
			}
		}

		& .scale-btn {
			padding: 0.2em 0.6em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			background: transparent;
			cursor: pointer;
			font-size: 0.85em;

			&:hover {
				border-color: var(--purple_bright);
				color: var(--purple_bright);
			}

			&.active {
				background: var(--purple_bright);
				border-color: var(--purple_bright);
				color: var(--white);
			}
		}

		& .scale-custom {
			width: 3.5em;
			padding: 0.2em 0.4em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			font-size: 0.85em;
		}

		& .unit-defaults-bar {
			display: flex;
			flex-wrap: wrap;
			align-items: center;
			gap: 0.8em;
			margin: 0.6em 0 0.8em;

			& .label {
				font-size: 0.75em;
				text-transform: uppercase;
				color: var(--grey);
				font-weight: 600;
			}
		}

		& .unit-default {
			display: flex;
			align-items: center;
			gap: 0.3em;
			font-size: 0.85em;

			& label {
				color: var(--grey);
			}
		}

		& ul {
			margin: 0;
			padding: 0;
			list-style: none;
		}

		& li {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			gap: 0.5em;
			padding: 0.4em 0;
			border-bottom: 1px solid var(--grey_light);

			&.checked {
				opacity: 0.6;

				& .check-label span {
					color: var(--grey);
					text-decoration: line-through;
				}
			}

			& input {
				display: inline-block;
				width: auto;
				margin: 0;
				padding: 0;
				flex-shrink: 0;
			}
		}

		& .check-label {
			display: flex;
			align-items: center;
			gap: 0.5em;
			cursor: pointer;
		}

		& .unit-select {
			padding: 0.1em 0.3em;
			border: 1px solid var(--grey_light);
			border-radius: 0.3em;
			font-size: 0.8em;
			color: var(--grey);
			background: transparent;
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
			display: flex;
			align-items: flex-start;
			gap: 0.6em;
			margin-bottom: 1em;

			&.checked {
				opacity: 0.6;

				& span {
					text-decoration: line-through;
				}
			}

			& input {
				display: inline-block;
				width: auto;
				margin: 0.3em 0 0;
				padding: 0;
				flex-shrink: 0;
			}
		}

		& .check-label {
			cursor: pointer;
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
			background: color-mix(in srgb, var(--blue) 8%, transparent);
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
		background: color-mix(in srgb, var(--orange) 8%, transparent);
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
			background: color-mix(in srgb, var(--blue) 8%, transparent);
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
