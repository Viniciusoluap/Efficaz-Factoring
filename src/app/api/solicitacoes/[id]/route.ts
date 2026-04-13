import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { lida } = await req.json();
  const solicitacao = await prisma.solicitacao.update({
    where: { id: params.id },
    data: { lida },
  });
  return NextResponse.json(solicitacao);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  await prisma.solicitacao.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
