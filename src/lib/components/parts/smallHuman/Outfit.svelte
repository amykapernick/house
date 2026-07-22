<script lang="ts">
	import type { Colour } from '$types/global';
	import OnesieLong from '$img/smallHuman/onesie-long.svg?component';
	import OnesieShort from '$img/smallHuman/onesie-short.svg?component';
	import OnesieHalf from '$img/smallHuman/onesie-half.svg?component';
	import Beanie from '$img/smallHuman/beanie.svg?component';
	import Boots from '$img/smallHuman/boots.svg?component';
	import CoatHeavy from '$img/smallHuman/coat-heavy.svg?component';
	import CoatLight from '$img/smallHuman/coat-light.svg?component';
	import CoatRain from '$img/smallHuman/coat-rain.svg?component';
	import Hat from '$img/smallHuman/hat.svg?component';
	import Jeans from '$img/smallHuman/jeans.svg?component';
	import Leggings from '$img/smallHuman/leggings.svg?component';
	import Nappy from '$img/smallHuman/nappy.svg?component';
	import Overalls from '$img/smallHuman/overalls.svg?component';
	import Shirt from '$img/smallHuman/shirt.svg?component';
	import ShirtLong from '$img/smallHuman/shirt-long.svg?component';
	import Shoes from '$img/smallHuman/shoes.svg?component';
	import Shorts from '$img/smallHuman/shorts.svg?component';
	import Singlet from '$img/smallHuman/singlet.svg?component';
	import Socks from '$img/smallHuman/socks.svg?component';

	let {
		colour,
		item,
		weight = 'mid',
		class: className = '',
	}: {
		colour: Colour;
		class?: string;
		weight?: 'light' | 'heavy' | 'mid';
	} = $props();
</script>

<!-- TODO: parse item and weight from clothign recommendation strings -->
<!-- sleep.environment.current_recommendation.recommended_setup.pj_layer -->
<!-- clothing_daytime.indoor_reference[x].recommendation -->
<!-- clothing_daytime.indoor_reference[x].layers -->
<!-- clothing_daytime.outdoor_reference[x].recommendation -->
<!-- clothing_daytime.outdoor_reference[x].layers -->
<!-- clothing_daytime.outdoor_reference[x].extras -->
<!-- clothing_daytime.rain_suit.recommended -->

<!-- Explicit items -->
<!-- clothing_daytime.current_recommendation.indoor/outdoor.layers -->

<div class={`${className}`}>
	<OnesieLong />
</div>

<style>
</style>
