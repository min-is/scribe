// Stub module for photo cache functionality
// TODO: Implement full photo cache

import { Photo } from '@/photo';

export const revalidatePhotosKey = () => {
  console.log('revalidatePhotosKey called (stub)');
};

export const revalidatePhotoKey = (_photoId: string) => {
  console.log('revalidatePhotoKey called (stub)');
};

export const revalidateAllKeys = () => {
  console.log('revalidateAllKeys called (stub)');
};

export const revalidateAdminPaths = () => {
  console.log('revalidateAdminPaths called (stub)');
};

export async function getPhotosCached(options?: { tag?: string, limit?: number }): Promise<Photo[]> {
  // Stub implementation
  return [];
}

export async function getPhotosMetaCached(options?: { tag?: string } | string): Promise<{ count: number }> {
  // Stub implementation
  return { count: 0 };
}
