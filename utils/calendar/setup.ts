import { Calendar, Views, dateFnsLocalizer } from 'react-big-calendar'
import enAU from 'date-fns/locale/en-AU'
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { resizeEvent, moveEvent } from './updateEvents'
import { Dispatch, SetStateAction } from 'react';
import { UpdateEventFunction, Event } from '@ts/calendar';

export const locales = {
	'en-AU': enAU,
}

export const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales: locales,
})

const defaultEditFunctions = {
	onEventResize: resizeEvent,
	onEventDrop: moveEvent,
}

const defaultAccessors: Record<string, (string | any)> = {
	start: 'start',
	end: 'end',
	draggable: (event: Event) => true,
	resizable: (event: Event) => true,
}

export const accessors = () => {
	const items: Record<string, (string | any)> = {}

	Object.entries(defaultAccessors).map(([key, value]) => {
		items[`${key}Accessor`] = value
	})

	return items
}

export const editFunctions = (updateState: Dispatch<SetStateAction<Event[]>>, allEvents: Event[]) => {
	const items: Record<string, UpdateEventFunction> = {}

	Object.entries(defaultEditFunctions).map(([key, func]) => {
		items[key] = (args) => {
			updateState(func(args, allEvents))
		}
	})

	return items
}

export const views = {
	default: Views.WEEK,
	options: Object.keys(Views).map((key) => Views[key]),
}