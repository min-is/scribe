import { isPathProtected } from '@/app/paths';
import NextAuth, { User } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { checkRateLimit } from '@/lib/ratelimit';

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
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;

        // Check rate limit
        const rateLimitPassed = await checkRateLimit(email);
        if (!rateLimitPassed) {
          throw new Error('Too many login attempts. Please try again later.');
        }

        // Check admin credentials
        if (
          process.env.ADMIN_EMAIL &&
          process.env.ADMIN_EMAIL === email &&
          process.env.ADMIN_PASSWORD &&
          process.env.ADMIN_PASSWORD === password
        ) {
          const user: User = {
            email,
            name: 'Admin User',
            role: 'ADMIN',
          };
          return user;
        }

        // Check editor credentials
        const editorEmails = process.env.EDITOR_EMAILS?.split(',').map(e =>
          e.trim()
        ) || [];
        const editorPassphrase = process.env.EDITOR_PASSPHRASE;

        if (
          editorPassphrase &&
          editorEmails.includes(email) &&
          password === editorPassphrase
        ) {
          const user: User = {
            email,
            name: 'Editor User',
            role: 'EDITOR',
          };
          return user;
        }

        return null;
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      const isUrlProtected = isPathProtected(pathname);
      const isUserLoggedIn = !!auth?.user;
      const isRequestAuthorized = !isUrlProtected || isUserLoggedIn;

      return isRequestAuthorized;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string | null;
        session.user.role = token.role as 'ADMIN' | 'EDITOR';
      }
      return session;
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
