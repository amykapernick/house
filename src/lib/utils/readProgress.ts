// Per-device reading progress for /content pages - which trackable chunk
// anchors (see splitTrackableChunks) have been read, scoped by content entry +
// page slug. Deliberately localStorage rather than synced anywhere - it's
// just a personal "where was I" marker, not data worth round-tripping through
// the API.
function storageKey(slug: string, pageSlug: string): string {
	return `content-progress:${slug}:${pageSlug}`;
}

export function getReadAnchors(slug: string, pageSlug: string): Set<string> {
	try {
		const raw = localStorage.getItem(storageKey(slug, pageSlug));
		return new Set(raw ? JSON.parse(raw) : []);
	}
	catch {
		return new Set();
	}
}

function saveReadAnchors(slug: string, pageSlug: string, anchors: Set<string>) {
	try {
		localStorage.setItem(storageKey(slug, pageSlug), JSON.stringify([...anchors]));
	}
	catch {}
}

export function markAnchorRead(slug: string, pageSlug: string, anchor: string): Set<string> {
	const anchors = getReadAnchors(slug, pageSlug);
	anchors.add(anchor);
	saveReadAnchors(slug, pageSlug, anchors);
	return anchors;
}

export function unmarkAnchorRead(slug: string, pageSlug: string, anchor: string): Set<string> {
	const anchors = getReadAnchors(slug, pageSlug);
	anchors.delete(anchor);
	saveReadAnchors(slug, pageSlug, anchors);
	return anchors;
}

// How long the "mark previous section as read" button needs to stay visible
// before it's counted as read automatically (in addition to clicking it).
const AUTO_READ_DWELL_MS = 4000;

type DwellParams = { anchor: string, isAlreadyRead: () => boolean, onRead: (anchor: string) => void };

// Svelte action, attached to each chunk's "mark previous section as read"
// button (not the chunk's own content div): marks `anchor` read once the
// button has spent AUTO_READ_DWELL_MS continuously intersecting the viewport
// at all. The button only appears at the boundary before the *next* chunk, so
// it scrolling into view is itself the "reached the end of this section"
// signal - watching the (typically much taller than the viewport) content div
// instead would fire as soon as you'd barely started a section, not finished
// it. `params` is undefined for chunks with no previous trackable section to
// mark (the very first one on the page).
//
// `isAlreadyRead` is a pull (called fresh each time the observer fires),
// not a reactive prop - deliberately, so marking one chunk read doesn't cause
// Svelte to call `update()` on every other chunk's action and tear down/
// recreate every IntersectionObserver on the page (this previously caused a
// multi-second UI freeze on a long course with dozens of chapters). There's
// no `update` returned below, so Svelte only sets this action up once on
// mount and leaves it alone - `anchor`/`onRead` are stable for a node's
// lifetime, so that's all it needs.
export function trackReadDwell(node: HTMLElement, params: DwellParams | undefined) {
	if (!params) return {};

	let timer: ReturnType<typeof setTimeout> | undefined;

	const observer = new IntersectionObserver(([entry]) => {
		if (params.isAlreadyRead()) {
			observer.disconnect();
			return;
		}

		if (entry.isIntersecting) {
			timer ??= setTimeout(() => {
				if (!params.isAlreadyRead()) params.onRead(params.anchor);
				observer.disconnect();
			}, AUTO_READ_DWELL_MS);
		}
		else {
			clearTimeout(timer);
			timer = undefined;
		}
	}, { threshold: 0 });

	observer.observe(node);

	return {
		destroy() {
			clearTimeout(timer);
			observer.disconnect();
		},
	};
}
