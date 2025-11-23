import { redirect } from 'next/navigation';
import { PATH_ADMIN_PROVIDERS } from '@/app/paths';

export default function EditorProvidersPage() {
  // For now, redirect to admin providers page
  // TODO: Create dedicated editor view with limited permissions
  redirect(PATH_ADMIN_PROVIDERS);
}
