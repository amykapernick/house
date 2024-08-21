import Header from '@partials/Header'
import Footer from '@partials/Footer'
import Layout from '@components/layouts/default'
import './styles.css'

export default function DefaultLayout ({
	children,
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<>
			<Header />
			<main>
				<Layout>
					{children}
				</Layout>
			</main>
			<Footer />
		</>
	)
}


