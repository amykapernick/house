'use client'

import { Calendar, Views } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import styles from './styles.module.css'
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Event } from '@ts/calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { accessors, localizer, editFunctions, views, customComponents } from '@utils/calendar/setup'
import CustomEvent from '../customEvent';

type CalendarViewProps = {
	events: Event[]
	backgroundEvents?: Event[]
}

const DnDCalendar = withDragAndDrop(Calendar)

const CalendarView = (props: CalendarViewProps) => {
	const [events, setEvents] = useState<Event[]>(props?.events ?? [])
	const [backgroundEvents, setBackgroundEvents] = useState<Event[]>(props?.backgroundEvents ?? [])
	const [view, setView] = useState(views.default)
	const [date, setDate] = useState(new Date())
	const defaultProps = {
		date: date,
		view: view,
		components: customComponents,
	}
	const calendarFunctions = {
		onView: useCallback((newView) => setView(newView), []),
		onNavigate: useCallback((newDate) => setDate(newDate), []),
	}

	useEffect(() => {
		if (props?.events) {
			setEvents(props.events)
		}

		if (props?.backgroundEvents) {
			setBackgroundEvents(props.backgroundEvents)
		}

	}, [props])

	return (
		<>
			<DnDCalendar
				className={styles.calendar}
				localizer={localizer}
				events={events}
				backgroundEvents={backgroundEvents}
				views={views.options}
				{...defaultProps}
				{...calendarFunctions}
				{...accessors}
				{...editFunctions(setEvents, events)}
			/>
		</>
	);
}

export default CalendarView;
