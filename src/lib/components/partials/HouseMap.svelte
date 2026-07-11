<script lang="ts">
	import ItemDefaults from '$data/house/items';
	import type { Area, Item } from '$types/house';
	import Aircon from '$img/house/aircon.svg?component';
	import Alarm from '$img/house/alarm.svg?component';
	import Bed from '$img/house/double-bed.svg?component';
	import Camera from '$img/house/security-camera.svg?component';
	import Computer from '$img/house/computer.svg?component';
	import Doorbell from '$img/house/doorbell.svg?component';
	import Fan from '$img/house/fan.svg?component';
	import FanLight from '$img/house/fan-light.svg?component';
	import FanPedestol from '$img/house/fan-2.svg?component';
	import Fire from '$img/house/fireplace.svg?component';
	import Fridge from '$img/house/fridge.svg?component';
	import Lamp from '$img/house/floor-lamp.svg?component';
	import Laptop from '$img/house/laptop.svg?component';
	import Light from '$img/house/light.svg?component';
	import LightSwitch from '$img/house/light-control.svg?component';
	import Monitor from '$img/house/monitor.svg?component';
	import Oven from '$img/house/oven.svg?component';
	import Pi from '$img/house/raspberry-pi.svg?component';
	import RobotVacuum from '$img/house/robot-cleaner.svg?component';
	import Speaker from '$img/house/speaker.svg?component';
	import Tv from '$img/house/vintage-tv.svg?component';
	import WashingMachine from '$img/house/washing-machine.svg?component';
	import WifiRouter from '$img/house/router.svg?component';

	let { areas = [], items = [] }: { areas: Area[]; items: Item[] } = $props();
	const size = [1189, 1593];

	const ItemIcons: Record<string, any> = {
		aircon: Aircon,
		alarm: Alarm,
		bed: Bed,
		camera: Camera,
		computer: Computer,
		doorbell: Doorbell,
		fan: Fan,
		fan_light: FanLight,
		fan_pedestol: FanPedestol,
		fire: Fire,
		fridge: Fridge,
		lamp: Lamp,
		laptop: Laptop,
		light: Light,
		light_switch: LightSwitch,
		monitor: Monitor,
		oven: Oven,
		pi: Pi,
		robot_vacuum: RobotVacuum,
		speaker: Speaker,
		tv: Tv,
		washing_machine: WashingMachine,
		wifi_router: WifiRouter,
	};
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
		{@const Icon = ItemIcons[item.type]}
		{@const power = !item.state?.length
			? undefined
			: item.state.some((s) => s.state === 'error')
				? 'error'
				: item.state.every((s) => s.state === 'off')
					? 'off'
					: 'on'}
		<!-- item.link is an external smart-home control URL, not an internal route -->
		<!-- eslint-disable svelte/no-navigation-without-resolve -->
		<a
			class="item"
			href={item.link}
			style="--width: {(itemSize[0] / size[0]) * 100}%; --height: {(itemSize[1] / size[1]) * 100}%; --offset_x: {(item.start[0] / size[0]) * 100}%; --offset_y: {(item.start[1] / size[1]) * 100}%; --rotate: {item.rotation ? `${item.rotation}deg` : '0deg'}"
		>
			{#if Icon}<Icon class="item-icon" data-power={power} />{/if}
			<span class="sr-only">Control {item.area.name} {item.type}{power ? ` (${power})` : ''}</span>
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
		color: var(--navy_text);
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

		& :global(.item-icon) {
			width: 100%;
			height: 100%;
			transition: opacity 0.2s, filter 0.2s;
		}

		& :global(.item-icon[data-power='off']) {
			filter: grayscale(1);
			opacity: 0.4;
		}

		& :global(.item-icon[data-power='error']) {
			filter: drop-shadow(0 0 0.15em var(--red));
		}
	}
</style>
