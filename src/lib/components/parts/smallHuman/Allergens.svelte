<script lang="ts">
	import { parseISO, format } from 'date-fns';
	import Wheat from '$img/smallHuman/grain.svg?component';
	import Cow from '$img/smallHuman/cow-2.svg?component';
	import Sesame from '$img/smallHuman/sesame.svg?component';
	import Prawn from '$img/smallHuman/shrimp.svg?component';
	import Fish from '$img/smallHuman/fish-2.svg?component';
	import Egg from '$img/smallHuman/fried-egg.svg?component';
	import Peanut from '$img/smallHuman/peanut.svg?component';
	import SoySauce from '$img/smallHuman/soy-sauce.svg?component';

	let {
		allergens = [],
		completeAllergen = () => {},
		completing = new Set(),
		class: className = '',
	}: {
		allergens: any[];
		completeAllergen: (id: string) => void,
		completing: Set<string>;
		class?: string;
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
	<ul class="list {className}">
		{#each allergens as allergen (allergen.id)}
			{@const Icon = Allergens[allergen.name]}
			<li style:order={allergen.daysUntilDue}>
				<button
					class="allergen-btn"
					data-urgency={allergen.urgency}
					disabled={completing.has(allergen.id)}
					onclick={() => completeAllergen(allergen.id)}
				>
					<span class="label">{allergen.name}</span>
					{#if Icon}<Icon class="icon" />{/if}
					<span class="due">{allergenDueLabel(allergen.daysUntilDue, allergen.due)}</span>
				</button>
			</li>
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
		color: var(--black);
		font-size: 0.9em;
		transition: opacity 0.15s;
		background: color-mix(in srgb, var(--colour) 15%, var(--white_true));

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
