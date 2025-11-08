// Stub module for category types
// TODO: Remove when admin configuration is cleaned up

export type Category = {
  name: string;
  count: number;
};

export const DEFAULT_CATEGORY_KEYS = ['cameras', 'films', 'lenses', 'focalLengths', 'recipes', 'tags'] as const;

export function getHiddenCategories(visibleCategories: string[]): string[] {
  return DEFAULT_CATEGORY_KEYS.filter(key => !visibleCategories.includes(key));
}
