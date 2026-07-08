<script lang="ts">
	import { parseISO, format } from 'date-fns';
	import Wheat from '$img/icons/grain.svg?component';
	import Cow from '$img/icons/cow-2.svg?component';
	import Sesame from '$img/icons/sesame.svg?component';
	import Prawn from '$img/icons/shrimp.svg?component';
	import Fish from '$img/icons/fish-2.svg?component';
	import Egg from '$img/icons/fried-egg.svg?component';
	import Peanut from '$img/icons/peanut.svg?component';
	import SoySauce from '$img/icons/soy-sauce.svg?component';

	let { 
		allergens = [], 
		completeAllergen = () => {},
		completing = new Set()
	}: { 
		allergens: any[]; 
		completeAllergen: (id: string) => void,
		completing: Set<string>;
	} = $props();

	const Allergens: Record<string, any> = {
		'Gluten': Wheat,
		'Dairy': Cow,
		'Sesame': Sesame,
		'Shellfish': Prawn,
		'Fish': Fish,
		'Egg': Egg,
		'Nuts': Peanut,
		'Soy': SoySauce
	}

	function allergenDueLabel(daysUntilDue: number | null, due: string | null): string {
		if (daysUntilDue == null || !due) return '';
		if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)}d overdue`;
		if (daysUntilDue === 0) return 'today';
		if (daysUntilDue === 1) return 'tomorrow';
		return format(parseISO(due), 'EEE');
	}
</script>

{#if allergens.length}
	<ul class="list">
		{#each allergens as allergen (allergen.id)}
			{@const Icon = Allergens[allergen.name]}
			<button
				class="allergen-btn"
				data-urgency={allergen.urgency}
				disabled={completing.has(allergen.id)}
				onclick={() => completeAllergen(allergen.id)}
				style:order={allergen.daysUntilDue}
			>
				<span class="label">{allergen.name}</span>
				{#if Icon}<Icon class="icon" />{/if}
				<span class="due">{allergenDueLabel(allergen.daysUntilDue, allergen.due)}</span>
			</button>
		{/each}
	</ul>
{/if}

<style>
@import '@mixins';

	.list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em;
		list-style: none;
		margin-bottom: 2em;
		font-weight: 700;
		padding: 0;
	}

	button {
		--colour: var(--green);

		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.6em 1em;
		border: 2px solid var(--colour);
		border-radius: 0.4em;
		cursor: pointer;
		color: var(--colour);
		font-size: 0.9em;
		transition: opacity 0.15s;
		background: color-mix(in srgb, var(--colour) 15%, white);

		&:disabled {
			opacity: 0.4;
			filter: grayscale(0.4);
			cursor: wait;
		}

		&[data-urgency='urgent'] {
			--colour: var(--red);
		}

		&[data-urgency='upcoming'] {
			--colour: var(--orange);
		}

		&:hover:not(:disabled) {
			opacity: 0.7;
		}

		& :global(svg) {
			height: 2em;
			margin-bottom: 0.2em;
		}
	}

	.label {
		@include sr_only;
	}

	.due {
		font-size: 0.75em;
		font-weight: 400;
	}
</style>
