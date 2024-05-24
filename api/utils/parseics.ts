const { parse, format } = require('date-fns')

const dataKeys = {
	DTSTAMP: 'timestamp',
	'DTSTART;VALUE=DATE': 'start_date',
	'DTEND;VALUE=DATE': 'end_date',
	SUMMARY: 'name',
	DESCRIPTION: 'description',
	LOCATION: 'location',
	DTSTART: 'start',
	DTEND: 'end',
}

const parseICS = (data: any) => {
	const events = data
		.slice(data.indexOf('BEGIN:VEVENT'), data.indexOf('END:VCALENDAR'))
		.replace(/^BEGIN:VEVENT\r\n/, '')
		.replace(/\r\nEND:VEVENT\r\n$/, '')
		.split('END:VEVENT\r\nBEGIN:VEVENT\r\n')
		.map(event => {
			let eventData: any = {}

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