<script lang="ts">
	import { page } from '$app/stores';
	import { format, parseISO } from 'date-fns';
	import fetchClientData from '$utils/fetchClientData';
	import { DATE_FORMATS } from '$utils/dateFormats';
	import { recipeQuery, RECIPE_CACHE_TTL } from '$utils/prefetchRecipes';
	import { resolve } from '$app/paths';
	import { formatMinutes } from '$utils/formatMinutes';
	import { getPageTitle } from '$utils/pageTitle';
	import Skeleton from '$components/parts/Skeleton.svelte';
	import Stats from '$parts/Stats.svelte';
	import { compatibleUnits, convertQuantity, unitFamilyLabel, unitLabel, unitOptionLabel, unitRoot, unitsInFamily } from '$lib/utils/units';
	import type { RecipeIngredientUnit } from '$lib/types/generated';
	import Pill from '$components/parts/Pill.svelte';

	let recipe = $state<any>(null);
	let loading = $state(true);
	let multiplier = $state(1);
	let allUnits = $state<RecipeIngredientUnit[]>([]);
	let selectedUnitId = $state<Record<number, string>>({});
	let defaultUnitId = $state<Record<string, string>>({});
	let checkedIngredients = $state<Record<number, boolean>>({});
	let checkedSteps = $state<Record<number, boolean>>({});

	const NUTRITION_LABELS: [key: string, name: string][] = [
		['calories', 'Calories'],
		['proteinContent', 'Protein'],
		['carbohydrateContent', 'Carbs'],
		['fatContent', 'Fat'],
		['fiberContent', 'Fiber'],
		['sugarContent', 'Sugar'],
		['sodiumContent', 'Sodium'],
	];

	let nutritionItems = $derived(
		NUTRITION_LABELS.filter(([key]) => recipe?.nutrition?.[key] != null).map(([key, name]) => ({
			name,
			value: recipe.nutrition[key],
		})),
	);

	let metaItems = $derived.by(() => {
		const items: { name: string; value: string }[] = [];
		if (recipe?.prepTime) items.push({ name: 'Prep', value: formatMinutes(recipe.prepTime) });
		if (recipe?.cookTime) items.push({ name: 'Cook', value: formatMinutes(recipe.cookTime) });
		if (recipe?.totalTime) items.push({ name: 'Total', value: formatMinutes(recipe.totalTime) });
		if (recipe?.performTime) items.push({ name: 'Perform', value: formatMinutes(recipe.performTime) });
		if (recipe?.servings) items.push({ name: 'Servings', value: formatQuantity(recipe.servings * multiplier) });
		if (recipe?.recipeYield) items.push({ name: 'Yield', value: recipe.recipeYield });
		return items;
	});

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
	let isCustomScale = $derived(!SCALE_PRESETS.includes(multiplier));

	// Common cooking fractions, checked in descending order so eg. 0.75 matches ¾ before ½.
	const FRACTIONS: [number, string][] = [
		[7 / 8, '⅞'],
		[3 / 4, '¾'],
		[5 / 8, '⅝'],
		[2 / 3, '⅔'],
		[1 / 2, '½'],
		[3 / 8, '⅜'],
		[1 / 3, '⅓'],
		[1 / 4, '¼'],
		[1 / 8, '⅛'],
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

	function scaledIngredientParts(ingredient: any, i: number): { text?: string; quantity?: string; unit?: string; food?: string; note?: string } {
		if (ingredient.quantity == null) return { text: ingredient.display };

		const unit = selectedUnit(ingredient, i);
		const converting = unit && ingredient.unit && unit.id !== ingredient.unit.id;

		const baseQuantity = converting ? (convertQuantity(ingredient.quantity, ingredient.unit, unit!, allUnits) ?? ingredient.quantity) : ingredient.quantity;
		const quantity = baseQuantity * multiplier;
		const unitText = unit ? unitLabel(unit, quantity) : ingredient.unit;
		return {
			quantity: formatQuantity(quantity),
			unit: unitText || undefined,
			food: ingredient.food || undefined,
			note: ingredient.note || undefined,
		};
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

<a
	href={resolve('/recipes')}
	class="back">← Recipes</a
>

{#if loading}
	<Skeleton rows={3} />
{:else if !recipe}
	<p>Recipe not found.</p>
{:else}
	<article class="recipe">
		<header>
			{#if recipe.image}
				<img
					class="hero"
					src={recipe.image}
					alt={recipe.name}
				/>
			{/if}

			<h1>{recipe.name}</h1>

			{#if recipe.description}
				<p class="description">{recipe.description}</p>
			{/if}

			<!-- TODO: Show serves in freezer -->

			<Stats
				items={metaItems}
				class="meta"
			/>

			<fieldset class="scale">
				<div>
					<legend>Scale</legend>
					{#each SCALE_PRESETS as preset (preset)}
						<input
							type="radio"
							id="scale-{preset}"
							name="scale"
							value={preset}
							bind:group={multiplier}
						/>
						<label for="scale-{preset}">× {preset}</label>
					{/each}
					<input
						type="number"
						min="0.5"
						step="0.5"
						max="10"
						bind:value={multiplier}
						id="scale-custom"
						placeholder="4"
						class:active={isCustomScale}
					/>
					<label
						for="scale-custom"
						class="sr-only">Custom Scale Modifier</label
					>
				</div>
			</fieldset>
			{#if unitFamilies.length}
				<fieldset class="units">
					<div>
						<legend>Units</legend>
						{#each unitFamilies as family (family.root)}
							{@const fieldId = `unit-default-${family.root}`}
							<label for={fieldId}>{unitFamilyLabel(family.root, allUnits)}</label>
							<select
								id={fieldId}
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
						{/each}
					</div>
				</fieldset>
			{/if}

			{#if recipe.tags?.length || recipe.categories?.length}
				<ul class="tags">
					{#each recipe.categories as cat (cat.slug)}
						<li><Pill outline={true}>{cat.name}</Pill></li>
					{/each}
					{#each recipe.tags as tag (tag.slug)}
						<li><Pill outline={true}>{tag.name}</Pill></li>
					{/each}
				</ul>
			{/if}
		</header>

		<!-- TODO: Work out putting ingredients in columns on big screen sizes -->
		<!-- TODO: Show relevant freezer ingredients next to matched ingredients -->
		<!-- TODO: Show freezer components at top of ingredients list -->
		<section class="ingredients">
			<h2>Ingredients</h2>
			{#if recipe.ingredients?.length}
				<ul>
					{#each recipe.ingredients as ingredient, i (i)}
						{#if ingredient.title}
							<li class="section">{ingredient.title}</li>
						{:else}
							{@const options = ingredientUnitOptions(ingredient)}
							{@const parts = scaledIngredientParts(ingredient, i)}
							<li>
								<input
									type="checkbox"
									id="ingredient-{i}"
								/>
								<label for="ingredient-{i}">
									<span class="sr-only">Mark ${ingredient.food ?? ingredient.display} as done </span>
								</label>
								<span class="ingredient">
									{#if parts.text}
										<span class="full">{parts.text}</span>
									{:else}
										{#if parts.quantity}<span class="qty">{parts.quantity}</span>{/if}
										{#if parts.unit}<span class="unit">{parts.unit}</span>{/if}
										{#if parts.food}<span>{parts.food}</span>{/if}
										{#if parts.note}<span>({parts.note})</span>{/if}
									{/if}
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
								</span>
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
							/>
							<label for="step-{i}">
								<span class="sr-only">Mark Step {i} as done</span>
							</label>
							<span>
								{#if step.title}<strong>{step.title}</strong>{/if}
								<p>{step.text}</p>
							</span>
						</li>
					{/each}
				</ol>
			{:else}
				<p>No instructions listed.</p>
			{/if}
		</section>

		{#if recipe.tools?.length}
			<section class="tools">
				<h2>Tools</h2>
				<ul>
					{#each recipe.tools as tool, i (i)}
						<li>{tool}</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if recipe.notes?.length}
			<section class="notes">
				<h2>Notes</h2>
				{#each recipe.notes as note, i (i)}
					<div class="note">
						{#if note.title}<h3>{note.title}</h3>{/if}
						<p>{note.text}</p>
					</div>
				{/each}
			</section>
		{/if}

		{#if nutritionItems.length}
			<section class="nutrition">
				<h2>Nutrition</h2>
				<Stats items={nutritionItems} />
			</section>
		{/if}

		<footer>
			{#if recipe.orgURL}
				<!-- eslint-disable svelte/no-navigation-without-resolve -- orgURL is the external source recipe page, not an internal route -->
				<a
					href={recipe.orgURL}
					target="_blank"
					rel="noreferrer">Original recipe</a
				>
				<!-- eslint-enable svelte/no-navigation-without-resolve -->
			{/if}
			{#if recipe.dateAdded}<span>Added: {format(parseISO(recipe.dateAdded), DATE_FORMATS.full)}</span>{/if}
			{#if recipe.lastMade}<span>Last made: {format(parseISO(recipe.lastMade), DATE_FORMATS.full)}</span>{/if}
		</footer>
	</article>
{/if}

<style>
	@import '@mixins';

	.hero {
		grid-area: image;
		width: 100%;
		max-height: 400px;
		margin-bottom: 1em;
		border-radius: 0.5em;
		object-fit: cover;
	}

	.recipe {
		display: flex;
		flex: 1 1 auto;
		flex-wrap: wrap;

		& header {
			display: grid;
			grid-column-gap: 20px;
			row-gap: 20px;
			grid-template-areas:
				'image'
				'title'
				'desc'
				'meta'
				'scale'
				'units'
				'tags';
			grid-template-columns: 1fr;
			width: 100%;
		}
	}

	h1 {
		grid-area: title;
		margin: 0;
	}

	.description {
		grid-area: desc;
	}

	:global(.meta) {
		grid-area: meta;
	}

	.tags {
		display: flex;
		grid-area: tags;
		flex-wrap: wrap;
		margin: 0;
		padding: 0;
		list-style: none;
		gap: 0.5em;
	}

	.scale {
		grid-area: scale;

		& > div {
			display: grid;
			grid-template-columns: repeat(4, 1fr);
			width: auto;
			max-width: max-content;
		}

		& legend {
			grid-column: 1 / -1;
		}

		& input[type='radio'] {
			@include sr_only;

			&:checked {
				& + label {
					@include theme_gradient(purple_bright);

					color: var(--purple_bright_text);
				}
			}
		}

		& label,
		& input {
			@include button;

			grid-column: unset;
			width: 6ch;
			margin: 0;
			padding-right: 0.2em;
			padding-left: 0.2em;
			border: 1px solid var(--purple_bright);
			background: var(--transparent);
			color: var(--purple_bright);
			font-weight: 700;
			text-align: center;
		}

		& input[type='number'] {
			&:focus,
			&.active {
				@include theme_gradient(purple_bright);

				color: var(--purple_bright_text);
			}
		}
	}

	.units {
		grid-area: units;

		& > div {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			width: auto;
			max-width: max-content;
		}

		& legend {
			grid-column: 1 / -1;
		}

		& label {
			grid-column: unset;
			grid-row: 3;
			margin: 0;
			font-weight: 600;
			justify-self: end;
		}

		/* TODO: Style all select fields */
		& select {
			grid-column: unset;
			grid-row: 2;
			width: max-content;
			margin: 0;
		}
	}

	.ingredients,
	.instructions {
		& li {
			position: relative;
			margin-left: 2em;

			& input[type='checkbox'] {
				position: absolute;
				top: -0.1em;
				left: -2.3em;
				width: 1em;
				height: 1em;
				font-size: 1.4em;

				& + label {
					&::before {
						content: '';
						position: absolute;
						inset: 0 0 0 -4em;
					}
				}

				&:checked {
					& + label {
						& + span {
							text-decoration: line-through;
						}
					}
				}
			}
		}

		& .section {
			margin-left: 0;
			font-size: 1.1em;
			font-weight: 600;
		}
	}

	.ingredients {
		& ul {
			margin: 0;
			padding: 0 1.5em;
			list-style: none;
		}

		& li {
			&:not(:last-child) {
				margin-bottom: 0.7em;
			}
		}
	}

	.ingredient {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 0.7ch;

		& > * {
			flex: 0 0 auto;
		}

		& .unit {
			&:has(~ .unit-select) {
				@include sr_only;

				cursor: pointer;
			}
		}

		& .qty {
			order: -1;
		}

		& .unit-select {
			z-index: 5;
			order: -1;
			width: max-content;
			margin: 0 0.1em;
			padding: 0;
			border: none;
			border-radius: 0.2em;
			background: rgba(var(--input_bg), 0.5);
			font: inherit;
			line-height: inherit;
		}
	}

	.instructions {
		& li {
			margin-left: 2em;

			& input[type='checkbox'] {
				left: -2.8em;
			}
		}
	}

	.note {
		margin-left: auto;
		padding: 1em 1.5em;
		border-radius: 0.8em;
		background: var(--sidebar_bg);
		color: var(--text_secondary);

		& h3 {
			margin: 0;
			color: var(--text_primary);
			font-weight: 700;
		}
	}

	.nutrition,
	footer {
		width: 100%;
	}

	footer {
		display: flex;
		flex-wrap: wrap;
		justify-content: end;
		margin-top: 3em;
		padding-top: 2em;
		border-top: 1px solid color-mix(in oklch, var(--background) 92%, var(--black));
		color: var(--text_secondary);
		font-size: 0.8em;
		gap: 20px;

		& a {
			margin-right: auto;
		}
	}

	@media (width >= 35em) {
		.recipe {
			& header {
				row-gap: 10px;
				grid-template-areas:
					'image image'
					'title title'
					'desc desc'
					'meta meta'
					'scale units'
					'tags tags';
				grid-template-columns: 1fr 1fr;
			}
		}
	}

	@media (width >= 40em) {
		.instructions,
		.notes {
			width: 70%;
		}

		.ingredients,
		.tools {
			width: 30%;
		}
	}

	@media (width >= 55em) {
		.recipe {
			& header {
				grid-template-areas:
					'image image image'
					'title title title'
					'desc desc desc'
					'meta scale units '
					'tags tags tags';
				grid-template-columns: 1fr auto auto;
			}
		}
	}
</style>
