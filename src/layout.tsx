import { ClerkProvider } from '@clerk/nextjs'
import Header from '@parts/header'
import Footer from '@parts/footer'
import '@styles/app.css'
import Favicon from '@img/favicon.ico'
import { LayoutData } from '@ts/global'

export const metadata: LayoutData = {
	title: "Home",
  description: "Meal Planning, Tasks, Reminders, Calendars",
}

export default function RootLayout ({
	children,
}: Readonly<{
	children: React.ReactNode
}>)
{
	return (
		<ClerkProvider>
			<html lang="en-AU">
				<head>
				<meta charset="utf-8" />
    <meta http-equiv="x-ua-compatible" content="ie=edge" />
    <meta
      name="viewport"
      content="width=device-width,initial-scale=1,shrink-to-fit=no"
    />
    <link rel="shortcut icon" href={Favicon} />
					<title>{metadata.title}</title>
					<meta name="description" content={metadata.description} />
				</head>
				<body>
				{process.env.MODE === "development" && <DevStyles />}
					<Header />
					<main>
					{children}
					</main>
					<Footer />
					<Fathom />
				</body>
			</html>
		</ClerkProvider>
	)
}


