'use server';

// Stub module for category server actions
// TODO: Implement full category actions

export async function getCategoriesAction(): Promise<string[]> {
  // Stub implementation
  return [];
}

export async function updateCategoryAction(_categoryId: string, _data: unknown): Promise<void> {
  // Stub implementation
  console.log('updateCategoryAction called (stub)');
}

export async function getCountsForCategoriesCachedAction(): Promise<Record<string, number>> {
  // Stub implementation
  return {};
}
