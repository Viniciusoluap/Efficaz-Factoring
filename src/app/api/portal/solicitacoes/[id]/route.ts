import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.perfil !== 'CLIENTE') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const clienteId = user?.clienteId as string | null;
  if (!clienteId) return NextResponse.json({ error: 'Cliente não vinculado.' }, { status: 403 });

  const sol = await prisma.solicitacaoCliente.findUnique({ where: { id: params.id } });
  if (!sol || sol.clienteId !== clienteId) {
    return NextResponse.json({ error: 'Não encontrada.' }, { status: 404 });
  }

  await prisma.solicitacaoCliente.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
