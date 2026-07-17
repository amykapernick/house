// Scoped stylelint config exposing only `house/no-duplicate-colour-value` -
// wired into `npm run lint`/`lint:ci` so literal colours that duplicate an
// existing variable are caught in CI, without pulling in every rule from
// stylelint.config.cjs (property ordering, nesting, etc.), which the
// codebase doesn't yet pass cleanly.
module.exports = {
	plugins: [`./stylelint-rules/no-duplicate-colour-value.mjs`],
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
	},
};
