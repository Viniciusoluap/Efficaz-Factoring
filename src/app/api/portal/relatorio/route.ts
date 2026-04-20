import { NextResponse } from 'next/server';
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
