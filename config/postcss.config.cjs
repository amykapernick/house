const cssImport = require(`postcss-import`);
const stylelint = require(`stylelint`);
const nesting = require(`postcss-nesting`);
const mixins = require(`postcss-mixins`);

module.exports = {
	plugins: [
		cssImport,
		mixins({
			mixinsFiles: `./styles/mixins/*.css`
		}),
		nesting,
		stylelint({
			configFile: `./config/.stylelint.config.cjs`,
			quiet: true
		})
	],
};