import { Metadata } from 'next/types';
import DatabaseManagementClient from './DatabaseManagementClient';

export const metadata: Metadata = {
  title: 'Database Management - Admin',
  description: 'Manage database migrations and setup',
};

export default function DatabaseManagementPage() {
  return <DatabaseManagementClient />;
}
