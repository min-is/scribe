import { auth } from '@/auth/server';
import { redirect } from 'next/navigation';
import { PATH_SIGN_IN } from '@/app/paths';

export default async function EditorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth();

  // Redirect to sign-in if not authenticated
  if (!session?.user) {
    redirect(PATH_SIGN_IN);
  }

  // Optionally, you can restrict to only EDITOR role here
  // if (session.user.role !== 'EDITOR') {
  //   redirect(PATH_ADMIN);
  // }

  return (
    <div className="mt-4 space-y-4">
      <div className="px-8">
        <nav className="flex items-center gap-4 border-b border-zinc-800 pb-4">
          <a
            href="/editor"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Dashboard
          </a>
          <a
            href="/editor/providers"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Providers
          </a>
          <a
            href="/editor/smartphrases"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            SmartPhrases
          </a>
          <a
            href="/editor/scenarios"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Scenarios
          </a>
          <a
            href="/editor/procedures"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Procedures
          </a>
          <div className="ml-auto">
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </form>
          </div>
        </nav>
      </div>
      {children}
    </div>
  );
}
