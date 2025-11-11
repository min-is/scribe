export { auth as middleware } from './src/auth/server';

export const config = {
  // Excludes:
  // - /api + /api/auth*
  // - /_next/static*
  // - /_next/image*
  // - /favicon.ico + /favicons/*
  // - / (root)
  matcher: ['/((?!api$|api/auth|_next/static|_next/image|favicon.ico$|favicons/|$).*)'],
};
