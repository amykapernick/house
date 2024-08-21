import Event from "../Event"
import Task from "../Task"
import styles from './styles.module.css'
import type { CSSProperties, ReactNode } from "react"
import type { Event as EventType, TaskEvent } from '@ts/calendar'
import type { Colour } from "@ts/global"

const contrastColours: Record<Colour, Colour> = {
	purple_bright: `white`,
	purple: `white`,
	purple_light: `black`,
	blue_navy: `white`,
	blue_mid: `white`,
	blue: `black`,
	blue_light: `black`,
	green_teal: `white`,
	green_dark: `white`,
	green: `black`,
	green_light: `black`,
	green_lime: `black`,
	red: `black`,
	pink_dark: `white`,
	pink: `black`,
	orange_peach: `black`,
	orange_dark: `white`,
	orange: `black`,
	yellow: `black`,
	white: `black`,
	black: `white`,
	grey: `white`,
	grey_light: `black`
}

type CustomEventProps = {
	event: EventType
	children?: ReactNode
}

export const CustomEvent = ({event}: CustomEventProps) => {
	return (
		<>
			{event.type === `task` && <Task {...event as TaskEvent} />}
			{event.type === `event` && <Event {...event} />}
		</>
	)
}

export const EventWrapper = (props: CustomEventProps) => {
	const { children, event } = props
	let style: CSSProperties = {}
	
	if(
		event.resource 
		&& event.resource.length === 1
		&& event.resource?.[0]
	) {
		style = {
			...style,
			'--feature_colour': `var(--${event.resource[0].colour})`,
			'--contrast_colour': `var(--${contrastColours[event.resource[0].colour as Colour]})`
		} as CSSProperties
	}

	return (
		<div className={styles.event} style={style}>
			{children}
		</div>
	)
}