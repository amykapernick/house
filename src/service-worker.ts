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
		caches.keys().then(async (keys) => {
			for (const key of keys) {
				if (key !== CACHE_NAME) await caches.delete(key);
			}
		})
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
