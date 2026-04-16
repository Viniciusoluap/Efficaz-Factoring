import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const [emitentesRaw, sacadosRaw] = await Promise.all([
    prisma.titulo.findMany({
      distinct: ['emitenteCpfCnpj'],
      select: { emitenteCpfCnpj: true, emitenteNome: true },
      where: { emitenteCpfCnpj: { not: '' } },
      orderBy: { emitenteNome: 'asc' },
    }),
    prisma.titulo.findMany({
      distinct: ['sacadoCpfCnpj'],
      select: { sacadoCpfCnpj: true, sacadoNome: true },
      where: { sacadoCpfCnpj: { not: '' } },
      orderBy: { sacadoNome: 'asc' },
    }),
  ]);

  return NextResponse.json({
    emitentes: emitentesRaw.map(e => ({ cpfCnpj: e.emitenteCpfCnpj, nome: e.emitenteNome })),
    sacados: sacadosRaw.map(s => ({ cpfCnpj: s.sacadoCpfCnpj, nome: s.sacadoNome })),
  });
}
