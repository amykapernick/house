import eslintImport from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintTs from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import stylistic from '@stylistic/eslint-plugin-js';
import styleisticTs from '@stylistic/eslint-plugin-ts';

export default [
	{
		files: [
			`**/*.js`,
			`**/*.cjs`,
			`**/*.mjs`,
			`**/*.jsx`,
			`**/*.ts`,
			`**/*.tsx`,
		],
		languageOptions: {
			parser: tsParser,
		},
		ignores: [`node_modules`, `dist`, `.next`],
		plugins: {
			'import': eslintImport,
			'jsx-a11y': jsxA11y,
			'@typescript-eslint': eslintTs,
			'@stylistic': stylistic,
			'@stylistic/ts': styleisticTs,
		},
		rules: {
			'@stylistic/indent': [
				`error`,
				`tab`,
				{
					SwitchCase: 1,
					VariableDeclarator: 1,
				},
			],
			'@stylistic/arrow-spacing': [
				`error`,
				{
					before: true,
					after: true,
				},
			],
			'@stylistic/comma-dangle': [
				`error`,
				{
					objects: `only-multiline`,
					arrays: `only-multiline`,
					imports: `never`,
					exports: `never`,
					functions: `never`,
				},
			],
			'no-var': `error`,
			'no-unused-vars': 1,
			'one-var': [`error`, `never`],
			'quotes': [`error`, `backtick`],
			'no-param-reassign': 0,
			'class-methods-use-this': 0,
			'import/order': [
				`error`,
				{
					groups: [
						`builtin`,
						`external`,
						`internal`,
						`parent`,
						`sibling`,
						`index`,
						`object`,
						`type`,
					],
				},
			],
			'@typescript-eslint/consistent-type-imports': [
				`error`,
				{
					prefer: `type-imports`,
					fixStyle: `separate-type-imports`,
				},
			],
			'@stylistic/brace-style': [`error`, `stroustrup`],
		},
	},
];
