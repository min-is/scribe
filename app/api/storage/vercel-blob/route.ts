import { auth } from '@/auth/server';
// import { revalidateAdminPaths, revalidatePhotosKey } from '@/photo/cache';
// import {
//   ACCEPTED_PHOTO_FILE_TYPES,
//   MAX_PHOTO_UPLOAD_SIZE_IN_BYTES,
// } from '@/photo';
// import { isUploadPathnameValid } from '@/platforms/storage';
// import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthenticated upload' },
      { status: 401 },
    );
  }

  // TODO: Implement Vercel Blob upload
  // Requires @vercel/blob package
  return NextResponse.json(
    { error: 'Vercel Blob upload not implemented' },
    { status: 501 },
  );
}
