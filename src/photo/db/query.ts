// Stub module for photo database queries
// TODO: Remove when admin actions are cleaned up

export async function getPhotosMeta(options?: { hidden?: 'only' }): Promise<{ count: number }> {
  return { count: 0 };
}

export async function getPhotosInNeedOfSyncCount(): Promise<number> {
  return 0;
}

export async function getUniqueTags(): Promise<{ tag: string, count: number }[]> {
  return [];
}

export async function getUniqueRecipes(): Promise<{ recipe: string, count: number }[]> {
  return [];
}
