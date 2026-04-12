import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const titulo = await prisma.titulo.findUnique({
    where: { id: params.id },
    include: { cliente: true, fornecedor: true, contrato: true, comunicacoes: true },
  });
  if (!titulo) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  return NextResponse.json(titulo);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await req.json();
  const titulo = await prisma.titulo.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(titulo);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  await prisma.titulo.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
