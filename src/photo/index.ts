// Stub module for photo functionality
// TODO: Implement full photo module

export interface Photo {
  id: string
  tags: string[]
  takenAt?: Date
  make?: string
  model?: string
  [key: string]: unknown
}

export interface PhotoDateRange {
  start: Date
  end: Date
}

export const ACCEPTED_PHOTO_FILE_TYPES = [
  'image/jpg',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const MAX_PHOTO_UPLOAD_SIZE_IN_BYTES = 50 * 1024 * 1024; // 50MB

export const photoQuantityText = (
  count: number,
  appText?: { photo?: { photos?: string }},
  _includeParentheses = true,
  _capitalize = true,
): string => {
  return `${count} ${count === 1 ? 'photo' : 'photos'}`;
};

export const descriptionForPhotoSet = (
  _photos: Photo[],
  _appText: unknown,
  _prefix?: string,
  _dateBased?: boolean,
  _explicitCount?: number,
  _explicitDateRange?: PhotoDateRange,
): string => {
  return '';
};

export const titleForPhoto = (photo: Photo): string => {
  return photo.id || 'Untitled';
};

export const getKeywordsForPhoto = (_photo: Photo): string[] => {
  // Stub implementation
  return [];
};

export const dateRangeForPhotos = (_photos: Photo[]): PhotoDateRange | undefined => {
  // Stub implementation
  return undefined;
};
