import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: `../household_api/src/graphql/**/*.graphql`,
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
