export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    '/sistema/:path*',
    '/portal/:path*',
  ],
};
