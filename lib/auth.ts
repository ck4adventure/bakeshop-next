import type { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt"

const DUMMY_HASH = "$2b$10$dummyhashusedtopreventserioususerenumerationtiming0000000"

async function validateUser(username: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { username },
      include: { bakery: { select: { id: true, slug: true, name: true } } },
    });
    const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
    const valid = await bcrypt.compare(password, hashToCompare);
    if (!user || !valid) {
      throw new Error("unauthorized");
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
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
        token.role = (user as any).role
        token.bakeryId = (user as any).bakery?.id ?? null
        token.bakeryName = (user as any).bakery?.name ?? null
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id
        session.user.role = token.role
        session.user.bakeryId = token.bakeryId
        session.user.bakeryName = token.bakeryName
      }
      return session
    },
  },
}
