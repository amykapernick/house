import eslintImport from 'eslint-plugin-import';
import eslintTs from '@typescript-eslint/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import svelteConfig from '../svelte.config.js';

export default [
	{
		ignores: [`node_modules/**`, `dist/**`, `.svelte-kit/**`, `build/**`],
	},
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
		plugins: {
			'import': eslintImport,
			'@typescript-eslint': eslintTs,
			'@stylistic': stylistic,
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
			'no-unused-vars': `off`,
			'@typescript-eslint/no-unused-vars': 1,
			'one-var': [`error`, `never`],
			'@stylistic/quotes': [`error`, `backtick`],
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
	...svelte.configs.recommended,
	{
		files: [`**/*.svelte`, `**/*.svelte.ts`, `**/*.svelte.js`],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parserOptions: {
				extraFileExtensions: [`.svelte`],
				parser: tsParser,
				svelteConfig,
			},
		},
		rules: {
			// Surfaces the Svelte compiler's own warnings (including a11y checks)
			// as lint findings instead of only showing up in svelte-check.
			'svelte/valid-compile': [`error`, { ignoreWarnings: false }],
		},
	},
];
