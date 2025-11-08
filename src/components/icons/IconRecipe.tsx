// Stub icon component
import { IoDocumentTextOutline } from 'react-icons/io5';

export default function IconRecipe({
  size = 16,
  className,
}: {
  size?: number
  className?: string
}) {
  return <IoDocumentTextOutline size={size} className={className} />;
}
