'use server'

import parseCalendars from "@utils/calendar/parseCalendarFeeds"
import type { Calendar } from "@ts/calendar"

export const fetchCalendarEvents = async (calendars: Calendar[]) => {
	const calendarEvents = await parseCalendars(calendars)

	return calendarEvents
}