import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.perfil !== 'FORNECEDOR') {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const fornecedorId = user?.fornecedorId as string | null;
  if (!fornecedorId) return NextResponse.json({ error: 'Fornecedor não vinculado.' }, { status: 403 });

  const [fornecedor, titulos] = await Promise.all([
    prisma.fornecedor.findUnique({
      where: { id: fornecedorId },
      select: { id: true, nome: true, cpfCnpj: true, email: true, telefone: true, capitalTotal: true },
    }),
    prisma.titulo.findMany({
      where: { fornecedorId },
      orderBy: [{ dataVencimento: 'asc' }],
      select: {
        id: true, numero: true, tipo: true, status: true,
        valor: true, custoCedente: true, dataVencimento: true,
        prazo: true, emitenteNome: true, sacadoNome: true,
        cliente: { select: { nome: true } },
      },
    }),
  ]);

  return NextResponse.json({ fornecedor, titulos });
}
