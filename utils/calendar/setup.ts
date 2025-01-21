import { Views, dateFnsLocalizer } from 'react-big-calendar'
import enAU from 'date-fns/locale/en-AU'
import { format, parse, startOfWeek, getDay } from 'date-fns';
import {CustomEvent, EventWrapper} from '@components/parts/calendar/CustomEvent';
import Year from '@components/parts/calendar/CustomYear';
import { resizeEvent, moveEvent } from './updateEvents'
import type { ComponentType, Dispatch, SetStateAction } from 'react';
import type { Event } from '@ts/calendar';
import type { DateLocalizer, EventProps, View, ViewKey} from 'react-big-calendar';

type DateRangeFormatFunction = (range: { start: Date, end: Date }, culture: string | null, localizer: DateLocalizer) => string

type DateFormatFunction = (date: Date, culture: string | null, localizer: DateLocalizer) => string

export const locales = {
	'en-AU': enAU,
}

export const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
	getDay,
	locales: locales,
})

export const dateFormats: Record<string, (DateRangeFormatFunction | DateFormatFunction)> = {
	dayRangeHeaderFormat: ({ start, end }: { start: Date, end: Date }, culture: string | null, localizer: DateLocalizer) => {
		if (!end) {
			return localizer.format(start, `dd MMM`)
		}

		if (start.getMonth() === end.getMonth()) {
			return `${ localizer.format(start, `dd`) } - ${ localizer.format(end, `dd MMM`) }`
		}

		return `${ localizer.format(start, `dd MMM`) } - ${ localizer.format(end, `dd MMM`) }`
	},
	dayHeaderFormat: (date: Date, culture: string | null, localizer: DateLocalizer) => localizer.format(date, `dd MMM`),
	agendaDateFormat: (date: Date, culture: string | null, localizer: DateLocalizer) => localizer.format(date, `dd MMM`),
	agendaHeaderFormat: ({ start, end }: { start: Date, end: Date }, culture: string | null, localizer: DateLocalizer) => {
		if (!end) {
			return localizer.format(start, `dd MMM`)
		}

		if (start.getMonth() === end.getMonth()) {
			return `${ localizer.format(start, `dd`) } - ${ localizer.format(end, `dd MMM`) }`
		}

		return `${ localizer.format(start, `dd MMM`) } - ${ localizer.format(end, `dd MMM`) }`
	},
	timeGutterFormat: (date: Date, culture: string | null, localizer: DateLocalizer) => localizer.format(date, `hh:mm aaa`),
	yearHeaderFormat: (date: Date, culture: string | null, localizer: DateLocalizer) => localizer.format(date, `yyyy`),
}

const defaultEditFunctions = {
	onEventResize: resizeEvent,
	onEventDrop: moveEvent,
}

const defaultAccessors: Record<string, (string | (() => void))> = {
	start: `start`,
	end: `end`,
	draggable: `editable`,
	resizable: `editable`
}

export const customComponents: Record<string, ComponentType<EventProps<Event>>> = {
	event: CustomEvent,
	// TODO: currently not working https://github.com/jquense/react-big-calendar/issues/2703
	// eventWrapper: EventWrapper as unknown as ComponentType<EventProps<Event>>
}

export const accessors = () => {
	const items: Record<string, (string | (() => void))> = {}

	Object.entries(defaultAccessors).map(([key, value]) => {
		items[`${key}Accessor`] = value
	})

	return items
}

export const editFunctions = (updateState: Dispatch<SetStateAction<Event[]>>, allEvents: Event[]) => {
	const items: Record<string, any> = {}

	Object.entries(defaultEditFunctions).map(([key, func]) => {
		items[key] = (args: any) => {
			updateState(func(args, allEvents))
		}
	})

	return items
}

export const views: {
	default: View,
	options: Record<View | string, any>
} = {
	default: `year`,
	options: {
		month: true,
		week: true,
		day: true,
		year: Year
	},
}

export const messages = {
	year: `Year`
}