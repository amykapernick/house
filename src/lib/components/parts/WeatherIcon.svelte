<script lang="ts">
	import Sun from '$img/weather/sun-colored.svg?component';
	import Moon from '$img/weather/moon-colored.svg?component';
	import CloudSun from '$img/weather/cloud-sun-19-colored.svg?component';
	import CloudMoon from '$img/weather/cloud-moon-colored.svg?component';
	import CloudForecast from '$img/weather/cloud-forecast-colored.svg?component';
	import SunFog from '$img/weather/sun-fog-29-colored.svg?component';
	import MoonFog from '$img/weather/moon-fog-colored.svg?component';
	import SunCloudHail from '$img/weather/sun-cloud-hail-colored.svg?component';
	import MoonCloudHail from '$img/weather/moon-cloud-hail-colored.svg?component';
	import SunCloudLight from '$img/weather/sun-cloud-light-colored.svg?component';
	import MoonCloudLight from '$img/weather/moon-cloud-light-colored.svg?component';
	import CloudDrop from '$img/weather/cloud-hail-colored.svg';
	import RainHail from '$img/weather/rain-hail-colored.svg?component';
	import SunCloudSnow from '$img/weather/sun-cloud-snow-55-colored.svg?component';
	import MoonCloudSnow from '$img/weather/moon-cloud-snow-62-colored.svg?component';
	import Snow from '$img/weather/snow-colored.svg?component';
	import Hurricane from '$img/weather/hurricane-45-colored.svg?component';
	import Forecast from '$img/weather/forecast-colored.svg?component';
	import { parseISO } from 'date-fns';

	let {
		condition,
		sunrise,
		sunset,
		class: className = '',
	}: {
		/** Home Assistant's fixed weather condition enum (see the `weather` integration docs) */
		condition?: string | null;
		/** From House.sun.sunrise/sunset (ISO strings) - used to pick the day/night variant for
		 * conditions that don't already encode it. */
		sunrise?: string | null;
		sunset?: string | null;
		class?: string;
	} = $props();

	// Only "clear-night" already encodes night in the condition string itself - every other
	// condition is day/night-agnostic in HA's enum, so today's sunrise/sunset decide which
	// variant to show. Defaults to day if either is missing.
	const isDay = $derived.by(() => {
		if (!sunrise || !sunset) return true;
		const now = new Date();
		return now >= parseISO(sunrise) && now < parseISO(sunset);
	});

	// "sunny" and "clear-night" both mean a clear sky - which of the two HA happens to report
	// isn't trusted over the actual sunrise/sunset-derived isDay, so they share one pair.
	const CONDITION_ICONS: Record<string, { day: any; night: any }> = {
		'sunny': { day: Sun, night: Moon },
		'clear-night': { day: Sun, night: Moon },
		'partlycloudy': { day: CloudSun, night: CloudMoon },
		'cloudy': { day: CloudForecast, night: CloudForecast },
		'fog': { day: SunFog, night: MoonFog },
		'hail': { day: SunCloudHail, night: MoonCloudHail },
		'lightning': { day: SunCloudLight, night: MoonCloudLight },
		'lightning-rainy': { day: SunCloudLight, night: MoonCloudLight },
		'rainy': { day: CloudDrop, night: CloudDrop },
		'pouring': { day: RainHail, night: RainHail },
		'snowy': { day: SunCloudSnow, night: MoonCloudSnow },
		'snowy-rainy': { day: Snow, night: Snow },
		'windy': { day: Hurricane, night: Hurricane },
		'windy-variant': { day: Hurricane, night: Hurricane },
		'exceptional': { day: Hurricane, night: Hurricane },
	};

	let Icon = $derived.by(() => {
		const entry = condition ? CONDITION_ICONS[condition] : undefined;
		if (!entry) return Forecast;
		return isDay ? entry.day : entry.night;
	});
</script>

<Icon class={className} />
