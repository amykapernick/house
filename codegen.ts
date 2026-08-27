import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: `../household_api/src/graphql/**/*.graphql`,
	hooks: {
		// codegen's typescript plugin always emits 2-space/quoted output, which doesn't
		// match this repo's tabs/backticks eslint style - reformat right after writing.
		afterOneFileWrite: [`eslint --fix -c ./config/eslint.config.mjs`],
	},
	generates: {
		'./src/lib/types/generated.ts': {
			plugins: [`typescript`],
			config: {
				enumsAsTypes: true,
				skipTypename: true,
				declarationKind: `type`,
				avoidOptionals: {
					field: true,
					inputValue: false,
					object: false,
				},
				// Date/DateTime are custom GraphQL scalars (household_api's src/graphql/scalars) -
				// both serialize to plain ISO strings over the wire, so keep them typed as such here
				// rather than the codegen default of `any`.
				scalars: {
					Date: `string`,
					DateTime: `string`,
				},
			},
		},
	},
};

export default config;
