<script lang="ts">
	import { differenceInDays, parseISO, format } from 'date-fns';
	import Wheat from '$lib/img/icons/grain.svg?component';
	import Cow from '$lib/img/icons/cow-2.svg?component';
	import Sesame from '$lib/img/icons/sesame.svg?component';
	import Prawn from '$lib/img/icons/shrimp.svg?component';
	import Fish from '$lib/img/icons/fish-2.svg?component';
	import Egg from '$lib/img/icons/fried-egg.svg?component';
	import Peanut from '$lib/img/icons/peanut.svg?component';
	import SoySauce from '$lib/img/icons/soy-sauce.svg?component';

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

	function allergenUrgency(due: string | null): 'urgent' | 'upcoming' | undefined {
		if (!due) return;
		const days = differenceInDays(parseISO(due), new Date());
		if (days < 2) return 'urgent';
		if (days < 4) return 'upcoming';
		return;
	}

	function allergenDueLabel(due: string | null): string {
		if (!due) return '';
		const days = differenceInDays(parseISO(due), new Date());
		if (days < 0) return `${Math.abs(days)}d overdue`;
		if (days === 0) return 'today';
		if (days === 1) return 'tomorrow';
		return format(parseISO(due), 'EEE');
	}
</script>

{#if allergens.length}
	<ul class="list">
		{#each allergens as allergen (allergen.id)}
			{@const Icon = Allergens[allergen.name]}
			<button
				class="allergen-btn"
				data-urgency={allergenUrgency(allergen.due)}
				disabled={completing.has(allergen.id)}
				onclick={() => completeAllergen(allergen.id)}
				style:order={differenceInDays(parseISO(allergen.due), new Date())}
			>
				<span class="label">{allergen.name}</span>
				{#if Icon}<Icon class="icon" />{/if}
				<span class="due">{allergenDueLabel(allergen.due)}</span>
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
