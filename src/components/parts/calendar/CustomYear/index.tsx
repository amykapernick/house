import { navigate } from 'react-big-calendar/lib/utils/constants'
import { addYears, format, endOfMonth, getMonth, getWeeksInMonth, getYear, set, startOfMonth, startOfYear, subYears, getDaysInMonth } from "date-fns"
import MonthView from 'react-big-calendar/lib/Month'
import styles from './styles.module.css'
 
const Calendar = (props) => {
	const { startDate } = props
	const month = format(startDate, `MMM`)
	const daysCount = getDaysInMonth(startDate)
	const days = []

	while (days.length < daysCount) {
		days.push(
			<div key={days.length + 1}>
				{days.length + 1}
			</div>
		)
	}

	return (
		<>
			<p>{month}</p>
			{days.map(day => day)}			
		</>
	)
}

const YearView = (props) => {
	const {date, ...params} = props 
	const range = YearView.range(date)
	const months = []
	const first = startOfYear(date)

	for (let i = 0; i < 12; i++) {
		const start = startOfMonth(set(first, { month: i }))
		months.push(
			<div className={styles.row} key={i}>
				<p className={styles.name}>
					{format(start, `MMM`)}
				</p>
				<MonthView 
					{...params} 
					date={start} 
					className={[
						styles.month,
						styles[`weeks--${getWeeksInMonth(start)}`]
					].join(` `)}
				/>
			</div>
		)
	}

	const days = [
		`Mon`,
		`Tue`,
		`Wed`,
		`Thu`,
		`Fri`,
		`Sat`,
		`Sun`,
		`Mon`,
		`Tue`,
		`Wed`,
		`Thu`,
		`Fri`,
		`Sat`,
		`Sun`,
		`Mon`,
		`Tue`,
		`Wed`,
		`Thu`,
		`Fri`,
		`Sat`,
		`Sun`,
		`Mon`,
		`Tue`,
		`Wed`,
		`Thu`,
		`Fri`,
		`Sat`,
		`Sun`,
		`Mon`,
		`Tue`,
		`Wed`,
		`Thu`,
		`Fri`,
		`Sat`,
		`Sun`,
		`Mon`,
		`Tue`,
		`Wed`,
		`Thu`,
		`Fri`,
		`Sat`,
		`Sun`,
	]
	

	return (
		<div className={styles.year}>
			<div className={styles.header}>
				{days.map((day, i) => (
					<span key={`${day}_${i}`} className={styles.day}>
						{day}
					</span>
				))}
			</div>
			{months.map(month => month)}
		</div>
	)

}

YearView.range = date => {
	return [startOfYear(date)]
}

YearView.navigate = (date, action) => {
	switch (action) {
		case navigate.PREVIOUS:
			return subYears(date, 1)

		case navigate.NEXT:
			return addYears(date, 1)

		default:
			return date
	}
}

YearView.title = (date, { localizer }) => localizer.format(date, `yearHeaderFormat`)

export default YearView