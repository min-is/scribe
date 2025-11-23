import { redirect } from 'next/navigation';
import { PATH_ADMIN_SMARTPHRASES } from '@/app/paths';

export default function EditorSmartPhrasesPage() {
  // For now, redirect editors to the admin page
  // In the future, you can create a dedicated editor view with limited permissions
  redirect(PATH_ADMIN_SMARTPHRASES);
}
