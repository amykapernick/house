import type { Component } from 'svelte';
import type { SearchSection } from './commandPaletteSearch';
import { resolve } from '$app/paths';

// Shared between CommandPalette.svelte (5-per-section, `/s`-gated) and the
// /search page (unlimited, always-on) - see searchResults.ts's builders below.
export type Result = {
	key: string;
	label: string;
	sublabel?: string;
	section: `Recent` | SearchSection;
	link: string;
	Icon?: Component<Record<string, any>>;
	contentIcon?: { icon?: string | null; iconType?: string | null };
	// Extra fields (description, tags, etc.) a result should also match
	// against besides its label - see filterResults below.
	searchText?: string;
	archived?: boolean;
};

export type ContentEntryResult = { slug: string; title: string; icon?: string | null; iconType?: string | null };
export type ContentPageResult = { entrySlug: string; pageSlug: string; title: string; group: string };

// `limit` is only ever set by CommandPalette (SECTION_DISPLAY_LIMIT) - the
// /search page calls every builder without one to show every match.
export function filterResults<T>(term: string, list: T[], toResult: (item: T) => Result, limit?: number): Result[] {
	if (!term) return [];
	const results = list
		.map(toResult)
		.filter((result) => result.label.toLowerCase().includes(term) || result.searchText?.toLowerCase().includes(term));
	return limit !== undefined ? results.slice(0, limit) : results;
}

// Deliberately unlimited even from the palette (unlike every other section
// below) - matches CommandPalette's pre-extraction behaviour.
export function buildContentResults(entries: ContentEntryResult[], pages: ContentPageResult[], term: string): Result[] {
	if (!term) return [];
	const base: Result[] = [
		...entries.map((entry) => ({
			key: `content-entry:${entry.slug}`,
			label: entry.title,
			section: `Content` as const,
			link: resolve(`/content/[slug]`, { slug: entry.slug }),
			contentIcon: { icon: entry.icon, iconType: entry.iconType },
		})),
		...pages.map((contentPage) => {
			const entry = entries.find((e) => e.slug === contentPage.entrySlug);
			return {
				key: `content-page:${contentPage.entrySlug}:${contentPage.pageSlug}`,
				label: contentPage.title,
				sublabel: contentPage.group,
				section: `Content` as const,
				link: resolve(`/content/[slug]/[pageSlug]`, { slug: contentPage.entrySlug, pageSlug: contentPage.pageSlug }),
				contentIcon: { icon: entry?.icon, iconType: entry?.iconType },
			};
		}),
	];
	return base.filter((result) => result.label.toLowerCase().includes(term));
}

export function buildReferenceResults(resources: any[], term: string, limit?: number): Result[] {
	return filterResults(term, resources, (resource) => ({
		key: `resource:${resource.id}`,
		label: resource.name,
		sublabel: resource.category,
		section: `References` as const,
		link: resource.url || resolve(`/reference`),
		searchText: [resource.category, resource.description].filter(Boolean).join(` `),
		archived: resource.archived,
	}), limit);
}

// Each supplier can surface up to three results under its own name: the
// supplier itself (opens their website), plus a "call"/"email" action if a
// phone/email is on file - flattened first so filterResults's per-item label
// filter naturally keeps or drops all of a matching supplier's actions together.
export function buildSupplierResults(suppliers: any[], term: string, limit?: number): Result[] {
	const items: { id: string; name: string; sublabel?: string; link: string; searchText: string; archived?: boolean }[] = [];
	for (const supplier of suppliers) {
		const searchText = (supplier.category ?? []).join(` `);
		items.push({ id: `supplier:${supplier.id}`, name: supplier.name, link: supplier.url || resolve(`/reference`), searchText, archived: supplier.archived });
		if (supplier.email) items.push({ id: `supplier-email:${supplier.id}`, name: supplier.name, sublabel: `Email ${supplier.email}`, link: `mailto:${supplier.email}`, searchText, archived: supplier.archived });
		if (supplier.phone) items.push({ id: `supplier-call:${supplier.id}`, name: supplier.name, sublabel: `Call ${supplier.phone}`, link: `tel:${supplier.phone}`, searchText, archived: supplier.archived });
	}
	return filterResults(term, items, (item) => ({
		key: item.id,
		label: item.name,
		sublabel: item.sublabel,
		section: `Suppliers` as const,
		link: item.link,
		searchText: item.searchText,
		archived: item.archived,
	}), limit);
}

