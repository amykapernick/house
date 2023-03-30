export type LayoutData = {
	title?: string
	description?: string
}

export type MenuItem = {
	label: string
	link: string
}

export type SocialLink = MenuItem & {
	icon: string
}