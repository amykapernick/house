const svgSourcePattern = /^(.*\.svg)(\?(.*))?$/;

function checkSource(context, node) {
	const value = node.value;

	if (typeof value !== `string`) return;

	const match = value.match(svgSourcePattern);

	if (!match) return;

	const [, path, , query] = match;

	if (query === `component`) return;

	context.report({
		node,
		message: `SVG imports must use the ?component query so they resolve to a Svelte component.`,
		fix(fixer) {
			const quote = node.raw[0];

			return fixer.replaceText(node, `${quote}${path}?component${quote}`);
		},
	});
}

export default {
	meta: {
		type: `problem`,
		docs: {
			description: `require SVG imports to use the ?component query so they resolve to a Svelte component`,
		},
		fixable: `code`,
		schema: [],
	},
	create(context) {
		return {
			ImportDeclaration(node) {
				checkSource(context, node.source);
			},
			ExportNamedDeclaration(node) {
				if (node.source) checkSource(context, node.source);
			},
			ExportAllDeclaration(node) {
				checkSource(context, node.source);
			},
		};
	},
};
