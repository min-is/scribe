import { PATH_ADMIN } from '@/app/paths';
import AdminNavClient from './AdminNavClient';

export default async function AdminNav() {
  // Minimal admin navigation - photography features removed
  const items = [{
    label: 'Admin',
    href: PATH_ADMIN,
    count: 0,
  }];

  return (
    <AdminNavClient {...{
      items,
      mostRecentPhotoUpdateTime: undefined,
      includeInsights: false,
    }} />
  );
}
