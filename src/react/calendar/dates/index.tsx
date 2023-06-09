import { addDays, addWeeks, isBefore, format, differenceInCalendarWeeks, isSameDay } from "date-fns";
import type { CSSProperties } from "react";

type Props = {
	startWeek: string;
	className?: string;
	weeksShown: number;
}

const days = [
	'Mon',
	'Tue',
	'Wed',
	'Thur',
	'Fri',
	'Sat',
	'Sun',
]

const Dates = (props: Props) => {
	const { weeksShown } = props;
	const startDate = new Date(props.startWeek);
	const dates = []

	let i = startDate;

	while(isBefore(i, addWeeks(startDate, weeksShown))) {
		dates.push(format(i, 'yyyy-MM-dd'))

		i = addDays(i, 1);
	}
	
	return (
		<>
			{days.map(d => (
				<div key={d} className={props.className}>{d}</div>
			))}
			{dates.map(d => {
				const date: Date = new Date(d);
				const row: number = differenceInCalendarWeeks(date, startDate, {weekStartsOn: 1}) + 2;
				const column: number = parseInt(format(date, 'i'));

				return (
					<div
						key={format(date, 'yyyy-MM-dd')}
						className={props.className}
						data-date={format(date, 'd')}
						data-month={format(date, 'MMM')}
						data-past={
							isBefore(date, new Date()) &&
							!isSameDay(date, new Date())
						}
						style={{
							'--row': row,
							'--column': column,
						} as CSSProperties}
					/>
				)
			})}
		</>
	)
}

export default Dates