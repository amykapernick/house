// src/middleware.js
import clerkClient from '@clerk/clerk-sdk-node'

const publishableKey = import.meta.env.PUBLIC_CLERK_PUBLISHABLE_KEY
const secretKey = import.meta.env.CLERK_SECRET_KEY

const protectedPageUrls = ['/auth']

export async function onRequest ({ request, redirect }, next) {
	const url = new URL(request.url)
	
	if (
		!protectedPageUrls.some(
			path => url.pathname.startsWith(path)
		)
	) {
		return next()
	}
	
	const { isSignedIn } = await clerkClient.authenticateRequest({ 
		request, 
		publishableKey, 
		secretKey })

	if (!isSignedIn) {
		return redirect('/')
	}
	
	return next()
};