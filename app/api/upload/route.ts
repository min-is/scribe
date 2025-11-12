import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export const runtime = 'edge';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for images
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for videos

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];

export async function POST(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('filename');

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 },
      );
    }

    // Get file from request
    const blob = await request.blob();
    const fileType = blob.type;
    const fileSize = blob.size;

    // Validate file type
    const allAllowedTypes = [
      ...ALLOWED_IMAGE_TYPES,
      ...ALLOWED_VIDEO_TYPES,
      ...ALLOWED_DOCUMENT_TYPES,
    ];

    if (!allAllowedTypes.includes(fileType)) {
      return NextResponse.json(
        { error: `File type ${fileType} not allowed. Allowed types: ${allAllowedTypes.join(', ')}` },
        { status: 400 },
      );
    }

    // Validate file size
    const isVideo = ALLOWED_VIDEO_TYPES.includes(fileType);
    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_FILE_SIZE;

    if (fileSize > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size: ${maxSize / (1024 * 1024)}MB` },
        { status: 400 },
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = filename.split('.').pop();
    const uniqueFilename = `provider-media/${timestamp}-${randomString}.${extension}`;

    // Upload to Vercel Blob
    const blobResult = await put(uniqueFilename, blob, {
      access: 'public',
      addRandomSuffix: false,
    });

    return NextResponse.json({
      url: blobResult.url,
      filename: uniqueFilename,
      size: fileSize,
      mimeType: fileType,
      uploadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed. Please try again.' },
      { status: 500 },
    );
  }
}
