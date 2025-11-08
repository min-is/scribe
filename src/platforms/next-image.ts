// Stub module for next/image utilities
// TODO: Implement full next-image utilities

export const getImageProps = (_src: string, _options?: unknown) => {
  return {
    props: {
      src: _src,
    },
  };
};

export const generateImageUrl = (src: string): string => {
  return src;
};

export const getNextImageUrlForRequest = (
  _url: string,
  _width?: number,
  _quality?: number,
): string => {
  // Stub implementation
  return _url;
};
