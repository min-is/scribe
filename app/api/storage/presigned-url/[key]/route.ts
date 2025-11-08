import { auth } from '@/auth/server';
// import {
//   awsS3Client,
//   awsS3PutObjectCommandForKey,
// } from '@/platforms/storage/aws-s3';
// import {
//   cloudflareR2Client,
//   cloudflareR2PutObjectCommandForKey,
// } from '@/platforms/storage/cloudflare-r2';
// import { CURRENT_STORAGE } from '@/app/config';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;

  const session = await auth();
  if (session?.user && key) {
    // TODO: Implement AWS S3 / Cloudflare R2 presigned URL generation
    // Requires @aws-sdk/s3-request-presigner package
    return new Response(
      'Presigned URL generation not implemented',
      { status: 501 },
    );
  } else {
    return new Response('Unauthorized request', { status: 401 });
  }
}
