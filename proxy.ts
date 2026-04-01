import NextAuth from "next-auth"
import authConfig from "./auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

const PUBLIC_ROUTES = ["/", "/login"]
const PUBLIC_PREFIXES = ["/book/", "/api/book/", "/api/webhooks/"]
const AUTH_API_PREFIX = "/api/auth"
const ONBOARDING_ROUTE = "/onboarding"
const DEFAULT_AUTHENTICATED_ROUTE = "/dashboard"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const pathname = nextUrl.pathname

  // Ignora rotas do auth para evitar conflitos
  if (pathname.startsWith(AUTH_API_PREFIX)) {
    return NextResponse.next()
  }

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)
  const isPublicPrefix = PUBLIC_PREFIXES.some((p) =>
    pathname.startsWith(p)
  )
  const isOnboarding = pathname === ONBOARDING_ROUTE
  const isAuthenticated = !!session?.user

  // Usuário logado tentando acessar rota pública root ou login
  if (isPublicRoute && isAuthenticated) {
    if (!session?.user?.onboarded) {
      if (!isOnboarding) {
         return NextResponse.redirect(new URL(ONBOARDING_ROUTE, nextUrl))
      }
      return NextResponse.next()
    }
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, nextUrl))
  }

  // Rotas públicas explícitas ou prefixos liberados (como API de pagamentos e booking page)
  if (isPublicRoute || isPublicPrefix) {
    return NextResponse.next()
  }

  // Identificação de rotas restritas
  const isDashboardRoute = pathname.startsWith("/dashboard")
  const isSettingsRoute = pathname.startsWith("/settings")
  const isRestrictedRoute = isDashboardRoute || isSettingsRoute

  // Se não estiver logado, proíbe rotas restritas ou onboarding imediatamente
  if (!isAuthenticated && (isRestrictedRoute || isOnboarding)) {
    const loginUrl = new URL("/login", nextUrl)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Se estiver logado E onboarded, NÃO PODE acessar onboarding (vai pro dashboard)
  if (isAuthenticated && session?.user?.onboarded && isOnboarding) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_ROUTE, nextUrl))
  }

  // Rotas restritas requerem login, se chegou aqui sem login é redirecionado
  // Já foi tratado acima: if (!isAuthenticated && (isRestrictedRoute || isOnboarding)) 

  // Se logado e não onboarded -> Só permite onboarding ou actions. 
  // O bug do chrome-error://chromewebdata acontece por loops em páginas publicas
  if (isAuthenticated && !session?.user?.onboarded) {
    if (isRestrictedRoute) {
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, nextUrl))
    }
    if (!isOnboarding && req.method === "GET") {
      return NextResponse.redirect(new URL(ONBOARDING_ROUTE, nextUrl))
    }
    return NextResponse.next()
  }

  // Permite todo o resto
  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}