<script lang="ts">
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
	import Sweater from '$img/smallHuman/sweater-svgrepo-com.svg?component';
	import type { ClothingLayer, ClothingType, SleeveLength } from '$types/generated';
	import styles from './index.module.css';

	export type OutfitExtra = 'rain' | 'hat' | 'beanie' | 'sunscreen' | 'mittens' | 'socks' | 'shoes' | 'boots';

	let {
		layer,
		outfit,
		class: className = '',
	}: {
		class?: string;
		layer?: ClothingLayer;
		outfit?: OutfitExtra;
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

	const parseLayerIcon = ({ type, sleeve }: ClothingLayer) => {
		if (type === 'onesie') return onesieIcons[sleeve];
		if (type === 'jacket') return CoatHeavy;

		return layerIcons[type] ?? OnesieLong;
	};

	const Icon = $derived(layer ? parseLayerIcon(layer) : outfit ? extraIcons[outfit] : OnesieLong);
</script>

<span class={[className, styles.icon]}><Icon /></span>
