import { redirect } from 'next/navigation';
import { PATH_ADMIN_PROCEDURES } from '@/app/paths';

export default function EditorProceduresPage() {
  // For now, redirect editors to the admin page
  // In the future, you can create a dedicated editor view with limited permissions
  redirect(PATH_ADMIN_PROCEDURES);
}
