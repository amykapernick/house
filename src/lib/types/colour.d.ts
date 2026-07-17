export type EditableColour = {
	id: string
	name: string
	hex: string | null
	link: string | null
	theme: string | null
	neutral: boolean
	text: { name: string | null; hex: string | null } | null
}
