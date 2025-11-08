import { auth } from './src/auth/server';
import { NextRequest, NextResponse } from 'next/server';
import type { NextApiRequest, NextApiResponse } from 'next';

export default function middleware(req: NextRequest, res:NextResponse) {
  return auth(
    req as unknown as NextApiRequest,
    res as unknown as NextApiResponse,
  );
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
