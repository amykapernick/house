const stylelint = require(`stylelint`);

module.exports = {
	plugins: [

		stylelint({
			configFile: `./config/stylelint.config.cjs`,
			quiet: false,
			fix: true,
		})
	],
}; 