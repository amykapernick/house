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

// Notion content can have repeated headings (e.g. dated log entries like "12
// July 2026" reused across entries), which would otherwise all slugify to the
// same anchor - breaking keyed {#each} blocks and read-progress tracking that
// assume anchors are unique. Every anchor-producing pass below (the heading
// renderer, extractToc, splitTrackableChunks) walks headings in the same
// document order and applies this same disambiguation, so ids stay consistent
// with each other for a given document.
function createSlugger() {
	const counts = new Map<string, number>();

	return (text: string): string => {
		const base = slugifyHeading(text);
		const count = counts.get(base) ?? 0;
		counts.set(base, count + 1);
		return count === 0 ? base : `${base}-${count + 1}`;
	};
}

let headingSlugger = createSlugger();

const marked = new Marked({
	renderer: {
		heading({ tokens, depth, text }) {
			const anchor = headingSlugger(text);
			return `<h${depth} id="${anchor}">${this.parser.parseInline(tokens)}</h${depth}>\n`;
		},
	},
});

// Renders /content page markdown to HTML with heading ids matching extractToc's
// anchors below, for the page's own table-of-contents jump links. This content
// comes from Amy's own curated Notion data (not user input), so {@html}-ing the
// result at the call site is safe.
export function renderMarkdown(markdown: string): string {
	headingSlugger = createSlugger();
	return marked.parse(markdown, { async: false }) as string;
}

// Pulls the h2 (section) / h3 (chapter) structure out of /content page markdown
// for the page's table of contents - matched via the same slugifyHeading used by
// the heading renderer above, so anchors line up.
export function extractToc(markdown: string): TocEntry[] {
	const entries: TocEntry[] = [];
	const slugger = createSlugger();

	for (const line of markdown.split(`\n`)) {
		const match = /^(##|###) +(.+)$/.exec(line);
		if (!match) continue;

		const text = match[2].trim();
		entries.push({
			level: match[1].length,
			text,
			anchor: slugger(text),
		});
	}

	return entries;
}

// Whether each TOC entry counts as "read", for its checkmark. Chapters (h3)
// and bare sections (h2 with no chapters) map straight onto a trackable
// chunk's own anchor. A section (h2) *with* chapters isn't itself trackable
// (see splitTrackableChunks) - it only reads as done once every chapter
// nested under it (up to the next h2) has been read.
export function computeTocRead(toc: TocEntry[], readAnchors: Set<string>): Map<string, boolean> {
	const read = new Map<string, boolean>();

	toc.forEach((entry, i) => {
		if (entry.level === 3) {
			read.set(entry.anchor, readAnchors.has(entry.anchor));
			return;
		}

		const chapters = [];
		for (let j = i + 1; j < toc.length && toc[j].level !== 2; j++) chapters.push(toc[j]);

		read.set(entry.anchor, chapters.length > 0 ? chapters.every((chapter) => readAnchors.has(chapter.anchor)) : readAnchors.has(entry.anchor));
	});

	return read;
}

type RawChunk = { level: 2 | 3 | null, heading: string | null, markdown: string };

export type ContentChunk = {
	anchor: string | null
	heading: string | null
	level: 2 | 3 | null
	markdown: string
	/** Whether this chunk is its own read-progress unit (see splitTrackableChunks). */
	trackable: boolean
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
// text - never trackable on its own. Callers render each trackable chunk's
// "mark as read" button immediately after that chunk's own content, rather
// than before the next trackable chunk - non-trackable chunks (e.g. a digest's
// synthesized "## <date>" section wrapping a single trackable chapter) can sit
// between them, and the button needs to land at the actual reading boundary,
// not wherever the next trackable chunk happens to start.
export function splitTrackableChunks(markdown: string): ContentChunk[] {
	const raw = splitHeadingChunks(markdown);
	const slugger = createSlugger();

	return raw.map((chunk, i) => ({
		anchor: chunk.heading ? slugger(chunk.heading) : null,
		heading: chunk.heading,
		level: chunk.level,
		markdown: chunk.markdown,
		trackable: chunk.level === 3 || (chunk.level === 2 && raw[i + 1]?.level !== 3),
	}));
}
