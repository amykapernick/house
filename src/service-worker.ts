/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = `cache-${version}`;

// adapter-static's SPA fallback page - not part of `build`/`files` (it's a
// generated artifact, not a static/ source file), but every route falls back
// to it (see staticwebapp.config.json's navigationFallback), so it needs to
// be precached explicitly to act as the offline app shell.
const SHELL_URL = `/index.html`;

const ASSETS = [
	...build,
	...files,
	SHELL_URL,
];

sw.addEventListener(`install`, (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
	);
});

sw.addEventListener(`activate`, (event) => {
	event.waitUntil(
		Promise.all([
			caches.keys().then(async (keys) => {
				for (const key of keys) {
					if (key !== CACHE_NAME) await caches.delete(key);
				}
			}),
			updateWidgets(),
		])
	);
});

// --- Windows 11 Widgets Board (Household Schedule widget) ---
// See CLAUDE.md's "Windows Widget" section for the full flow. `widget.definition.data`
// requires auth (WIDGET_ACCESS_TOKEN, checked server-side in household_api's
// /widget-schedule function) since the caller here has no signed-in Clerk session to
// mint a JWT from - Microsoft's own reference implementation just does a plain
// `fetch(dataUrl)`, but that fetch call is ours to write, so we attach the token as a
// header instead of leaving it sitting in the public manifest.json data URL.
const WIDGET_TOKEN = import.meta.env.VITE_WIDGET_ACCESS_TOKEN as string | undefined;
const widgetAuthHeaders = WIDGET_TOKEN ? { Authorization: `Bearer ${btoa(WIDGET_TOKEN)}` } : {};

async function renderWidget(widget: any) {
	const templateUrl = widget.definition.msAcTemplate;
	const dataUrl = widget.definition.data;

	const template = await (await fetch(templateUrl)).text();
	const data = await (await fetch(dataUrl, { headers: widgetAuthHeaders })).text();

	await (sw as any).widgets.updateByTag(widget.definition.tag, { template, data });
}

async function updateWidgets() {
	if (!(`widgets` in sw)) return;

	const widget = await (sw as any).widgets.getByTag(`household-schedule`);
	if (!widget) return;

	await renderWidget(widget);
}

sw.addEventListener(`widgetinstall` as any, (event: any) => {
	event.waitUntil(
		(async () => {
			const tags = await (sw.registration as any).periodicSync.getTags();
			if (!tags.includes(event.widget.definition.tag)) {
				await (sw.registration as any).periodicSync.register(event.widget.definition.tag, {
					minInterval: event.widget.definition.update * 1000,
				});
			}

			await renderWidget(event.widget);
		})()
	);
});

sw.addEventListener(`widgetuninstall` as any, (event: any) => {
	event.waitUntil(
		(async () => {
			if (event.widget.instances.length === 1 && `update` in event.widget.definition) {
				await (sw.registration as any).periodicSync.unregister(event.widget.definition.tag);
			}
		})()
	);
});

sw.addEventListener(`periodicsync` as any, (event: any) => {
	event.waitUntil(
		(async () => {
			const widget = await (sw as any).widgets.getByTag(event.tag);
			if (widget && `update` in widget.definition) {
				await renderWidget(widget);
			}
		})()
	);
});

sw.addEventListener(`fetch`, (event) => {
	if (event.request.method !== `GET`) return;

	const url = new URL(event.request.url);

	if (url.pathname.startsWith(`/api/`)) return;

	const isAsset = ASSETS.includes(url.pathname);

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE_NAME);

			if (isAsset) {
				const cached = await cache.match(event.request);
				if (cached) return cached;
			}

			try {
				const response = await fetch(event.request);

				if (response.status === 200) {
					cache.put(event.request, response.clone());
				}

				return response;
			}
			catch {
				const cached = await cache.match(event.request);
				if (cached) return cached;

				// Offline and this exact URL was never cached (e.g. a route only ever
				// reached via client-side routing, never as a hard navigation). Every
				// route falls back to the same SPA shell anyway (see
				// staticwebapp.config.json), so serve that instead of a bare error -
				// the client router can still boot and render from locally-cached data.
				if (event.request.mode === `navigate`) {
					const shell = await cache.match(SHELL_URL);
					if (shell) return shell;
				}

				return new Response(`Offline`, { status: 503 });
			}
		})()
	);
});
