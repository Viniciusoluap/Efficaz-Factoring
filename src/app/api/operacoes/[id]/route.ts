import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const operacao = await prisma.operacao.findUnique({
    where: { id: params.id },
    include: {
      cliente: true,
      fornecedor: true,
      titulos: { orderBy: { criadoEm: 'asc' } },
    },
  });
  if (!operacao) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  return NextResponse.json(operacao);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const body = await req.json();
  try {
    const operacao = await prisma.operacao.update({
      where: { id: params.id },
      data: { status: body.status },
    });
    return NextResponse.json(operacao);
  } catch {
    return NextResponse.json({ error: 'Erro ao atualizar operação.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    await prisma.$transaction([
      prisma.titulo.deleteMany({ where: { operacaoId: params.id } }),
      prisma.operacao.delete({ where: { id: params.id } }),
    ]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir operação.' }, { status: 500 });
  }
}
