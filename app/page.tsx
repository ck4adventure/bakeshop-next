import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default async function Home() {
	const session = await getServerSession(authOptions)
	if (session) redirect("/today")

	return (
		<div className="flex flex-col min-h-screen bg-background">
			{/* Header Bar */}
			<header className="w-full bg-card border-b border-border flex items-center justify-between px-8 py-4">
				<div className="flex items-center gap-2">
					<Image src="/cookies_clear.png" alt="Logo" width={32} height={32} />
					<span className="text-xl font-bold text-foreground">The Daily Bake</span>
				</div>
				<div>
					<Link href="/login" className="px-4 py-2 border border-primary text-primary rounded-full hover:bg-primary/10 transition font-semibold text-sm">
						Log In
					</Link>
				</div>
			</header>

			<main className="flex-1 w-full max-w-4xl mx-auto px-4 pt-10 pb-16 flex flex-col gap-12">
				{/* Hero Section */}
				<section className="flex flex-col items-center text-center py-12 bg-card border border-border rounded-[12px]">
					<Image
						src="/chartv1.png"
						alt="Business Hero"
						width={600}
						height={300}
						className="mb-6"
						loading="eager"
					/>
					<h1 className="text-4xl font-bold text-foreground mb-3">Inventory Management for Bakeries</h1>
					<p className="text-lg text-muted-foreground mb-6 max-w-xl">
						Keep the right balance of stock on hand — track daily bakes, plan your schedule, and stay ahead of demand.
					</p>
					<Link href="/login" className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full hover:bg-sienna-hover transition font-semibold">
						Interactive Demo
					</Link>
				</section>
			</main>

			{/* Footer */}
			<footer className="w-full bg-card border-t border-border py-6 flex flex-col md:flex-row items-center justify-between px-8 text-muted-foreground text-sm">
				<span>&copy; {new Date().getFullYear()} The Daily Bake. All rights reserved.</span>
				<div className="flex gap-4 mt-2 md:mt-0">
					{/* <Link href="#privacy" className="hover:text-foreground transition">Privacy Policy</Link>
					<Link href="#terms" className="hover:text-foreground transition">Terms of Service</Link>
					<Link href="#contact" className="hover:text-foreground transition">Contact</Link> */}
				</div>
			</footer>
		</div>
	)
}
