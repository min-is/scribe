// Stub module for storage platform
// TODO: Remove when admin actions are cleaned up

export type StorageType = 'vercel-blob' | 'cloudflare-r2' | 'aws-s3' | 'local';

export function labelForStorage(storage?: StorageType): string {
  switch (storage) {
  case 'vercel-blob':
    return 'Vercel Blob';
  case 'cloudflare-r2':
    return 'Cloudflare R2';
  case 'aws-s3':
    return 'AWS S3';
  case 'local':
    return 'Local Storage';
  default:
    return 'Unknown Storage';
  }
}

export async function testStorageConnection(): Promise<{ success: boolean, error?: string }> {
  return { success: true };
}
