const cssImport = require(`postcss-import`);
const stylelint = require(`stylelint`);
const nesting = require(`postcss-nesting`);
const mixins = require(`postcss-mixins`);
const path = require(`path`);

module.exports = {
	plugins: [
		cssImport,
		mixins({
			mixinsFiles: path.join(__dirname, `../src/styles/mixins/*`)
		}),
		nesting,
		stylelint({
			configFile: `./config/.stylelint.config.cjs`,
			quiet: true
		})
	],
}; 