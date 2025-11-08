'use server';

// Stub module for photo server actions
// TODO: Implement full photo actions

import { Photo } from '@/photo';

export async function tagMultiplePhotosAction(
  _tags: string,
  _photoIds: string[],
): Promise<void> {
  // Stub implementation
  console.log('tagMultiplePhotosAction called (stub)');
  return Promise.resolve();
}

export async function deletePhotosAction(
  _photoIds: string[],
): Promise<void> {
  // Stub implementation
  console.log('deletePhotosAction called (stub)');
  return Promise.resolve();
}

export async function renamePhotoTagGloballyAction(
  _oldTag: string,
  _newTag: string,
): Promise<void> {
  // Stub implementation
  console.log('renamePhotoTagGloballyAction called (stub)');
  return Promise.resolve();
}

export async function clearCacheAction(): Promise<void> {
  // Stub implementation
  console.log('clearCacheAction called (stub)');
  return Promise.resolve();
}

export async function searchPhotosAction(_query: string): Promise<Photo[]> {
  // Stub implementation
  console.log('searchPhotosAction called (stub)');
  return [];
}

export async function deletePhotoTagGloballyAction(_tag: string): Promise<void> {
  // Stub implementation
  console.log('deletePhotoTagGloballyAction called (stub)');
  return Promise.resolve();
}
