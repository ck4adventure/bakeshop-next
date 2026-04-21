import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Page() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <div>
      <main className="flex flex-col items-center m-32">
        <div className="text-4xl">Business Specific Landing Page</div>
        <div>This will become the dashboard page for everything at a glance</div>
        <div className="mt-6 text-sm text-gray-500">
          Signed in as <span className="font-medium">{session.user.name}</span> &middot; role: <span className="font-medium">{session.user.role}</span>
        </div>
      </main>
    </div>
  )
}
