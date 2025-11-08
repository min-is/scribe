// Stub module for lens functionality
// TODO: Implement full lens module

export interface Lens {
  lens: string
  lensKey?: string
}

export const formatLens = (lens?: string): string => {
  return lens || '';
};

export const getLensFromPhoto = (photo: { lensModel?: string }): Lens | undefined => {
  if (!photo.lensModel) return undefined;
  return {
    lens: photo.lensModel,
  };
};

export const formatLensText = (lens?: Lens | string): string => {
  if (!lens) return '';
  if (typeof lens === 'string') return lens;
  return lens.lens || '';
};
