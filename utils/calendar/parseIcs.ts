import { parse } from 'date-fns'

const dataKeys: Record<string, string> = {
	DTSTAMP: 'timestamp',
	'DTSTART;VALUE=DATE': 'start_date',
	'DTEND;VALUE=DATE': 'end_date',
	SUMMARY: 'name',
	DESCRIPTION: 'description',
	LOCATION: 'location',
	DTSTART: 'start',
	DTEND: 'end',
}

type Event = {
	start_date: Date
	end_date: Date
	timestamp: Date
	description: string
	name: string
	allDay: boolean
	start: Date
	end: Date
	location: string
}

const parseICS = (data: any): Event[] => {
	console.log({data})
	const events: Event[] = data
		.slice(data.indexOf('BEGIN:VEVENT'), data.indexOf('END:VCALENDAR'))
		.replace(/^BEGIN:VEVENT\r\n/, '')
		.replace(/\r\nEND:VEVENT\r\n$/, '')
		.split('END:VEVENT\r\nBEGIN:VEVENT\r\n')
		.map((event: any) => {
			let eventData: any = {}

			// console.log({event})

			event.split('\r\n').forEach(line => {
				const [key, value] = line.split(':')

				if (dataKeys[key]) {
					eventData[dataKeys[key]] = value

					if (
						dataKeys[key] == 'start_date' ||
						dataKeys[key] == 'end_date'
					) {
						eventData[dataKeys[key]] = parse(value, 'yyyyMMdd', new Date())
					}

					if (
						dataKeys[key] == 'start' ||
						dataKeys[key] == 'end' ||
						dataKeys[key] == 'timestamp'
					) {
						eventData[dataKeys[key]] = parse(value, 'yyyyMMdd\'T\'HHmmss\'Z\'', new Date())
					}

					if (dataKeys[key] == 'location') {
						eventData[dataKeys[key]] = value
						const matches = value.match(/^(?<city>(?:\w|\s)+)\\, (?:(?<state>(?:\w|\s)+)\\, )?(?<country>(?:\w|\s)+)$/)

						if (matches) {
							eventData = {
								...eventData,
								...matches.groups
							}
						}
					}
				}
			})

			if (!eventData?.start && !eventData?.end) {
				eventData.allDay = true
				eventData.start = eventData.start_date
				eventData.end = eventData.end_date
			}

			return eventData
		})

	return events
}

export default parseICS