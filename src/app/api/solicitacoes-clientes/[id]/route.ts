import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await req.json();
  const { status, observacaoAdmin } = body;

  const solicitacao = await prisma.solicitacaoCliente.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(observacaoAdmin !== undefined && { observacaoAdmin }),
    },
  });

  return NextResponse.json(solicitacao);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  await prisma.solicitacaoCliente.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
