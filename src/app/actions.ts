'use server'

import { Calendar } from "@ts/calendar"
import parseCalendars from "@utils/calendar/parseCalendarFeeds"

export const fetchCalendarEvents = async (calendars: Calendar[]) => {
	const calendarEvents = await parseCalendars(calendars)

	return calendarEvents
}