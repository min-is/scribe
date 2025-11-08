// Stub module for category cache functionality
// TODO: Implement full category cache

export const revalidateCategoriesKey = () => {
  console.log('revalidateCategoriesKey called (stub)');
};

export const revalidateCategoryKey = (_category: string) => {
  console.log('revalidateCategoryKey called (stub)');
};

export async function getDataForCategoriesCached(): Promise<{
  cameras: { make: string, model: string, count: number }[]
  films: { film: string, count: number }[]
  lenses: { lens: string, count: number }[]
  focalLengths: { focal: number, count: number }[]
  recipes: { recipe: string, count: number }[]
  tags: { tag: string, count: number }[]
}> {
  // Stub implementation
  return {
    cameras: [],
    films: [],
    lenses: [],
    focalLengths: [],
    recipes: [],
    tags: [],
  };
};
