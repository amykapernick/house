import { setDay, addDays, getDay } from 'date-fns'

type currentWeekProps = {
	date?: Date
}

const getCurrentWeek = (props?: currentWeekProps) => {
	const { date = new Date } = props || {}
	const startWeek = addDays(setDay(date, 6), -7)
	const currentDate = (getDay(date) < 4 && getDay(date) !== 6) ? startWeek : addDays(startWeek, 7) 

	return currentDate

}

export default getCurrentWeek