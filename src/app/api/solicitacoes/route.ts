import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const solicitacoes = await prisma.solicitacao.findMany({
    orderBy: { criadoEm: 'desc' },
  });

  return NextResponse.json(solicitacoes);
}
