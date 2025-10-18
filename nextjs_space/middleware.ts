
import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/auth',
    '/login',
    '/signup',
    '/pricing',
    '/contact',
    '/docs',
    '/faq',
    '/legal',
    '/api/auth',
  ]

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  )

  // Allow public routes
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Require authentication for protected routes
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // SuperAdmin route protection
  if (pathname.startsWith('/superadmin')) {
    if (token.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Dashboard route protection - require authentication
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding')) {
    // Already authenticated, allow access
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth).*)',
  ],
}
