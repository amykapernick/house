<script lang="ts">
	import { format, parseISO } from 'date-fns';
	import type { SunTimes } from '$types/generated';
	import { mapTimeToX } from '$utils/sunPath';
	import styles from './index.module.css';

	let {
		sun,
		class: className = '',
	}: {
		sun: SunTimes | null;
		class?: string;
	} = $props();

	const MOON_PHASE_ICONS: Record<string, string> = {
		new_moon: '🌑',
		waxing_crescent: '🌒',
		first_quarter: '🌓',
		waxing_gibbous: '🌔',
		full_moon: '🌕',
		waning_gibbous: '🌖',
		last_quarter: '🌗',
		waning_crescent: '🌘',
	};
	const MOON_PHASE_LABELS: Record<string, string> = {
		new_moon: 'New moon',
		waxing_crescent: 'Waxing crescent',
		first_quarter: 'First quarter',
		waxing_gibbous: 'Waxing gibbous',
		full_moon: 'Full moon',
		waning_gibbous: 'Waning gibbous',
		last_quarter: 'Last quarter',
		waning_crescent: 'Waning crescent',
	};

	const formatTime = (iso: string | null | undefined) => (iso ? format(parseISO(iso), 'h:mm a') : '—');

	// Chart geometry - horizon line at CY, curve deviates +-AMPLITUDE either side of it, scaled
	// from the real +-90deg altitude range returned by the API. This is SVG layout, not
	// astronomy, so it stays local to the component, matching PieChart's own polar()/path-building
	// helpers living alongside its markup.
	const W = 400;
	const H = 230;
	const CY = 130;
	const AMPLITUDE = 90;
	const toY = (elevationDegrees: number) => CY - AMPLITUDE * (elevationDegrees / 90);

	// `path` is centered on the instant Home Assistant computed it for (see buildElevationPath in
	// household_api) - using its own center point as "now", rather than the browser's live clock,
	// keeps the sun/moon markers exactly on the curve they were sampled from. It only moves when
	// the dashboard query re-fetches (same cadence as the rest of the dashboard's cached data).
	let chart = $derived.by(() => {
		// A stale localStorage cache entry from before this widget shipped won't have `path` (or
		// the elevation fields below) - degrade to no chart rather than throwing, until the
		// dashboard query's fresh response replaces it.
		if (!sun?.path?.length) return null;

		const domainStart = sun.path[0].time;
		const domainEnd = sun.path[sun.path.length - 1].time;
		const nowIso = sun.path[Math.floor(sun.path.length / 2)].time;
		const toX = (iso: string) => mapTimeToX(iso, domainStart, domainEnd) * W;

		const points = sun.path.map((p) => ({ x: toX(p.time), y: toY(p.sunElevation) }));
		const nowX = toX(nowIso);
		const sunriseX = sun.sunrise ? toX(sun.sunrise) : null;
		const sunsetX = sun.sunset ? toX(sun.sunset) : null;
		const dawnX = sun.dawn ? toX(sun.dawn) : null;
		const duskX = sun.dusk ? toX(sun.dusk) : null;

		return { points, nowX, sunriseX, sunsetX, dawnX, duskX };
	});

	let curveLine = $derived(chart ? chart.points.map((p) => `${p.x},${p.y}`).join(' ') : '');

	// Builds the filled wedge between the horizon line and the curve for one elapsed segment
	// (night-before-sunrise, day, or night-after-sunset), clipped to whichever of the segment's
	// own end or "now" comes first - the still-to-come portion of the curve is left as an
	// unfilled outline, so the fill reads as "how much of today has passed" like the reference
	// Home Assistant card.
	function segmentPoints(fromX: number, toX: number): string {
		if (!chart || toX <= fromX) return '';
		const inRange = chart.points.filter((p) => p.x >= fromX && p.x <= toX);
		if (inRange.length < 2) return '';
		return [`${fromX},${CY}`, ...inRange.map((p) => `${p.x},${p.y}`), `${toX},${CY}`].join(' ');
	}

	let nightBeforePoly = $derived(chart && chart.sunriseX != null ? segmentPoints(0, Math.min(chart.sunriseX, chart.nowX)) : '');
	let dayPoly = $derived(
		chart && chart.sunriseX != null && chart.sunsetX != null && chart.nowX > chart.sunriseX
			? segmentPoints(chart.sunriseX, Math.min(chart.sunsetX, chart.nowX))
			: ''
	);
	let nightAfterPoly = $derived(
		chart && chart.sunsetX != null && chart.nowX > chart.sunsetX ? segmentPoints(chart.sunsetX, Math.min(W, chart.nowX)) : ''
	);

	// Positioned by real compass azimuth (0=N/360, 90=E, 180=S, 270=W) rather than the sun
	// curve's clock-time x-axis - matching how the Home Assistant horizon-card Lovelace card
	// this replaces places its moon marker, and avoiding the two markers coinciding just
	// because the sun and moon happen to share a similar elevation at a given moment.
	let moon = $derived(
		sun ? { x: (sun.moonAzimuth / 360) * W, y: toY(sun.moonElevation), aboveHorizon: sun.moonElevation >= 0 } : null
	);
