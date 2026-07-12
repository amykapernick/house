import { Marked } from 'marked';

export type TocEntry = { level: number, text: string, anchor: string };

// Deliberately simple/ASCII - Notion content headings are always plain
// English text, so a full unicode-aware slugifier isn't needed here.
export function slugifyHeading(text: string): string {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, `-`)
		.replace(/^-+|-+$/g, ``);
}

const marked = new Marked({
	renderer: {
		heading({ tokens, depth, text }) {
			const anchor = slugifyHeading(text);
			return `<h${depth} id="${anchor}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
		},
	},
});

// Renders /content page markdown to HTML with heading ids matching extractToc's
// anchors below, for the page's own table-of-contents jump links. This content
// comes from Amy's own curated Notion data (not user input), so {@html}-ing the
// result at the call site is safe.
export function renderMarkdown(markdown: string): string {
	return marked.parse(markdown, { async: false }) as string;
}

// Pulls the h2 (section) / h3 (chapter) structure out of /content page markdown
// for the page's table of contents - matched via the same slugifyHeading used by
// the heading renderer above, so anchors line up.
export function extractToc(markdown: string): TocEntry[] {
	const entries: TocEntry[] = [];

	for (const line of markdown.split(`\n`)) {
		const match = /^(##|###) +(.+)$/.exec(line);
		if (!match) continue;

		const text = match[2].trim();
		entries.push({
			level: match[1].length,
			text,
			anchor: slugifyHeading(text),
		});
	}

	return entries;
}

type RawChunk = { level: 2 | 3 | null, heading: string | null, markdown: string };

export type ContentChunk = {
	anchor: string | null
	heading: string | null
	level: 2 | 3 | null
	markdown: string
	/** Whether this chunk is its own read-progress unit (see splitTrackableChunks). */
	trackable: boolean
	/** The nearest earlier trackable chunk's anchor, if any - for the "mark previous as read" button. */
	previousTrackableAnchor: string | null
};

function splitHeadingChunks(markdown: string): RawChunk[] {
	const chunks: RawChunk[] = [{ level: null, heading: null, markdown: `` }];

	for (const line of markdown.split(`\n`)) {
		const match = /^(##|###) +(.+)$/.exec(line);
		if (match) {
			chunks.push({ level: match[1].length as 2 | 3, heading: match[2].trim(), markdown: `` });
		}
		chunks[chunks.length - 1].markdown += `${line}\n`;
	}

	return chunks.filter((chunk, i) => i === 0 ? chunk.markdown.trim().length > 0 : true);
}

// Splits /content page markdown into read-progress-trackable chunks. Reading
// progress is tracked per Chapter (h3) where chapters exist - but the "bare
// section" pattern (content directly under a h2, no h3 within it, e.g.
// "Before Birth") has no h3 to hang that on, so a Section with no chapters
// falls back to being its own trackable unit instead. This way every page has
// *some* trackable granularity regardless of which pattern its content uses.
// The leading chunk (before the first heading, if any) is the page's intro
// text - never trackable on its own.
export function splitTrackableChunks(markdown: string): ContentChunk[] {
	const raw = splitHeadingChunks(markdown);
	const result: ContentChunk[] = [];
	let previousTrackableAnchor: string | null = null;

	raw.forEach((chunk, i) => {
		const anchor = chunk.heading ? slugifyHeading(chunk.heading) : null;
		const trackable = chunk.level === 3 || (chunk.level === 2 && raw[i + 1]?.level !== 3);

		result.push({
			anchor,
			heading: chunk.heading,
			level: chunk.level,
			markdown: chunk.markdown,
			trackable,
			previousTrackableAnchor: trackable ? previousTrackableAnchor : null,
		});

		if (trackable) previousTrackableAnchor = anchor;
	});

	return result;
}
