export type Guest = {
	id: string
	name: {
		first: string
		last: string
	}
	dietaries?: string
	age?: number
	meal: `Adult` | `Vendor` | `Dietary` | `Kids` | `None`
	child: boolean
}