</script>

<div class="{styles['astro-card']} {className}">
	{#if !sun}
		<p class={styles.empty}>No location configured in Home Assistant to compute astro times from.</p>
	{:else}
		<div class={styles['times-top']}>
			<div>
				<p class={styles.label}>Sunrise</p>
				<p class={styles.value}>{formatTime(sun.sunrise)}</p>
			</div>
			<div>
				<p class={styles.label}>Sunset</p>
				<p class={styles.value}>{formatTime(sun.sunset)}</p>
			</div>
		</div>

		<svg viewBox="0 0 {W} {H}" class={styles.chart} role="img" aria-label="Sun path from sunrise to sunset - currently {sun.sunElevation >= 0 ? 'above' : 'below'} the horizon at {(sun.sunElevation ?? 0).toFixed(0)} degrees, moon at {(sun.moonElevation ?? 0).toFixed(0)} degrees">
			<line x1="0" y1={CY} x2={W} y2={CY} class={styles.horizon} />
			{#if chart?.dawnX != null}<line x1={chart.dawnX} y1="10" x2={chart.dawnX} y2={CY} class={styles.guide} />{/if}
			{#if chart?.duskX != null}<line x1={chart.duskX} y1="10" x2={chart.duskX} y2={CY} class={styles.guide} />{/if}

			{#if nightBeforePoly}<polygon points={nightBeforePoly} class={styles['night-fill']} />{/if}
			{#if dayPoly}<polygon points={dayPoly} class={styles['day-fill']} />{/if}
			{#if nightAfterPoly}<polygon points={nightAfterPoly} class={styles['night-fill']} />{/if}

			{#if curveLine}<polyline points={curveLine} class={styles.curve} fill="none" />{/if}

			{#if chart}<circle cx={chart.nowX} cy={toY(sun.sunElevation)} r="9" class={styles['sun-marker']} />{/if}
			{#if moon}
				<text
					x={moon.x} y={moon.y}
					class={[styles['moon-marker'], !moon.aboveHorizon && styles['below-horizon']]}
					transform={sun.southernHemisphere ? `rotate(180 ${moon.x} ${moon.y})` : undefined}
					text-anchor="middle" dominant-baseline="central"
				>{sun.moonPhase ? MOON_PHASE_ICONS[sun.moonPhase] : '🌙'}</text>
			{/if}
		</svg>

		<div class={styles['times-row']}>
			<div>
				<p class={styles.label}>Dawn</p>
				<p class={styles.value}>{formatTime(sun.dawn)}</p>
			</div>
			<div>
				<p class={styles.label}>Solar noon</p>
				<p class={styles.value}>{formatTime(sun.solarNoon)}</p>
			</div>
			<div>
				<p class={styles.label}>Dusk</p>
				<p class={styles.value}>{formatTime(sun.dusk)}</p>
			</div>
		</div>

		<div class={styles['times-row']}>
			<div>
				<p class={styles.label}>Moonrise</p>
				<p class={styles.value}>{formatTime(sun.moonrise)}</p>
			</div>
			<div>
				<span class={styles['moon-phase-icon']} style={sun.southernHemisphere ? 'transform: rotate(180deg);' : undefined} aria-hidden="true">{sun.moonPhase ? MOON_PHASE_ICONS[sun.moonPhase] : '🌙'}</span>
				<p class={styles.value}>{sun.moonPhase ? (MOON_PHASE_LABELS[sun.moonPhase] ?? sun.moonPhase) : '—'}</p>
			</div>
			<div>
				<p class={styles.label}>Moonset</p>
				<p class={styles.value}>{formatTime(sun.moonset)}</p>
			</div>
		</div>
	{/if}
</div>
