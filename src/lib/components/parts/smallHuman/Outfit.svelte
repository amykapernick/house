<script lang="ts">
	import type { Colour } from '$types/global';
	import OnesieLong from '$img/smallHuman/onesie-long.svg?component';
	import OnesieShort from '$img/smallHuman/onesie-short.svg?component';
	import Beanie from '$img/smallHuman/beanie.svg?component';
	import Boots from '$img/smallHuman/boots.svg?component';
	import CoatHeavy from '$img/smallHuman/coat-heavy.svg?component';
	import CoatLight from '$img/smallHuman/coat-light.svg?component';
	import CoatRain from '$img/smallHuman/coat-rain.svg?component';
	import Hat from '$img/smallHuman/hat.svg?component';
	import Shirt from '$img/smallHuman/shirt.svg?component';
	import Shoes from '$img/smallHuman/shoes.svg?component';
	import Singlet from '$img/smallHuman/singlet.svg?component';
	import Socks from '$img/smallHuman/socks.svg?component';
	import Mittens from '$img/smallHuman/glove-colored.svg?component';
	import Sunscreen from '$img/smallHuman/sun-cream-svgrepo-com.svg?component';
	import type { ClothingLayer, ClothingType, SleeveLength } from '$types/generated';
	import Tooltip from '$parts/Tooltip.svelte';
	import Info from '$img/icons/info.svg';
	import Sweater from '$img/smallHuman/sweater-svgrepo-com.svg?component';

	type OutfitExtra = 'rain' | 'hat' | 'beanie' | 'sunscreen' | 'mittens' | 'socks' | 'shoes' | 'boots';

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

	// Types with a single icon regardless of weight/sleeve. bodysuit/vest have no
	// dedicated art yet - bodysuit reads visually as a short-sleeve onesie, vest as a singlet.
	// jacket is handled separately below (always CoatHeavy, not part of this map).
	const layerIcons: Record<Exclude<ClothingType, 'onesie' | 'jacket'>, typeof OnesieLong> = {
		bodysuit: OnesieShort,
		tshirt: Shirt,
		sweater: Sweater,
		jumper: CoatLight,
		rainsuit: CoatRain,
		vest: Singlet,
	};

	const onesieIcons: Record<SleeveLength, typeof OnesieLong> = {
		long: OnesieLong,
		short: OnesieShort,
		none: OnesieShort,
	};

	const extraIcons: Record<OutfitExtra, typeof Hat> = {
		rain: CoatRain,
		hat: Hat,
		beanie: Beanie,
		sunscreen: Sunscreen,
		mittens: Mittens,
		socks: Socks,
		shoes: Shoes,
		boots: Boots,
	};

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

	const parseLayerIcon = ({ type, sleeve }: ClothingLayer) => {
		if (type === 'onesie') return onesieIcons[sleeve];
		if (type === 'jacket') return CoatHeavy;

		return layerIcons[type] ?? OnesieLong;
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

	const OutfitIcon = $derived(layer ? parseLayerIcon(layer) : outfit ? extraIcons[outfit] : OnesieLong);
	const shortLabel = $derived(capitalizeWords(layer ? formatLayerLabel(layer, 'short') : outfit ? extraLabels[outfit] : ''));
	const fullLabel = $derived(label ?? capitalizeFirst(layer ? formatLayerLabel(layer, 'full') : outfit ? extraLabels[outfit] : ''));

	const layerClasses = $derived(layer ? `type_${layer.type} material_${layer.material} weight_${layer.weight} sleeve_${layer.sleeve} position_${layer.position}` : outfit ? `outfit_${outfit}` : '');
</script>

<div class={`${className} chip ${layerClasses}`}>
	<span class="icon"><OutfitIcon /></span>
	<span class="label">{shortLabel}</span>
	<Tooltip label={fullLabel}>
		<Info />
	</Tooltip>
</div>

<style>
	.chip {
		display: inline-block;
		min-width: 7em;
		padding: 0.7em 1em;
		border: 1.5px solid currentColor;
		border-radius: 0.7em;
		background: var(--navy_bg);
		color: var(--navy);
		font-weight: 600;
		text-align: center;

		& :global(.tooltip-trigger) {
			position: absolute;
			top: 0.5em;
			right: 0.5em;
			color: var(--navy);

			& :global(svg) {
				width: 1em;
				height: 1em;
			}
		}
	}

	.icon {
		display: flex;
		justify-content: center;
		margin: 0 auto 0.4em;
		font-size: 3em;
	}
</style>
