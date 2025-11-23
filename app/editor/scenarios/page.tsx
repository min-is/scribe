import { redirect } from 'next/navigation';
import { PATH_ADMIN_SCENARIOS } from '@/app/paths';

export default function EditorScenariosPage() {
  // For now, redirect to admin scenarios page
  // TODO: Create dedicated editor view with limited permissions
  redirect(PATH_ADMIN_SCENARIOS);
}
