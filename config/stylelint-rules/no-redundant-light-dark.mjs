import valueParser from 'postcss-value-parser';
import stylelint from 'stylelint';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import hwbPlugin from 'colord/plugins/hwb';
import labPlugin from 'colord/plugins/lab';
import lchPlugin from 'colord/plugins/lch';

// Same colour-parsing support as no-duplicate-colour-value, so eg.
// `light-dark(white, #ffffff)` is caught even though the two args aren't
// written identically. See that file for why oklab()/oklch() aren't included.
extend([namesPlugin, hwbPlugin, labPlugin, lchPlugin]);

const ruleName = `house/no-redundant-light-dark`;

const messages = stylelint.utils.ruleMessages(ruleName, {
	rejected: (value) =>
		`light-dark() light and dark values are identical ("${value}") - light-dark() is redundant here, use the value directly`,
});

const meta = {
	url: `https://github.com/amykapernick/house`,
	fixable: true,
};

/** @param {string} value */
const normalizeText = (value) => value.trim().replace(/\s+/g, ` `);

/** @param {string} value */
const normalizeColour = (value) => {
	const parsed = colord(value.trim());
	return parsed.isValid() ? parsed.toRgbString() : null;
};

/** Splits a light-dark() function node's direct children into its two (or more, if malformed) comma-separated argument spans. @param {import('postcss-value-parser').FunctionNode} fnNode */
const splitArgs = (fnNode) => {
	const args = [];
	let current = [];

	for (const child of fnNode.nodes) {
		if (child.type === `div` && child.value === `,`) {
			args.push(current);
			current = [];
			continue;
		}

		current.push(child);
	}
	args.push(current);

	return args
		.map((nodes) => nodes.filter((node) => node.type !== `space` && node.type !== `comment`))
		.filter((nodes) => nodes.length > 0)
		.map((nodes) => ({
			start: nodes[0].sourceIndex,
			end: nodes[nodes.length - 1].sourceEndIndex,
		}));
};

const ruleFunction = (enabled) => {
	return (root, result) => {
		const validOptions = stylelint.utils.validateOptions(result, ruleName, {
			actual: enabled,
			possible: [true, false],
		});

		if (!validOptions || !enabled) return;

		root.walkDecls((decl) => {
			const parsed = valueParser(decl.value);
			const edits = [];

			parsed.walk((node) => {
				if (node.type !== `function` || node.value.toLowerCase() !== `light-dark`) return;

				const args = splitArgs(node);
				if (args.length !== 2) return; // malformed - let stylelint's own value validation handle it

				const [light, dark] = args;
				const lightRaw = decl.value.slice(light.start, light.end);
				const darkRaw = decl.value.slice(dark.start, dark.end);

				const textMatch = normalizeText(lightRaw) === normalizeText(darkRaw);
				const lightColour = normalizeColour(lightRaw);
				const colourMatch = lightColour !== null && lightColour === normalizeColour(darkRaw);

				if (!textMatch && !colourMatch) return;

				stylelint.utils.report({
					message: messages.rejected(normalizeText(lightRaw)),
					node: decl,
					result,
					ruleName,
					fix: () => edits.push({ start: node.sourceIndex, end: node.sourceEndIndex, replacement: normalizeText(lightRaw) }),
				});
			});

			if (!edits.length) return;

			edits.sort((a, b) => b.start - a.start);
			for (const { start, end, replacement } of edits) {
				decl.value = decl.value.slice(0, start) + replacement + decl.value.slice(end);
			}
		});
	};
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default stylelint.createPlugin(ruleName, ruleFunction);
