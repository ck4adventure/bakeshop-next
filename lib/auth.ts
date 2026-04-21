import type { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

type HardcodedUser = {
  id: string
  name: string
  username: string
  password: string
  role: string
}

const USERS: HardcodedUser[] = [
  { id: "1", name: "Admin",   username: "admin",   password: "admin123",   role: "admin" },
  { id: "2", name: "Manager", username: "manager", password: "manager123", role: "manager" },
  { id: "3", name: "Baker",   username: "baker",   password: "baker123",   role: "baker" },
]

async function validateUser(username: string, password: string) {
  return USERS.find(u => u.username === username && u.password === password) ?? null
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = await validateUser(credentials.username, credentials.password)
        return user ?? null
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as HardcodedUser).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    },
  },
}
