import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const usuario = await prisma.usuario.findUnique({
    where: { id: token.sub },
    select: { id: true, nome: true, email: true, fotoUrl: true, perfil: true },
  });

  return NextResponse.json(usuario);
}

export async function PATCH(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await req.json();
  const { nome, email, fotoUrl, senhaAtual, novaSenha } = body;

  const usuario = await prisma.usuario.findUnique({ where: { id: token.sub } });
  if (!usuario) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const data: any = {};
  if (nome) data.nome = nome;
  if (email) data.email = email;
  if (fotoUrl !== undefined) data.fotoUrl = fotoUrl || null;

  if (novaSenha) {
    if (!senhaAtual) {
      return NextResponse.json({ error: 'Informe a senha atual.' }, { status: 400 });
    }
    const ok = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!ok) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 400 });
    }
    data.senha = await bcrypt.hash(novaSenha, 10);
  }

  const updated = await prisma.usuario.update({
    where: { id: token.sub },
    data,
    select: { id: true, nome: true, email: true, fotoUrl: true },
  });

  return NextResponse.json(updated);
}
