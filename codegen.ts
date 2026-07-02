import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
	schema: '../household_api/src/graphql/**/*.graphql',
	generates: {
		'./src/lib/types/generated.ts': {
			plugins: ['typescript'],
			config: {
				enumsAsTypes: true,
				skipTypename: true,
				declarationKind: 'type',
				avoidOptionals: {
					field: true,
					inputValue: false,
					object: false,
				},
			},
		},
	},
};

export default config;
