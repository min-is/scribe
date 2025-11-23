import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface User {
    email: string;
    name?: string | null;
    role?: 'ADMIN' | 'EDITOR';
  }

  interface Session {
    user: {
      email: string;
      name?: string | null;
      role?: 'ADMIN' | 'EDITOR';
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    email?: string;
    name?: string | null;
    role?: 'ADMIN' | 'EDITOR';
  }
}
