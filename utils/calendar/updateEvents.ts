export const resizeEvent = ({event, start, end}, allEvents) => {
	const updatedEvents = allEvents.map((e) => {
		if (e.id === event.id) {
			return { ...e, start, end };
		}
		return e;
	});
	
	return updatedEvents
}
export const moveEvent = ({event, start, end, isAllDay = false}, allEvents) => {
	const updatedEvents = allEvents.map((e) => {
		if (e.id === event.id) {
			return ({ 
				...e, 
				start, 
				end,
				allDay: isAllDay
			});
		}
		return e;
	});
	
	return updatedEvents
}