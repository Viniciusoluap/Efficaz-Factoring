import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { startOfMonth, endOfMonth } from 'date-fns';

export async function GET(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const mesParam = searchParams.get('mes');
  const anoParam = searchParams.get('ano');
  const clienteId = searchParams.get('clienteId') || undefined;
  const fornecedorId = searchParams.get('fornecedorId') || undefined;
  const statusParam = searchParams.get('status') || undefined;

  const mes = mesParam ? parseInt(mesParam) : null;
  const ano = anoParam ? parseInt(anoParam) : null;

  // Build date filter based on what's provided
  let dateFilter: any = {};
  if (ano && mes) {
    const refDate = new Date(ano, mes - 1, 1);
    dateFilter = { criadoEm: { gte: startOfMonth(refDate), lte: endOfMonth(refDate) } };
  } else if (ano) {
    dateFilter = {
      criadoEm: {
        gte: new Date(ano, 0, 1),
        lte: new Date(ano, 11, 31, 23, 59, 59, 999),
      },
    };
  }
  // mes without ano → no date filter (cross-year monthly breakdown not supported)

  const where: any = { ...dateFilter };
  if (clienteId) where.clienteId = clienteId;
  if (fornecedorId) where.fornecedorId = fornecedorId;
  if (statusParam) where.status = statusParam;

  const whereGeral: any = {};
  if (clienteId) whereGeral.clienteId = clienteId;
  if (fornecedorId) whereGeral.fornecedorId = fornecedorId;
  if (statusParam) whereGeral.status = statusParam;

  const [totaisGeral, totaisPeriodo, porTipo, titulos, clientes, fornecedores] = await Promise.all([
    prisma.titulo.aggregate({
      _sum: { valor: true, encargo: true, spreadBruto: true, impostoProvisao: true, spreadLiquido: true, valorLiquidoCliente: true, baseEspelho: true },
      _count: { id: true },
      where: whereGeral,
    }),
    prisma.titulo.aggregate({
      _sum: { valor: true, encargo: true, spreadBruto: true, impostoProvisao: true, spreadLiquido: true, valorLiquidoCliente: true, baseEspelho: true },
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
      orderBy: [{ dataVencimento: 'asc' }, { valor: 'asc' }],
      include: { cliente: { select: { nome: true } }, fornecedor: { select: { nome: true } } },
    }),
    prisma.cliente.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true } }),
    prisma.fornecedor.findMany({ orderBy: { nome: 'asc' }, select: { id: true, nome: true } }),
  ]);

  let config: any = null;
  try {
    const cfgRows = await prisma.$queryRaw<any[]>`SELECT * FROM configuracoes WHERE id = 'default'`;
    config = cfgRows[0] ?? null;
  } catch {}

  // Total de prorrogações do período (tabela criada dinamicamente — ignora se não existir)
  let totalProrrogacoes = 0;
  try {
    const tituloIds: string[] = (titulos as any[]).map((t: any) => t.id);
    if (tituloIds.length > 0) {
      const rows = await prisma.$queryRaw<{ total: string }[]>`
        SELECT COALESCE(SUM("encargoProrrogacao"), 0)::text AS total
        FROM prorrogacoes
        WHERE "tituloId" = ANY(${tituloIds}::text[])
      `;
      totalProrrogacoes = parseFloat(rows[0]?.total ?? '0');
    }
  } catch {}

  return NextResponse.json({ totaisGeral, totaisPeriodo, porTipo, titulos, clientes, fornecedores, config, totalProrrogacoes });
}
