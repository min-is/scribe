// Stub module for focal length functionality
// TODO: Implement full focal module

export interface FocalLength {
  focal: number
  focalKey?: string
}

export const formatFocalLength = (focal?: number): string => {
  if (!focal) return '';
  return `${focal}mm`;
};

export const getFocalLengthFromPhoto = (photo: { focalLength?: number }): FocalLength | undefined => {
  if (!photo.focalLength) return undefined;
  return {
    focal: photo.focalLength,
  };
};
