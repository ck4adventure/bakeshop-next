import { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: { id: string; role: string; bakeryId: string | null; bakeryName: string | null } & DefaultSession["user"]
  }
  interface User {
    role: string
    bakery?: { id: string; slug: string; name: string } | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    bakeryId: string | null
    bakeryName: string | null
  }
}
