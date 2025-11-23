import { redirect } from 'next/navigation';
import { PATH_ADMIN_PROCEDURES } from '@/app/paths';

export default function EditorProceduresPage() {
  // For now, redirect to admin procedures page
  // TODO: Create dedicated editor view with limited permissions
  redirect(PATH_ADMIN_PROCEDURES);
}
