import { Photo } from '@/photo';

// Stub module for photo database queries
// TODO: Implement full photo database queries

export async function getPhotos(): Promise<Photo[]> {
  // Stub implementation
  return [];
}

export async function getPhoto(_photoId: string): Promise<Photo | undefined> {
  // Stub implementation
  return undefined;
}

export async function getPhotosByTag(_tag: string): Promise<Photo[]> {
  // Stub implementation
  return [];
}

export async function getPhotosCount(): Promise<number> {
  // Stub implementation
  return 0;
}

export async function getUniqueTags(): Promise<{ tag: string, count: number }[]> {
  // Stub implementation
  return [];
}
