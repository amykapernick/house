<script lang="ts">
	import ItemDefaults from '$data/house/items';
	import type { Area, Item } from '$types/house';

	let { areas = [], items = [] }: { areas: Area[]; items: Item[] } = $props();
	const size = [1189, 1593];
</script>

<div class="container" style="--width: {size[0]}; --height: {size[1]}">
	<svg class="map" viewBox="0 0 {size.join(' ')}" fill="none">
		{#each areas as area (area.id)}
			<g class="area" style="--colour: var(--{area.colour ?? 'primary'})">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- area.link is an external smart-home control URL, not an internal route -->
				<a href={area.link} target="_blank">
					<rect
						class="space"
						rx="0"
						ry="0"
						x={area.start[0]}
						y={area.start[1]}
						width={area.size[0]}
						height={area.size[1]}
					/>
					<text class="label" x={area.start[0] + 10} y={area.start[1] + 40}>
						{area.name}
					</text>
				</a>
			</g>
		{/each}
	</svg>
	{#each items as item (item.area.id + '-' + item.type + '-' + item.start.join(','))}
		{@const itemSize = item.size ?? ItemDefaults[item.type]?.size ?? [30, 30]}
		<!-- item.link is an external smart-home control URL, not an internal route -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			class="item"
			href={item.link}
			style="--width: {(itemSize[0] / size[0]) * 100}%; --height: {(itemSize[1] / size[1]) * 100}%; --offset_x: {(item.start[0] / size[0]) * 100}%; --offset_y: {(item.start[1] / size[1]) * 100}%; --rotate: {item.rotation ? `${item.rotation}deg` : '0deg'}"
		>
			<span class="item-label">{item.type.replaceAll('_', ' ')}</span>
			<span class="sr-only">Control {item.area.name} {item.type}</span>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/each}
	{#each areas as area (area.id)}
		{#if area.info?.length}
			<ul
				class="info"
				style="--offset_x: {(area.start[0] / size[0]) * 100}%; --offset_y: {(area.start[1] / size[1]) * 100}%; --width: {(area.size[0] / size[0]) * 100}%; --height: {(area.size[1] / size[1]) * 100}%"
			>
				{#each area.info as info (info.type)}
					<li class="stat">
						{#if info.type === 'temperature'}
							🌡️ {info.value}°C
						{:else if info.type === 'humidity'}
							💧 {info.value}%
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	{/each}
</div>

<style>
	.container {
		position: relative;
		width: calc(100vh * (var(--width) / var(--height)));
		height: 100vh;

		@media (aspect-ratio <= 1189/1593) {
			width: 90vw;
			height: calc(90vw * (var(--height) / var(--width)));
		}
	}

	.map {
		--primary: var(--blue);

		display: block;
		position: relative;
		z-index: 2;

		& text {
			font-family: var(--font_main);
			font-size: 2em;
		}
	}

	.area {
		color: var(--colour);
	}

	.space {
		stroke-width: 2;
		stroke: var(--colour);
		fill: var(--colour);
		fill-opacity: 0.2;
	}

	.label {
		opacity: 0;
		fill: var(--neutral);
		pointer-events: none;
	}

	.info {
		display: grid;
		position: absolute;
		z-index: 10;
		top: var(--offset_y);
		left: var(--offset_x);
		grid-template-columns: repeat(1, minmax(0, max-content));
		width: var(--width);
		height: var(--height);
		margin: 0;
		padding: 0.1em 0.2em;
		list-style: none;
		place-content: end end;
		place-items: end end;
		gap: 0.1em;
		pointer-events: none;
	}

	.stat {
		display: flex;
		align-items: center;
		margin: 0;
		padding: 0.1em 0.2em;
		border-radius: 0.2em;
		background: var(--navy);
		color: var(--neutral_light);
		white-space: nowrap;
	}

	.item {
		display: flex;
		position: absolute;
		z-index: 20;
		top: var(--offset_y);
		left: var(--offset_x);
		align-items: center;
		justify-content: center;
		width: var(--width);
		height: var(--height);
		transform: rotate(var(--rotate));
	}

	.item-label {
		font-size: 0.6em;
		text-transform: capitalize;
	}
</style>
