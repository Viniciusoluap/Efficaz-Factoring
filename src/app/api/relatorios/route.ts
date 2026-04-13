import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const mes = parseInt(searchParams.get('mes') ?? String(new Date().getMonth() + 1));
  const ano = parseInt(searchParams.get('ano') ?? String(new Date().getFullYear()));
  const clienteId = searchParams.get('clienteId') || undefined;
  const fornecedorId = searchParams.get('fornecedorId') || undefined;

  const refDate = new Date(ano, mes - 1, 1);
  const inicio = startOfMonth(refDate);
  const fim = endOfMonth(refDate);

  const where: any = {
    criadoEm: { gte: inicio, lte: fim },
  };
  if (clienteId) where.clienteId = clienteId;
  if (fornecedorId) where.fornecedorId = fornecedorId;

  const whereGeral: any = {};
  if (clienteId) whereGeral.clienteId = clienteId;
  if (fornecedorId) whereGeral.fornecedorId = fornecedorId;

  const [totaisGeral, totaisPeriodo, porTipo, titulos, clientes, fornecedores] = await Promise.all([
    prisma.titulo.aggregate({
      _sum: { valor: true, encargo: true, spreadBruto: true, impostoProvisao: true, spreadLiquido: true },
      _count: { id: true },
      where: whereGeral,
    }),
    prisma.titulo.aggregate({
      _sum: { valor: true, encargo: true, spreadBruto: true, impostoProvisao: true, spreadLiquido: true },
      _count: { id: true },
      where,
    }),
    prisma.titulo.groupBy({
      by: ['tipo'],
      _sum: { valor: true },
      _count: { id: true },
      where,
    }),
    prisma.titulo.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      include: { cliente: { select: { nome: true } }, fornecedor: { select: { nome: true } } },
    }),
    prisma.cliente.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true } }),
    prisma.fornecedor.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true } }),
  ]);

  return NextResponse.json({ totaisGeral, totaisPeriodo, porTipo, titulos, clientes, fornecedores, mes, ano });
}
