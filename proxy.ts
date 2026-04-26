import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const protectedRoutes = ["/today", "/schedule", "/inventory", "/history", "/manage-items", "/settings", "/operating-days"]
const authRoutes = ["/login"]

export default async function proxy(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  const isProtected = protectedRoutes.some(r => pathname.startsWith(r))
  const isAuthRoute = authRoutes.includes(pathname)

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/today", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
}
