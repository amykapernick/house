<script lang="ts">
	import type { Colour } from '$types/global';
	import type { ClothingLayer } from '$types/generated';
	import Tooltip from '$parts/Tooltip/index.svelte';
	import Info from '$img/icons/info.svg?component';
	import OutfitIcon, { type OutfitExtra } from '../OutfitIcon/index.svelte';
	import styles from './index.module.css';

	let {
		layer,
		outfit,
		label,
		colour,
		class: className = '',
	}: {
		colour?: Colour;
		class?: string;
		layer?: ClothingLayer;
		outfit?: OutfitExtra;
		label?: string;
	} = $props();

	const extraLabels: Record<OutfitExtra, string> = {
		rain: 'rain suit',
		hat: 'hat',
		beanie: 'beanie',
		sunscreen: 'sunscreen',
		mittens: 'mittens',
		socks: 'socks',
		shoes: 'shoes',
		boots: 'boots',
	};

	const formatWord = (value: string) => value.replace(/_/g, ' ');
	const capitalizeFirst = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
	const capitalizeWords = (value: string) => value.replace(/\b\w/g, (char) => char.toUpperCase());

	// material (eg. "cotton_knit") and type (eg. "sweater") can describe the same word twice -
	// drop the type word from the label when it's already implied by the material.
	const formatLayerLabel = ({ type, material, weight, sleeve }: ClothingLayer, length: 'short' | 'full') => {
		// Jacket carries no material qualifier any more (see ClothingLayer.material) - name alone.
		if (type === 'jacket') {
			return length == 'short' ? 'jacket' : [formatWord(weight), 'weight', formatWord(sleeve), 'sleeve', 'jacket'].join(' ');
		}

		const materialWords = formatWord(material ?? ``).split(' ');
		const typeWord = formatWord(type);
		const typeWords = materialWords.includes(typeWord) ? [] : [typeWord];

		const words = length == 'short' ? [...materialWords, ...typeWords] : [formatWord(weight), 'weight', ...materialWords, formatWord(sleeve), 'sleeve', ...typeWords];

		return words.join(' ');
	};

	const shortLabel = $derived(capitalizeWords(layer ? formatLayerLabel(layer, 'short') : outfit ? extraLabels[outfit] : ''));
	const fullLabel = $derived(label ?? capitalizeFirst(layer ? formatLayerLabel(layer, 'full') : outfit ? extraLabels[outfit] : ''));

	const layerClasses = $derived(layer ? `type_${layer.type} material_${layer.material} weight_${layer.weight} sleeve_${layer.sleeve} position_${layer.position}` : outfit ? `outfit_${outfit}` : '');
</script>

<div class={[className, styles.chip, layerClasses]}>
	<span class={styles.icon}
		><OutfitIcon
			{layer}
			{outfit}
		/></span
	>
	<span class="label">{shortLabel}</span>
	<Tooltip label={fullLabel}>
		<Info />
	</Tooltip>
</div>
