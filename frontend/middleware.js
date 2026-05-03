import { NextResponse } from 'next/server'

export function middleware(request) {
  const token = request.cookies.get('focusaint_token')?.value
  const { pathname } = request.nextUrl

  // Define protected and auth-related routes
  const isProtectedRoute = pathname.startsWith('/dashboard') || 
                           pathname.startsWith('/goals') || 
                           pathname.startsWith('/deepmode')
  const isAuthRoute = pathname.startsWith('/auth')

  // 1. Redirect to login if accessing a protected route without a valid token
  const isValidToken = token && token !== 'undefined' && token !== 'null'
  
  if (isProtectedRoute && !isValidToken) {
    console.log(`[Middleware] Unauthorized access to ${pathname}, redirecting to login`)
    const url = new URL('/auth/login', request.url)
    url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  // 2. Redirect to dashboard if accessing auth routes with a valid token
  if (isAuthRoute && isValidToken) {
    console.log(`[Middleware] Authenticated user on auth route, redirecting to dashboard`)
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Ensure all protected routes are covered
export const config = {
  matcher: [
    '/dashboard',
    '/dashboard/:path*',
    '/goals',
    '/goals/:path*',
    '/deepmode',
    '/deepmode/:path*',
    '/auth',
    '/auth/:path*',
  ],
}
