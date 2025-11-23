import { redirect } from 'next/navigation';
import { PATH_ADMIN_SMARTPHRASES } from '@/app/paths';

export default function EditorSmartPhrasesPage() {
  // For now, redirect to admin smartphrases page
  // TODO: Create dedicated editor view with limited permissions
  redirect(PATH_ADMIN_SMARTPHRASES);
}
