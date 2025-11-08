// Stub module for category functionality
// TODO: Implement full category module

export const DEFAULT_CATEGORY_KEYS = [
  'cameras',
  'films',
  'lenses',
  'focal-lengths',
  'recipes',
  'tags',
] as const;

export type CategoryKey = typeof DEFAULT_CATEGORY_KEYS[number];

export const getOrderedCategoriesFromString = (
  categoriesString?: string,
): string[] => {
  if (!categoriesString) {
    return [...DEFAULT_CATEGORY_KEYS];
  }
  return categoriesString
    .split(',')
    .map(cat => cat.trim())
    .filter(Boolean);
};

export const getHiddenCategories = (
  visibleCategories: string[],
): string[] => {
  return DEFAULT_CATEGORY_KEYS.filter(
    cat => !visibleCategories.includes(cat),
  );
};

export const sortCategoryByCount = (
  a: { count: number },
  b: { count: number },
): number => {
  return b.count - a.count;
};
