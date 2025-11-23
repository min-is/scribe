import { auth } from '@/auth/server';
import { redirect } from 'next/navigation';
import { PATH_SIGN_IN } from '@/app/paths';
import EditorNav from './EditorNav';

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user || session.user.role !== 'EDITOR') {
    redirect(PATH_SIGN_IN);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <EditorNav />
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
