import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Client } from '@notionhq/client';
import parseSources from "../utils/parseSources";
import parseMeals from "../utils/parseMeals";

const dataSources = {
    meals: parseMeals
}

export async function notion(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    let response: HttpResponseInit = {
        status: 200,
        headers: {
            'Content-Type': 'application/json'
        },
    }
    const notion = new Client({
        auth: process.env.NOTION_API_SECRET
    })

    const notionSources = await notion.databases.query({
        database_id: process.env.NOTION_SOURCE_DB
    }).then(res => res)
    .catch(error => ({error}))
    if(notionSources?.error) {
        return ({
            ...response,
            status: 500,
            jsonBody: {
                message: 'Error fetching sources',
                error: notionSources?.error
            }
        })
    }
    const sources = parseSources(notionSources?.results || [])
    const params = await request.json()
    const source = sources.find(source => source.slug === params.source)

    if(!source) {
        return ({
            ...response,
            status: 404,
            jsonBody: {
                message: 'Source not found'
            }
        })
    }

    const notionData = await notion.databases.query({
        database_id: source.database
    })
        .then(res => res)
        .catch(error => ({error}))
    if(notionData?.error) {
        return ({
            ...response,
            status: 500,
            jsonBody: {
                message: 'Error fetching sources',
                error: notionData?.error
            }
        })
    }

    const parseData = dataSources[source.slug]

    if(!parseData) {
        return ({
            ...response,
            status: 500,
            jsonBody: {
                message: 'Error parsing data, no parser found'
            }
        })
    }

    const data = parseData(notionData?.results || [])

    response.jsonBody = data

    return ({
        ...response
    });
};

app.http('notion', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: notion
});