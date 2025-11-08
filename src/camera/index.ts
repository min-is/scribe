// Stub module for camera functionality
// TODO: Implement full camera module

export interface Camera {
  make: string
  model: string
  cameraKey?: string
}

export const formatCameraModelShort = (model?: string): string => {
  return model || '';
};

export const formatCameraModel = (make?: string, model?: string): string => {
  if (!make && !model) return '';
  if (!make) return model || '';
  if (!model) return make;
  return `${make} ${model}`;
};

export const getCameraFromPhoto = (photo: { make?: string, model?: string }): Camera | undefined => {
  if (!photo.make && !photo.model) return undefined;
  return {
    make: photo.make || '',
    model: photo.model || '',
  };
};
