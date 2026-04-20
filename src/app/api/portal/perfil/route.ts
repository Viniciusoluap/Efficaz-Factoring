import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const userId = (session.user as any).id as string;
  const usuario = await prisma.usuario.findUnique({
    where: { id: userId },
    select: { id: true, nome: true, email: true, fotoUrl: true, perfil: true },
  });

  return NextResponse.json(usuario);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const userId = (session.user as any).id as string;
  const body = await req.json();
  const { nome, email, fotoUrl, senhaAtual, novaSenha } = body;

  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const data: any = {};
  if (nome) data.nome = nome;
  if (email) data.email = email;
  if (fotoUrl !== undefined) data.fotoUrl = fotoUrl || null;

  if (novaSenha) {
    if (!senhaAtual) return NextResponse.json({ error: 'Informe a senha atual.' }, { status: 400 });
    const ok = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!ok) return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 });
    data.senha = await bcrypt.hash(novaSenha, 10);
  }

  const updated = await prisma.usuario.update({
    where: { id: userId },
    data,
    select: { id: true, nome: true, email: true, fotoUrl: true },
  });

  return NextResponse.json(updated);
}
