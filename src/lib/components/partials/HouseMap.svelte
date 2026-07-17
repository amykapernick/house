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

	let {
		areas = [],
		items = [],
		editMode = false,
		onAreaDrag,
		onAreaResize,
		onItemDrag,
		onAreaClick,
		onItemClick,
		onMapClick,
		class: className = '',
	}: {
		areas: Area[];
		items: Item[];
		editMode?: boolean;
		onAreaDrag?: (id: string, start: [number, number]) => void;
		onAreaResize?: (id: string, size: [number, number]) => void;
		onItemDrag?: (id: string, start: [number, number]) => void;
		onAreaClick?: (id: string) => void;
		onItemClick?: (id: string) => void;
		onMapClick?: (point: [number, number]) => void;
		class?: string;
	} = $props();
	const size = [1189, 1593];
	const MIN_AREA_SIZE = 20;

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

	let svgEl: SVGSVGElement | undefined = $state();
	let containerEl: HTMLDivElement | undefined = $state();

	type DragState = {
		kind: `area` | `area-resize` | `item`;
		id: string;
		offsetX: number;
		offsetY: number;
		startClientX: number;
		startClientY: number;
		moved: boolean;
		containerRect: DOMRect | null;
	};

	let dragState = $state<DragState | null>(null);

	// A pointer move under this distance is still treated as a click (opens the edit modal)
	// rather than a drag - without this, even a stationary click would jitter start by a pixel.
	const CLICK_THRESHOLD_PX = 4;

	function clamp(n: number, min: number, max: number) {
		return Math.min(Math.max(n, min), max);
	}

	// Areas are native SVG <rect>s, so the SVG's own screen-to-viewBox transform is exact
	// regardless of how the container is scaled/letterboxed by its responsive CSS sizing.
	function svgPoint(clientX: number, clientY: number) {
		const ctm = svgEl?.getScreenCTM();
		if (!ctm) return { x: 0, y: 0 };
		const point = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
		return { x: point.x, y: point.y };
	}

	// Items are percentage-positioned HTML siblings of the <svg>, not inside it, so there's no
	// CTM to use - convert via the container's live rendered box instead. Read once at drag
	// start (passed in as `rect`), not on every move, since layout can't reflow mid-drag.
	function itemPoint(clientX: number, clientY: number, rect: DOMRect) {
		return {
			x: ((clientX - rect.left) / rect.width) * size[0],
			y: ((clientY - rect.top) / rect.height) * size[1],
		};
	}

	function pointFromEvent(e: PointerEvent, state: DragState) {
		return state.kind === `item`
			? itemPoint(e.clientX, e.clientY, state.containerRect!)
			: svgPoint(e.clientX, e.clientY);
	}

	function startDrag(e: PointerEvent, kind: `area` | `item`, id: string, start: number[]) {
		if (!editMode) return;
		e.preventDefault();

		const containerRect = kind === `item` ? (containerEl?.getBoundingClientRect() ?? null) : null;
		const point = kind === `area` ? svgPoint(e.clientX, e.clientY) : itemPoint(e.clientX, e.clientY, containerRect!);

		dragState = {
			kind,
			id,
			offsetX: point.x - start[0],
			offsetY: point.y - start[1],
			startClientX: e.clientX,
			startClientY: e.clientY,
			moved: false,
			containerRect,
		};
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
	}

	// Tracks the offset from the pointer to the area's *current* bottom-right corner, then on
	// move recomputes that corner and derives a new size from it - same offset-capture pattern
	// as startDrag, just anchored to the opposite corner instead of the top-left.
	function startAreaResize(e: PointerEvent, area: Area) {
		if (!editMode) return;
		e.preventDefault();

		const point = svgPoint(e.clientX, e.clientY);
		const cornerX = area.start[0] + area.size[0];
		const cornerY = area.start[1] + area.size[1];

		dragState = {
			kind: `area-resize`,
			id: area.id,
			offsetX: point.x - cornerX,
			offsetY: point.y - cornerY,
			startClientX: e.clientX,
			startClientY: e.clientY,
			moved: false,
			containerRect: null,
		};
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (!dragState) return;

		if (!dragState.moved) {
			const distance = Math.hypot(e.clientX - dragState.startClientX, e.clientY - dragState.startClientY);
			if (distance <= CLICK_THRESHOLD_PX) return;
			dragState.moved = true;
		}

		e.preventDefault();
		const point = pointFromEvent(e, dragState);

		if (dragState.kind === `area-resize`) {
			const area = areas.find((a) => a.id === dragState!.id);
			if (!area) return;
			const cornerX = clamp(point.x - dragState.offsetX, area.start[0] + MIN_AREA_SIZE, size[0]);
			const cornerY = clamp(point.y - dragState.offsetY, area.start[1] + MIN_AREA_SIZE, size[1]);
			onAreaResize?.(dragState.id, [cornerX - area.start[0], cornerY - area.start[1]]);
			return;
		}

		const x = clamp(point.x - dragState.offsetX, 0, size[0]);
		const y = clamp(point.y - dragState.offsetY, 0, size[1]);

		if (dragState.kind === `area`) onAreaDrag?.(dragState.id, [x, y]);
		else onItemDrag?.(dragState.id, [x, y]);
	}

	function handlePointerUp(kind: `area` | `area-resize` | `item`, id: string) {
		if (!dragState || dragState.id !== id || dragState.kind !== kind) {
			dragState = null;
			return;
		}

		const wasDrag = dragState.moved;
		dragState = null;

		if (!wasDrag && kind !== `area-resize`) {
			if (kind === `area`) onAreaClick?.(id);
			else onItemClick?.(id);
		}
	}

	function handleMapClick(e: MouseEvent) {
		// Only place a new item when the click lands on the map background itself, not a
		// bubbled click from an area rect (which has its own click handling above).
		if (!editMode || !onMapClick || e.target !== e.currentTarget) return;

		const point = svgPoint(e.clientX, e.clientY);
		onMapClick([point.x, point.y]);
	}
