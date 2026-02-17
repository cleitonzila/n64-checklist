import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from './lib/prisma';
import { verifyPassword } from './lib/auth-utils';
import { z } from 'zod';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      authorize: async (credentials) => {
        // 1. Validação de entrada
        const parsedCredentials = z
          .object({ username: z.string(), password: z.string().min(6) })
          .safeParse(credentials);

        if (!parsedCredentials.success) return null;

        const { username, password } = parsedCredentials.data;

        // 2. Buscar usuário no banco
        const user = await prisma.user.findUnique({
          where: { username },
        });

        if (!user) return null;

        // 3. Verificar se o hash bate
        const passwordsMatch = await verifyPassword(password, user.passwordHash);

        if (passwordsMatch) {
          // Retorna o objeto do usuário para a sessão
          return { id: user.id, name: user.username };
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
});