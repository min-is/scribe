// Zoom controls stub - photography feature removed
import {
  ComponentProps,
  RefObject,
  useRef,
} from 'react';
import ZoomControls from './ZoomControls';

export default function useImageZoomControls({
  refImageContainer,
  selectImageElement,
  isEnabled,
} : {
  refImageContainer: RefObject<HTMLElement | null>
} & Omit<ComponentProps<typeof ZoomControls>, 'ref' | 'children'>) {
  const refViewerContainer = useRef<HTMLDivElement>(null);

  return {
    open: () => {},
    close: () => {},
    reset: () => {},
    zoomTo: (_zoomLevel?: number) => {},
    zoomLevel: 1,
    refViewerContainer,
  };
}