</script>

<div class="container {className}" style="

--width: {size[0]}; --height: {size[1]}" bind:this={containerEl}>
	<!-- Placing a new item/area by clicking the map background is a spatial drag-editing
		affordance with no keyboard equivalent in this pass; the toolbar buttons remain fully
		keyboard-operable for add/edit/delete. -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<svg class="map" viewBox="0 0 {size.join(' ')}" fill="none" bind:this={svgEl} onclick={handleMapClick}>
		{#each areas as area (area.id)}
			<g class="area" style="

--colour: var(--{area.colour ?? 'primary'})">
				<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- area.link is an external smart-home control URL, not an internal route -->
				<a href={editMode ? undefined : area.link} target={editMode ? undefined : '_blank'}>
					<!-- Drag-to-reposition in edit mode; the wrapping <a> (external HA link,
						non-edit mode) and the edit modal opened by a non-drag click remain
						keyboard-operable. -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<rect
						class="space"
						class:draggable={editMode}
						rx="0"
						ry="0"
						x={area.start[0]}
						y={area.start[1]}
						width={area.size[0]}
						height={area.size[1]}
						onpointerdown={(e) => startDrag(e, 'area', area.id, area.start)}
						onpointermove={handlePointerMove}
						onpointerup={() => handlePointerUp('area', area.id)}
						onpointercancel={() => (dragState = null)}
					/>
					<text class="label" x={area.start[0] + 10} y={area.start[1] + 40}>
						{area.name}
					</text>
				</a>
				{#if editMode}
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<circle
						class="resize_handle"
						cx={area.start[0] + area.size[0]}
						cy={area.start[1] + area.size[1]}
						r="10"
						onpointerdown={(e) => startAreaResize(e, area)}
						onpointermove={handlePointerMove}
						onpointerup={() => handlePointerUp('area-resize', area.id)}
						onpointercancel={() => (dragState = null)}
					/>
				{/if}
			</g>
		{/each}
	</svg>
	{#each items as item (item.id)}
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
			class:draggable={editMode}
			href={editMode ? undefined : item.link}
			style="

--width: {(itemSize[0] / size[0]) * 100}%; --height: {(itemSize[1] / size[1]) * 100}%; --offset_x: {(item.start[0] / size[0]) * 100}%; --offset_y: {(item.start[1] / size[1]) * 100}%; --rotate: {item.rotation ? `${item.rotation}deg` : '0deg'}"
			onpointerdown={(e) => startDrag(e, 'item', item.id, item.start)}
			onpointermove={handlePointerMove}
			onpointerup={() => handlePointerUp('item', item.id)}
			onpointercancel={() => (dragState = null)}
		>
			{#if Icon}<Icon class="item-icon" data-power={power} />{/if}
			<span class="sr-only">Control {item.area?.name ?? 'Unassigned'} {item.type}{power ? ` (${power})` : ''}</span>
		</a>
		<!-- eslint-enable svelte/no-navigation-without-resolve -->
	{/each}
	{#each areas as area (area.id)}
		{#if area.info?.length}
			<ul
				class="info"
				style="

--offset_x: {(area.start[0] / size[0]) * 100}%; --offset_y: {(area.start[1] / size[1]) * 100}%; --width: {(area.size[0] / size[0]) * 100}%; --height: {(area.size[1] / size[1]) * 100}%"
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

		&.draggable {
			cursor: grab;
			touch-action: none;
		}
	}

	.resize_handle {
		stroke-width: 2;
		stroke: var(--background);
		fill: var(--colour);
		cursor: nwse-resize;
		touch-action: none;
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

		&.draggable {
			cursor: grab;
			touch-action: none;
		}

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
