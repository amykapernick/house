import { Marked } from 'marked';

export type TocEntry = { level: number, text: string, anchor: string };

// Deliberately simple/ASCII - the possums content headings are always plain
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

// Renders possums course markdown to HTML with heading ids matching extractToc's
// anchors below, for the page's own table-of-contents jump links. This content
// comes from Amy's own curated Notion data (not user input), so {@html}-ing the
// result at the call site is safe.
export function renderMarkdown(markdown: string): string {
	return marked.parse(markdown, { async: false }) as string;
}

// Pulls the h2 (section) / h3 (chapter) structure out of possums course markdown
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
