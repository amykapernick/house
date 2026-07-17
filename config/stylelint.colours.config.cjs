// Scoped stylelint config exposing only the `house/*` colour rules - wired
// into `npm run lint`/`lint:ci` so hardcoded colour values are caught in CI,
// without pulling in every rule from stylelint.config.cjs (property
// ordering, nesting, etc.), which the codebase doesn't yet pass cleanly.
module.exports = {
	plugins: [
		`./stylelint-rules/no-duplicate-colour-value.mjs`,
		`./stylelint-rules/no-repeated-value.mjs`,
	],
	overrides: [
		{
			files: [`**/*.svelte`],
			customSyntax: `postcss-html`,
		},
	],
	ignoreFiles: [
		`**/*.tsx`,
		`**/*.ts`,
		`**/*.js`,
		`**/*.jsx`,
		`**/*.json`,
		`**/*.cjs`,
		`**/*.mjs`,
	],
	rules: {
		'house/no-duplicate-colour-value': true,
		'house/no-repeated-value': [true, { threshold: 3 }],
	},
};
