import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) return null;

        const usuario = await prisma.usuario.findUnique({
          where: { email: credentials.email },
          include: {
            cliente: true,
            fornecedor: true,
          },
        });

        if (!usuario || !usuario.ativo) return null;

        const senhaCorreta = await bcrypt.compare(credentials.senha, usuario.senha);
        if (!senhaCorreta) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          perfil: usuario.perfil,
          clienteId: usuario.cliente?.id ?? null,
          fornecedorId: usuario.fornecedor?.id ?? null,
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.perfil = (user as any).perfil;
        token.clienteId = (user as any).clienteId;
        token.fornecedorId = (user as any).fornecedorId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub;
        (session.user as any).perfil = token.perfil;
        (session.user as any).clienteId = token.clienteId;
        (session.user as any).fornecedorId = token.fornecedorId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
