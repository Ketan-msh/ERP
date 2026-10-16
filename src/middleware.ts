export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth authentication routes)
     * - login (the login screen)
     * - _next/static & _next/image (Next.js assets)
     * - favicon.ico and static public files
     */
    '/((?!api/auth|login|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
