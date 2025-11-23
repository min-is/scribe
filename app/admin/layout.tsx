import AdminNav from '@/admin/AdminNav';
import { auth } from '@/auth/server';
import { redirect } from 'next/navigation';
import { PATH_SIGN_IN, PATH_EDITOR } from '@/app/paths';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  // Require authentication
  if (!session?.user) {
    redirect(PATH_SIGN_IN);
  }

  // Block editors from accessing admin panel
  if (session.user.role === 'EDITOR') {
    redirect(PATH_EDITOR);
  }

  return (
    <div className="mt-4 space-y-4">
      <AdminNav />
      {children}
    </div>
  );
}
