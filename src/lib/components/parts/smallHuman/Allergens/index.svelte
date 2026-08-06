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
	import styles from './index.module.css';

	let {
		allergens = [],
		completeAllergen = () => {},
		completing = new Set(),
		class: className = '',
	}: {
		allergens: any[];
		completeAllergen: (id: string) => void;
		completing: Set<string>;
		class?: string;
	} = $props();

	const Allergens: Record<string, any> = {
		Gluten: Wheat,
		Dairy: Cow,
		Sesame: Sesame,
		Shellfish: Prawn,
		Fish: Fish,
		Egg: Egg,
		Nuts: Peanut,
		Soy: SoySauce,
	};

	function allergenDueLabel(daysUntilDue: number | null, due: string | null): string {
		if (daysUntilDue == null || !due) return '';
		if (daysUntilDue < 0) return `${Math.abs(daysUntilDue)}d overdue`;
		if (daysUntilDue === 0) return 'today';
		if (daysUntilDue === 1) return 'tomorrow';
		return format(parseISO(due), 'EEE');
	}
</script>

{#if allergens.length}
	<ul class="{styles.list} {className}">
		{#each allergens as allergen (allergen.id)}
			{@const Icon = Allergens[allergen.name]}
			<li style:order={allergen.daysUntilDue}>
				<button
					class="allergen-btn"
					data-urgency={allergen.urgency}
					disabled={completing.has(allergen.id)}
					onclick={() => completeAllergen(allergen.id)}
				>
					<span class={styles.label}>{allergen.name}</span>
					{#if Icon}<Icon class="icon" />{/if}
					<span class={styles.due}>{allergenDueLabel(allergen.daysUntilDue, allergen.due)}</span>
				</button>
			</li>
		{/each}
	</ul>
{/if}
