declare module `*.graphql`

export type LayoutData = {
	title?: string
	description?: string
}

export type MenuItemBasics = {
	label: string
	auth?: boolean
}

export type MenuLink = MenuItemBasics & {
	link: string
	items?: never
}

export type MenuCategory = MenuItemBasics & {
	items: MenuItem[]
	link?: never
}

export type MenuItem = MenuLink | MenuCategory

export type SocialLink = MenuItem & {
	icon: string
}

export type Colour = `purple_bright` | `purple` | `purple_light` | `blue_navy` | `blue_mid` | `blue` | `blue_light` | `green_teal` | `green_dark` | `green` | `green_light` | `green_lime` | `red` | `pink_dark` | `pink` | `orange_peach` | `orange_dark` | `orange` | `yellow` | `white` | `grey` | `grey_light` | `black`

export type Platform = `notion` | `todoist`

type UserIds = Record<Platform, string>

export type User =  {
	slug: string
	name: string
	profile: string
	ids: UserIds
	colour: Colour
}