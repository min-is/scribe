// Stub module for photo cache functions
// TODO: Remove when admin navigation is cleaned up

export async function getPhotosCached(): Promise<any[]> {
  return [];
}

export async function getPhotosMetaCached(options?: { hidden?: 'include' | 'only' | 'exclude' }): Promise<{ count: number, dateRange?: { start: Date, end: Date } }> {
  return { count: 0 };
}

export async function getUniqueTagsCached(): Promise<{ tag: string, count: number }[]> {
  return [];
}

export async function getUniqueRecipesCached(): Promise<{ recipe: string, count: number }[]> {
  return [];
}

export async function getPhotosMostRecentUpdateCached(): Promise<Date | undefined> {
  return undefined;
}
