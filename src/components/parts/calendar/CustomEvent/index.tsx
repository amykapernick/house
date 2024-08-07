import Event from "../Event"
import Task from "../Task"
import type { Event as EventType, TaskEvent } from '@ts/calendar'
import styles from './styles.module.css'
import { CSSProperties } from "react"
import { Colour } from "@ts/global"

const contrastColours: Record<Colour, Colour> = {
	purple_bright: 'white',
	purple: 'white',
	purple_light: 'black',
	blue_navy: 'white',
	blue_mid: 'white',
	blue: 'black',
	blue_light: 'black',
	green_teal: 'white',
	green_dark: 'white',
	green: 'black',
	green_light: 'black',
	green_lime: 'black',
	red: 'black',
	pink_dark: 'white',
	pink: 'black',
	orange_peach: 'black',
	orange_dark: 'white',
	orange: 'black',
	yellow: 'black',
	white: 'black',
	black: 'white',
}

export const CustomEvent = ({event}: {event: EventType}) => {
	return (
		<>
			{event.type === 'task' && <Task {...event as TaskEvent} />}
			{event.type === 'event' && <Event {...event} />}
		</>
	)
  }

export const EventWrapper = (props: EventType) => {
	const { children, event } = props
	const style: CSSProperties = {}

	if(
		event.resource 
		&& event.resource.length === 1
		&& event.resource?.[0]
	) {
		style['--feature_colour'] = `var(--${event.resource[0].colour})`
		style['--contrast_colour'] = `var(--${contrastColours[event.resource[0].colour]})`
	}

	return (
		<div className={styles.event} style={style}>
			{children}
		</div>
	)
}