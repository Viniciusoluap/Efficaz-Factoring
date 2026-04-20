import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.perfil !== 'CLIENTE') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const clienteId = user?.clienteId as string | null;
  if (!clienteId) return NextResponse.json({ error: 'Cliente não vinculado.' }, { status: 403 });

  const solicitacoes = await prisma.solicitacaoCliente.findMany({
    where: { clienteId },
    orderBy: { criadoEm: 'desc' },
  });

  return NextResponse.json(solicitacoes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.perfil !== 'CLIENTE') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const clienteId = user?.clienteId as string | null;
  if (!clienteId) return NextResponse.json({ error: 'Cliente não vinculado.' }, { status: 403 });

  const body = await req.json();
  const { tipo, descricao, valorEstimado, anexos } = body;

  if (!tipo || !descricao) {
    return NextResponse.json({ error: 'Tipo e descrição são obrigatórios.' }, { status: 400 });
  }

  const solicitacao = await prisma.solicitacaoCliente.create({
    data: {
      clienteId,
      tipo,
      descricao,
      valorEstimado: valorEstimado ? parseFloat(valorEstimado) : null,
      anexos: Array.isArray(anexos) ? anexos : [],
    },
  });

  return NextResponse.json(solicitacao, { status: 201 });
}
