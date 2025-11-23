import { isPathProtected } from '@/app/paths';
import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

// Parse editor emails from environment variable
const getEditorEmails = (): string[] => {
  const editorEmailsEnv = process.env.EDITOR_EMAILS || '';
  return editorEmailsEnv
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
};

export const {
  handlers: { GET, POST },
  signIn,
  signOut,
  auth,
} = NextAuth({
  trustHost: true,
  session: {
    strategy: 'jwt',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize({ email, password }) {
        // Check if admin credentials
        if (
          process.env.ADMIN_EMAIL && process.env.ADMIN_EMAIL === email &&
          process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD === password
        ) {
          const user: User = {
            email,
            name: 'Admin User',
            role: 'ADMIN'
          };
          return user;
        }

        // Check if editor credentials
        const editorEmails = getEditorEmails();
        const editorPassphrase = process.env.EDITOR_PASSPHRASE;

        if (
          editorPassphrase &&
          editorEmails.includes(email as string) &&
          password === editorPassphrase
        ) {
          const user: User = {
            email,
            name: 'Editor User',
            role: 'EDITOR'
          };
          return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Add role to token on sign in
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add role to session
      if (session.user) {
        session.user.role = token.role as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      const isUrlProtected = isPathProtected(pathname);
      const isUserLoggedIn = !!auth?.user;
      const isRequestAuthorized = !isUrlProtected || isUserLoggedIn;

      return isRequestAuthorized;
    },
  },
  pages: {
    signIn: '/sign-in',
  },
});

export const runAuthenticatedAdminServerAction = async <T>(
  callback: () => T,
): Promise<T> => {
  const session = await auth();
  if (session?.user) {
    return callback();
  } else {
    throw new Error('Unauthorized server action request');
  }
};
