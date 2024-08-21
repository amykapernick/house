import { ClerkProvider } from '@clerk/nextjs'
import '@styles/main.css'
import DevStyles from '@components/partials/devStyles'
import type { Metadata } from 'next'

export const metadata: Metadata = {
	title: `Kapers Crewe Household`,
	description: `Meal Planning, Tasks, Reminders, Calendars`,
	applicationName: `Kapers Crewe Household`,
}

export default function RootLayout ({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<ClerkProvider>
			<html lang="en-AU">
				<head>
					<meta charSet="utf-8" />
					<meta httpEquiv="x-ua-compatible" content="ie=edge" />
					<meta
						name="viewport"
						content="width=device-width,initial-scale=1,shrink-to-fit=no"
					/>
				</head>
				<body>
					{process.env.MODE === `development` && <DevStyles />}
					{children}
				</body>
			</html>
		</ClerkProvider>
	)
}


