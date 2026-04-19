import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const hoje = new Date();

  const [solicitacoesNaoLidas, titulosVencendoHoje, titulosVencidos] = await Promise.all([
    prisma.solicitacao.count({ where: { lida: false } }),
    prisma.titulo.count({
      where: {
        dataVencimento: { gte: startOfDay(hoje), lte: endOfDay(hoje) },
        status: { notIn: ['LIQUIDADO', 'CANCELADO'] },
      },
    }),
    prisma.titulo.count({ where: { status: 'VENCIDO' } }),
  ]);

  return NextResponse.json({
    solicitacoesNaoLidas,
    titulosVencendoHoje,
    titulosVencidos,
    total: solicitacoesNaoLidas + titulosVencendoHoje + titulosVencidos,
  });
}
