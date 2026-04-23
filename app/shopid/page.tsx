import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma";


export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")
	const categories = await prisma.category.findMany();
  return (
    <div>
      <main className="flex flex-col items-center m-32">
        <div className="text-4xl">Business Specific Landing Page</div>
        <div>This will become the dashboard page for everything at a glance</div>
        <div className="mt-6 text-sm text-muted-foreground">
          Signed in as <span className="font-medium">{session.user.name}</span> &middot; role: <span className="font-medium">{session.user.role}</span>
        </div>
				<div>
					<p>Categories</p>
					<ul>
						{categories.map((cat) => (
							<li key={cat.name}>{cat.name}</li>
						))}
					</ul>
				</div>
      </main>
    </div>
  )
}
