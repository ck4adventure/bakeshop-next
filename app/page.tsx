import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export default async function Home() {
	const session = await getServerSession(authOptions)
	if (session) redirect("/shopid")

	return (
				<div className='flex flex-col justify-center items-center m-0'>
			{/* Header Bar */}
			<header className="w-full bg-white shadow flex items-center justify-between px-8 py-4">
				<div className="flex items-center gap-2">
					<Image src="/cookies.png" alt="Logo" width={32} height={32} />
					<span className="text-xl font-bold text-blue-900">Bakedown</span>
				</div>
				<nav className="flex items-center gap-6">
					<Link href="#features" className="text-blue-800 hover:text-blue-600 font-medium">Features</Link>
					<Link href="#about" className="text-blue-800 hover:text-blue-600 font-medium">About</Link>
					<Link href="#contact" className="text-blue-800 hover:text-blue-600 font-medium">Contact</Link>
				</nav>
				<div>
					<Link href="/login" className="ml-2 px-4 py-2 border border-blue-700 text-blue-700 rounded hover:bg-blue-50 transition font-semibold">Log In</Link>
					<Link href="/signup" className="ml-4 px-4 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition font-semibold">Sign Up</Link>
				</div>
			</header>
		<main className="w-full max-w-4xl mt-8 flex flex-col gap-12">
			{/* Jumbotron / Hero Section */}
			<section className="flex flex-col items-center text-center py-12 bg-blue-50 rounded-lg shadow">
				<Image
					src="/chartv1.png"
					alt="Business Hero"
					width={600}
					height={300}
					className="mb-4"
					loading="eager"
				/>
				<h1 className="text-4xl font-bold text-blue-900 mb-2">Inventory Management for Bakeries</h1>
				<p className="text-lg text-blue-700 mb-4">
					We help you keep the right balance of stock on hand with our amazing products and services.
				</p>
				<button className="px-6 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition">
					Get Started
				</button>
			</section>

			{/* Features Section */}
			<section className="grid grid-cols-1 md:grid-cols-3 gap-6" id="features">
				<div className="bg-white p-6 rounded shadow text-center">
					<h2 className="font-semibold text-blue-800 mb-2">Inventory Forecasting</h2>
					<p className="text-blue-600">Easily see current inventory levels and the forecasted usage.</p>
				</div>
				<div className="bg-white p-6 rounded shadow text-center">
					<h2 className="font-semibold text-blue-800 mb-2">Daily Bakeoff Lists</h2>
					<p className="text-blue-600">View what's on order for the day.</p>
				</div>
				<div className="bg-white p-6 rounded shadow text-center">
					<h2 className="font-semibold text-blue-800 mb-2">Batch Creation</h2>
					<p className="text-blue-600">One-click to add a batch to re-up inventory.</p>
				</div>
			</section>

			{/* About / Another Section */}
			<section className="bg-blue-100 p-8 rounded shadow text-center" id="about">
				<h2 className="text-2xl font-bold text-blue-900 mb-2">About Our Business</h2>
				<p className="text-blue-700">
					We have years of experience delivering quality solutions to our customers. Learn more about our story and values.
				</p>
			</section>

			{/* Email Signup Section */}
			<section className="bg-white p-8 rounded shadow flex flex-col items-center" id="signup">
				<h2 className="text-xl font-semibold text-blue-800 mb-2">Stay Updated</h2>
				<p className="text-blue-600 mb-4">Sign up for our newsletter to get the latest news and offers.</p>
				<form className="flex flex-col sm:flex-row gap-2 w-full max-w-md">
					<input
						type="email"
						placeholder="Your email address"
						className="flex-1 px-4 py-2 border border-blue-300 rounded"
					/>
					<button
						type="submit"
						className="px-6 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 transition"
					>
						Subscribe
					</button>
				</form>
			</section>
		</main>
					{/* Basic Footer */}
			<footer className="w-full bg-white border-t mt-12 py-6 flex flex-col md:flex-row items-center justify-between px-8 text-blue-700 text-sm">
				<span>&copy; {new Date().getFullYear()} Bakedown. All rights reserved.</span>
				<div className="flex gap-4 mt-2 md:mt-0">
					<Link href="#privacy" className="hover:underline">Privacy Policy</Link>
					<Link href="#terms" className="hover:underline">Terms of Service</Link>
					<Link href="#contact" className="hover:underline">Contact</Link>
				</div>
			</footer>
		</div>
	)
}
