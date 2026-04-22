import Header from "@/components/header";
import Nav from "@/components/nav";



export default async function Layout({
	children,
}: {
	children: React.ReactNode
}) {


	return (
		<div>
			<Header />
			<Nav />
			<main className="pt-14 md:pl-56 pb-16 md:pb-0">{children}</main>
		</div>
	)
}