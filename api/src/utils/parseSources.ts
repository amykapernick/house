const parseSources = (notionData) => {
	const data = []

	notionData.forEach(source => {
		data.push({
			name: source.properties.Name.title[0]?.plain_text,
			database: source.properties.Database.rich_text[0]?.plain_text,
			slug: source.properties.Slug.rich_text[0]?.plain_text
		})
	})

	return data
}

export default parseSources