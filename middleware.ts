import { auth } from './src/auth/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Add security headers
  const response = await auth(request as any) as NextResponse | Response | null;

  const nextResponse = response instanceof NextResponse
    ? response
    : response
      ? NextResponse.next()
      : NextResponse.next();

  // Security headers
  nextResponse.headers.set('X-Frame-Options', 'DENY');
  nextResponse.headers.set('X-Content-Type-Options', 'nosniff');
  nextResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  nextResponse.headers.set('X-XSS-Protection', '1; mode=block');
  nextResponse.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // Content Security Policy
  const cspHeader = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' vercel.live va.vercel-scripts.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "media-src 'self' https:",
    "frame-src 'self' https://www.youtube.com https://youtube.com",
  ].join('; ');

  nextResponse.headers.set('Content-Security-Policy', cspHeader);

  return nextResponse;
}

export const config = {
  // Excludes:
  // - /api + /api/auth*
  // - /_next/static*
  // - /_next/image*
  // - /favicon.ico + /favicons/*
  // - / (root)
  matcher: ['/((?!api$|api/auth|_next/static|_next/image|favicon.ico$|favicons/|$).*)'],
};
