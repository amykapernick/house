import type { CalendarEvent } from '@svar-ui/calendar-store';

export type AppCalendarEvent = {
	id: string;
	title: string;
	start: Date;
	end: Date;
	allDay?: boolean;
	backgroundColor?: string;
	textColor?: string;
	resourceIds?: string[];
	extendedProps?: Record<string, unknown>;
	editable?: boolean;
	classNames?: string[];
};

// @svar-ui/svelte-calendar's CalendarEvent uses `text` for the display label
// (not `title`) and has no dedicated colour/resource fields - they're carried
// through its open [key: string]: any bag instead, read back out by
// eventColourClass/the resource ViewModels/EventContent components.
export default function toSvarEvent(event: AppCalendarEvent): CalendarEvent {
	const { id, title, start, end, allDay, backgroundColor, textColor, resourceIds, extendedProps, editable, classNames } = event;
	return {
		id,
		start,
		end,
		allDay,
		text: title,
		backgroundColor,
		textColor,
		resourceIds,
		extendedProps,
		editable,
		// BoxSection/BarSection read event.css directly and append it onto the
		// event element's class list (see CalendarBase/eventColourClass.ts's
		// eventCss for the same mechanism) - reusing that existing hook rather
		// than inventing a separate classNames concept SVAR has no knowledge of.
		css: classNames?.join(` `),
	};
}
