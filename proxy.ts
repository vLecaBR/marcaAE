import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"

// Inicializa o auth APENAS com a config sem Prisma
const { auth } = NextAuth(authConfig)

const PUBLIC_ROUTES = ["/", "/login"]
const PUBLIC_PREFIXES = ["/book/", "/api/book/"]
const AUTH_API_PREFIX = "/api/auth"
const ONBOARDING_ROUTE = "/onboarding"
const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const pathname = nextUrl.pathname

  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next()
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isPublicPrefix = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))
  const isOnboarding = pathname === ONBOARDING_ROUTE
  const isAuthenticated = !!session?.user

  if (isPublicRoute && isAuthenticated) {
    if (!session.user.onboarded) {
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, nextUrl))
    }
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, nextUrl))
  }

  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next()
  }

  if (!isAuthenticated) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthenticated && !session?.user?.onboarded && !isOnboarding) {
    return NextResponse.redirect(new URL(ONBOARDING_ROUTE, nextUrl))
  }

  if (isAuthenticated && session?.user?.onboarded && isOnboarding) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}