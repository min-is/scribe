import { clsx } from 'clsx/lite';

export default function PhotoCamera({
  camera,
  contrast,
}: {
  camera: {
    make: string
    model: string
  }
  contrast?: 'low' | 'medium' | 'high'
}) {
  return (
    <div className={clsx(
      'text-xs',
      contrast === 'high' && 'font-bold',
      contrast === 'medium' && 'font-medium',
    )}>
      {camera.make} {camera.model}
    </div>
  );
}
