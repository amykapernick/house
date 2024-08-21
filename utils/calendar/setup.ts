import { Views, dateFnsLocalizer } from 'react-big-calendar'
import enAU from 'date-fns/locale/en-AU'
import { format, parse, startOfWeek, getDay } from 'date-fns';
import {CustomEvent, EventWrapper} from '@components/parts/calendar/CustomEvent';
import { resizeEvent, moveEvent } from './updateEvents'
import type { ComponentType, Dispatch, SetStateAction } from 'react';
import type { Event } from '@ts/calendar';
import type { EventProps, View, ViewKey} from 'react-big-calendar';

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
	eventWrapper: EventWrapper as unknown as ComponentType<EventProps<Event>>
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
	options: View[]
} = {
	default: Views.WEEK,
	options: Object.keys(Views as Record<ViewKey, View>).map((key) => Views[key as ViewKey] as View),
}