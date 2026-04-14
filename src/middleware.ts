import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const perfil = token?.perfil;
    const { pathname } = req.nextUrl;

    if (perfil === 'CLIENTE') {
      // Clients may only access portal pages and portal API routes
      const allowed =
        pathname.startsWith('/sistema/portal') ||
        pathname.startsWith('/api/portal');
      if (!allowed) {
        return NextResponse.redirect(new URL('/sistema/portal', req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ['/sistema/:path*', '/api/portal/:path*'],
};
