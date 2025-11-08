// Stub module for upload functionality
// TODO: Implement full upload module

export interface UploadState {
  files: File[]
  progress: number
}

export const INITIAL_UPLOAD_STATE: UploadState = {
  files: [],
  progress: 0,
};

export const defaultUploadState: UploadState = INITIAL_UPLOAD_STATE;

export const clearUploadState = (setState: (state: UploadState) => void) => {
  setState(defaultUploadState);
};
