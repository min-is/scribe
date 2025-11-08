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

export async function getPhotosMeta(): Promise<{ count: number, dateRange?: { start: Date, end: Date } }> {
  // Stub implementation
  return { count: 0 };
}

export async function getPhotosInNeedOfSyncCount(): Promise<number> {
  // Stub implementation
  return 0;
}

export async function getUniqueRecipes(): Promise<{ recipe: string, count: number }[]> {
  // Stub implementation
  return [];
}

export async function getUniqueCameras(): Promise<{ make: string, model: string, count: number }[]> {
  // Stub implementation
  return [];
}

export async function getUniqueLenses(): Promise<{ lens: string, count: number }[]> {
  // Stub implementation
  return [];
}

export async function getUniqueFilms(): Promise<{ film: string, count: number }[]> {
  // Stub implementation
  return [];
}

export async function getUniqueFocalLengths(): Promise<{ focal: number, count: number }[]> {
  // Stub implementation
  return [];
}
