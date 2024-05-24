import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticate } from '@google-cloud/local-auth'
import { google } from 'googleapis'
const { DefaultAzureCredential } = require("@azure/identity");
const { SecretClient } = require("@azure/keyvault-secrets");

const scopes = ["https://www.googleapis.com/auth/calendar.readonly"];

export async function calendar(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        '/api/auth'
      );

      let nextRedirectUrl;

      if(!req.query.code)
        {
          //When we don't have a code must be first request
          const scopes = ["https://www.googleapis.com/auth/calendar.readonly"];
      
          nextRedirectUrl = oauth2Client.generateAuthUrl({
            
            //offline access allows us to get a refresh_token that we can use later
            access_type: "offline",
            scope: scopes,
            include_granted_scopes: true,
            //forces a refresh token every time
            prompt: "consent",
          });
         
        }else{
        
          //now we have returned get access and refresh tokens
          let { tokens } = await oauth2Client.getToken(req.query.code);
      
          //Save tokens in KeyVault (in real world you want unique keys per user)
          const credential = new DefaultAzureCredential();
          const url = `https://${process.env.AZURE_KEYVAULT}.vault.azure.net`;
        
          const client = new SecretClient(url, credential);
          
          await client.setSecret("refreshToken", tokens.refresh_token);
          await client.setSecret("accessToken", tokens.access_token);
      
          //oauth2Client.setCredentials(tokens);
          nextRedirectUrl = process.env["SuccessRedirectUrl"] 
        }


    return { status: 302,
        headers: { "location": nextRedirectUrl },
        body: null, };
};

app.http('calendar', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: calendar
});
