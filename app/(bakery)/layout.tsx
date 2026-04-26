import Header from "@/components/header";
import Nav from "@/components/nav";
import ScrollReset from "@/components/scroll-reset";



export default async function Layout({
	children,
}: {
	children: React.ReactNode
}) {

	return (
		<div className="bg-parchment">
			<ScrollReset />
			<Header />
			<Nav />
			<main className="pt-14 md:pl-56 landscape:pl-56 pb-16 md:pb-0 landscape:pb-0">{children}</main>
		</div>
	)
}