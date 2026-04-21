import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)
  if (session) redirect("/shopid")

  return (
    <div>
      <main className="flex flex-col items-center m-32 text-4xl">
        Bakeshop App
      </main>
    </div>
  )
}
