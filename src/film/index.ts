// Stub module for film functionality
// TODO: Implement full film module

export interface Film {
  film: string
  filmKey?: string
}

export const formatFilm = (film?: string): string => {
  return film || '';
};

export const getFilmFromPhoto = (photo: { filmSimulation?: string }): Film | undefined => {
  if (!photo.filmSimulation) return undefined;
  return {
    film: photo.filmSimulation,
  };
};

export const labelForFilm = (film?: Film | string): string => {
  if (!film) return '';
  if (typeof film === 'string') return film;
  return film.film || '';
};
