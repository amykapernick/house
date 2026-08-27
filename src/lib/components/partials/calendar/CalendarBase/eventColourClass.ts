// SVAR's eventCss prop returns a class name that's appended onto the event's
// own wrapper element (see BoxSection/BarSection's `css(p)` - unlike
// @event-calendar/core's eventDidMount, there's no direct DOM-node/style
// access), so getting a per-event background/text colour onto that element
// means generating a class per distinct colour pair and injecting its rule
// once, rather than setting an inline style directly.
const injectedClasses = new Set<string>();
let styleEl: HTMLStyleElement | null = null;

function ensureStyleEl(): HTMLStyleElement {
	if (!styleEl) {
		styleEl = document.createElement(`style`);
		styleEl.dataset.calendarEventColours = ``;
		document.head.appendChild(styleEl);
	}
	return styleEl;
}

function slugify(value: string): string {
	return value.replace(/[^a-zA-Z0-9_-]/g, `_`);
}

export default function eventColourClass(backgroundColor?: string, textColor?: string): string {
	if (!backgroundColor && !textColor) return ``;
	const className = `svar-event-${slugify(backgroundColor ?? ``)}-${slugify(textColor ?? ``)}`;
	if (typeof document === `undefined`) return className;
	if (!injectedClasses.has(className)) {
		injectedClasses.add(className);
		const declarations = [backgroundColor ? `background-color: ${backgroundColor} !important;` : ``, textColor ? `color: ${textColor} !important;` : ``].filter(Boolean).join(` `);
		ensureStyleEl().appendChild(document.createTextNode(`.${className} { ${declarations} }`));
	}
	return className;
}
