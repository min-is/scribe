// Stub icon component
import { IoImageOutline } from 'react-icons/io5';

export default function IconPhoto({
  size = 16,
  className,
}: {
  size?: number
  className?: string
}) {
  return <IoImageOutline size={size} className={className} />;
}
