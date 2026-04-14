import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token || (token as any).perfil !== 'CLIENTE') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const clienteId = (token as any).clienteId as string | null;
  if (!clienteId) return NextResponse.json({ error: 'Cliente não vinculado.' }, { status: 403 });

  const [operacoes, totais] = await Promise.all([
    prisma.operacao.findMany({
      where: { clienteId },
      orderBy: { criadoEm: 'desc' },
      include: {
        titulos: {
          select: {
            id: true, numero: true, tipo: true, valor: true,
            valorLiquidoCliente: true, encargo: true, taxaCliente: true,
            dataVencimento: true, status: true,
          },
        },
        _count: { select: { titulos: true } },
      },
    }),
    prisma.titulo.aggregate({
      _sum: { valor: true, valorLiquidoCliente: true, encargo: true },
      _count: { id: true },
      where: { clienteId },
    }),
  ]);

  return NextResponse.json({ operacoes, totais });
}
