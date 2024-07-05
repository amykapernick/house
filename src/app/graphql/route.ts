import { ApolloServer } from '@apollo/server'
import {startServerAndCreateNextHandler} from '@as-integrations/next'
import { NextRequest } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import mealResolvers from 'src/graphql/meals/resolvers';
import { mergeResolvers } from '@graphql-tools/merge'
import { mergeSchemas } from '@graphql-tools/schema';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import {loadSchema} from '@graphql-tools/load'
import { headers } from 'next/headers';

 
const schema = mergeSchemas({
	schemas: [
		await loadSchema('src/graphql/**/schema.graphql', {loaders: [new GraphQLFileLoader()]})
	],
	resolvers: mergeResolvers([mealResolvers])
})


const server  = new ApolloServer({
	schema
})

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
	context: async req => {
		return ({
			req, 
			auth: !!auth()?.userId
		})
	}
})

const requestFunction = async (req: NextRequest) => {
	const response = await handler(req)

	response.headers.append('Access-Control-Allow-Origin', '*')
	response.headers.append('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

	return response
}

export {
	requestFunction as GET, 
	requestFunction as POST, 
	requestFunction as OPTIONS
}