import path from 'path';
import advancedVariables from 'postcss-advanced-variables';
import hexrgba from 'postcss-hexrgba';
import nesting from 'postcss-nesting';
import mixins from 'postcss-mixins';
import stylelint from 'stylelint';
import variables from '../src/lib/styles/config/variables.js';

export default {
	plugins: [
		advancedVariables({
			disable: `@import`,
			variables,
		}),
		hexrgba(),
		nesting({
			noIsPseudoSelector: true,
		}),
		mixins({
			mixinsDir: path.resolve(`./src/lib/styles/mixins`),
		}),
		stylelint({
			configFile: path.resolve(`./config/stylelint.config.cjs`),
			fix: true,
			quiet: true,
		}),
	],
};
