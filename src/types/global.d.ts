export type LayoutData = {
	title?: string
	description?: string
}

export type MenuItemBasics = {
	label: string
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