// Stub module for recipe (film simulation) functionality
// TODO: Implement full recipe module

export interface Recipe {
  recipe: string
  recipeKey?: string
}

export const formatRecipe = (recipe?: string): string => {
  return recipe || '';
};

export const getRecipeFromPhoto = (photo: { filmSimulation?: string }): Recipe | undefined => {
  if (!photo.filmSimulation) return undefined;
  return {
    recipe: photo.filmSimulation,
  };
};