// Links to the asset's own entry on the Reference page (Item.svelte gives
// each entry's heading a matching id) rather than asset.external - the
// palette should take you to the household's own record, not the retailer.
export function buildAssetResults(assets: any[], term: string, limit?: number): Result[] {
	return filterResults(term, assets, (asset) => ({
		key: `asset:${asset.id}`,
		label: asset.name,
		section: `Assets` as const,
		link: `${resolve(`/reference`)}#${asset.id}`,
		searchText: [asset.brand, asset.model, asset.status, ...(asset.category ?? []), asset.content].filter(Boolean).join(` `),
	}), limit);
}

// Flattens the named/titled sub-items of each smallHuman tab - not raw
// measurements or narrative blocks - into individual results tagged with
// the tab id the page's own hash-routing already understands (small-human's
// activeTab reads page.url.hash, so #<tabId> lands directly on the right tab).
export function buildSmallHumanResults(smallHuman: any, term: string, limit?: number): Result[] {
	if (!smallHuman) return [];
	const items: { id: string; label: string; tab: string }[] = [
		...(smallHuman.teeth?.teeth ?? []).map((t: any) => ({ id: `tooth:${t.fdi}`, label: t.name, tab: `teeth` })),
		...(smallHuman.milestones?.items ?? []).map((m: any) => ({ id: `milestone:${m.id}`, label: m.title, tab: `milestones` })),
		...(smallHuman.auslan?.signs ?? []).map((s: any) => ({ id: `sign:${s.id}`, label: s.name, tab: `auslan` })),
		...(smallHuman.swimming?.skills ?? []).map((s: any) => ({ id: `swim:${s.id}`, label: s.title, tab: `swimming` })),
		...(smallHuman.sleep?.items ?? []).map((s: any) => ({ id: `sleep:${s.id}`, label: s.title, tab: `sleep` })),
		...(smallHuman.vaccinations?.items ?? []).map((v: any) => ({ id: `vax:${v.id}`, label: v.title, tab: `vaccinations` })),
		...(smallHuman.activities ?? []).map((a: any) => ({ id: `activity:${a.id}`, label: a.title, tab: `activities` })),
		...(smallHuman.clothing?.seasonal?.alerts ?? []).map((a: any) => ({ id: `clothing:${a.id}`, label: a.title, tab: `clothing-seasonal` })),
		...(smallHuman.notes ?? []).flatMap((note: any) => {
			if (note.__typename === `CarSeat`) return [{ id: `note:car-seat`, label: note.name, tab: `parenting-approach` }];
			if (note.__typename === `ParentingApproachNote`) return (note.parentingApproachItems ?? []).map((i: any) => ({ id: `note:parenting:${i.id}`, label: i.title, tab: `parenting-approach` }));
			if (note.__typename === `ToddlerSleepPrepNote`) return [{ id: `note:toddler-sleep-prep`, label: note.name, tab: `toddler-sleep-prep` }];
			return [];
		}),
	];
	return filterResults(term, items, (item) => ({
		key: item.id,
		label: item.label,
		section: `Small Human` as const,
		link: `${resolve(`/small-human`)}#${item.tab}`,
	}), limit);
}

export function buildTaskResults(tasks: any[], term: string, limit?: number): Result[] {
	return filterResults(term, tasks, (task) => ({
		key: `task:${task.id}`,
		label: task.name,
		sublabel: task.dueLabel,
		section: `Tasks` as const,
		link: task.link || resolve(`/tasks`),
	}), limit);
}

export function buildShoppingListResults(items: any[], term: string, limit?: number): Result[] {
	return filterResults(term, items, (item) => ({
		key: `shopping:${item.id}`,
		label: item.display,
		sublabel: item.category,
		section: `Shopping List` as const,
		link: resolve(`/shopping-list`),
	}), limit);
}

export function buildBudgetResults(items: any[], term: string, limit?: number): Result[] {
	return filterResults(term, items, (item) => ({
		key: `budget:${item.id}`,
		label: item.description,
		sublabel: item.bucket?.name,
		section: `Budget` as const,
		link: resolve(`/budget`),
	}), limit);
}

export function buildScheduleResults(events: any[], icsEvents: any[], term: string, limit?: number): Result[] {
	const combined = [...events.map((event) => ({ id: `event:${event.id}`, label: event.name })), ...icsEvents.map((event) => ({ id: `ics:${event.id}`, label: event.name }))];
	return filterResults(term, combined, (event) => ({
		key: event.id,
		label: event.label,
		section: `Schedule` as const,
		link: resolve(`/schedule`),
	}), limit);
}
