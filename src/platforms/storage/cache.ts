// Stub module for storage cache functionality
// TODO: Implement full storage cache

export const revalidateStorageCache = () => {
  console.log('revalidateStorageCache called (stub)');
};

export const clearStorageCache = () => {
  console.log('clearStorageCache called (stub)');
};

export async function getStorageUploadUrlsNoStore(): Promise<{ url: string, uploadUrl: string }> {
  // Stub implementation
  return { url: '', uploadUrl: '' };
};
