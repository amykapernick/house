<script lang="ts">
	import type { Component } from "svelte";
	import type { MilestoneStatus, SignStatus } from "$types/generated";
	import Calendar from '$img/icons/calendar-date.svg?component'
	import Watch from '$img/icons/time-machine.svg?component'
	import Checked from '$img/icons/s-check.svg?component'
	import Unchecked from '$img/icons/s-unchecked.svg?component'
	import Progress from '$img/icons/progress-indicator.svg?component'
	import View from '$img/icons/view.svg?component'
	import Syringe from '$img/smallHuman/syringe.svg?component'

	export type IconName = MilestoneStatus | SignStatus | 'calendar' | 'vaccine';

	const icons: Record<IconName, Component> = {
		calendar: Calendar,
		done: Checked,
		in_progress: Progress,
		upcoming: Unchecked,
		watch: Watch,
		introduce_next: Unchecked,
		signing_occasionally: Progress,
		recognises: View,
		coming_soon: Watch,
		vaccine: Syringe,
	};

	const { name }: { name: IconName } = $props();

	const IconComponent = $derived(icons[name]);

	// Every instance of a given icon shares the same static gradient/mask ids
	// baked in at build time (prefixIds only scopes ids per-file, not per-use).
	// Duplicate ids resolve url(#id) refs to whichever element rendered first,
	// so repeated icons on a page silently lose their gradient - rewrite ids to
	// be unique per rendered instance.
	const uid = $props.id();
	let wrapper: HTMLSpanElement | undefined = $state();

	const URL_REF_ATTRS = ['fill', 'stroke', 'filter', 'clip-path', 'mask'];

	$effect(() => {
		if (!wrapper) return;
		const svg = wrapper.querySelector('svg');
		if (!svg) return;

		// eslint-disable-next-line svelte/prefer-svelte-reactivity -- built and discarded synchronously within this effect, never read reactively
		const idMap = new Map<string, string>();
		svg.querySelectorAll('[id]').forEach((el) => {
			const newId = `${el.id}-${uid}`;
			idMap.set(el.id, newId);
			el.id = newId;
		});

		svg.querySelectorAll('*').forEach((el) => {
			for (const attr of URL_REF_ATTRS) {
				const value = el.getAttribute(attr);
				const match = value?.match(/^url\(#(.+)\)$/);
				const mappedId = match && idMap.get(match[1]);
				if (mappedId) el.setAttribute(attr, `url(#${mappedId})`);
			}

			const href = el.getAttribute('href') ?? el.getAttribute('xlink:href');
			const mappedHref = href?.startsWith('#') && idMap.get(href.slice(1));
			if (mappedHref) el.setAttribute('href', `#${mappedHref}`);
		});
	});
</script>

<span bind:this={wrapper} class="icon">
	<IconComponent />
</span>

<style>
	.icon {
		display: contents;
	}
</style>
