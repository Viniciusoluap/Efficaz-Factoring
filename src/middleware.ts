import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any;
    const perfil = token?.perfil;
    const { pathname } = req.nextUrl;

    if (perfil === 'CLIENTE') {
      const allowed =
        pathname.startsWith('/sistema/portal') ||
        pathname.startsWith('/api/portal');
      if (!allowed) {
        return NextResponse.redirect(new URL('/sistema/portal', req.url));
      }
    }

    if (perfil === 'FORNECEDOR') {
      const allowed =
        pathname.startsWith('/sistema/portal/fornecedor') ||
        pathname.startsWith('/sistema/portal/configuracoes') ||
        pathname.startsWith('/api/portal/fornecedor') ||
        pathname.startsWith('/api/portal/perfil');
      if (!allowed) {
        return NextResponse.redirect(new URL('/sistema/portal/fornecedor', req.url));
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
