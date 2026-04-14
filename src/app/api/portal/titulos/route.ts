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

  const { searchParams } = req.nextUrl;
  const statusParam = searchParams.get('status') || undefined;

  const titulos = await prisma.titulo.findMany({
    where: {
      clienteId,
      ...(statusParam ? { status: statusParam as any } : {}),
    },
    orderBy: [{ dataVencimento: 'asc' }, { valor: 'desc' }],
    include: {
      operacao: { select: { numero: true, status: true } },
    },
  });

  return NextResponse.json(titulos);
}
