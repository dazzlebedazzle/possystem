import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Get session from cookies (in production, use proper session management)
  const sessionCookie = request.cookies.get('session');
  let session = null;
  
  if (sessionCookie) {
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (e) {
      session = null;
    }
  }
  
  // Public routes - allow access without authentication
  const publicRoutes = ['/login', '/register'];
  if (publicRoutes.includes(pathname) || pathname === '/') {
    // If already logged in, redirect to appropriate dashboard
    if (session) {
      if (session.role === 'superadmin') {
        return NextResponse.redirect(new URL('/superadmin/dashboard', request.url));
      } else if (session.role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      } else if (session.role === 'agent') {
        return NextResponse.redirect(new URL('/user/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }
  
  // Protected routes - require authentication
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Role-based route protection
  if (pathname.startsWith('/superadmin')) {
    if (session.role !== 'superadmin') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  if (pathname.startsWith('/admin')) {
    if (!['superadmin', 'admin'].includes(session.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  if (pathname.startsWith('/user')) {
    if (!['superadmin', 'admin', 'agent'].includes(session.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};

