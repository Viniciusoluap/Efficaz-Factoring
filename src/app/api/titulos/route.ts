import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calcularOperacao, calcularFiscal } from '@/lib/calculos';

// Dates from input are YYYY-MM-DD strings. Using UTC noon prevents timezone-shift
// when the server runs in a non-UTC locale (e.g. UTC-3 would shift midnight to prev day).
const parseDate = (s: string) => new Date(s.includes('T') ? s : s + 'T12:00:00.000Z');

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const titulos = await prisma.titulo.findMany({
    orderBy: [{ dataVencimento: 'asc' }, { valor: 'asc' }],
    include: { cliente: true, fornecedor: true },
  });
  return NextResponse.json(titulos);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      tipo, numero, emitenteCpfCnpj, emitenteNome,
      sacadoCpfCnpj, sacadoNome, dataEmissao, dataVencimento,
      valor, taxaCliente, taxaFornecedor,
      clienteId, fornecedorId, observacoes,
    } = body;

    if (!tipo || !numero || !emitenteCpfCnpj || !emitenteNome || !sacadoCpfCnpj ||
        !sacadoNome || !dataEmissao || !dataVencimento || !valor || !taxaCliente || !taxaFornecedor) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const dEmissao = parseDate(dataEmissao);
    const dVencimento = parseDate(dataVencimento);

    const resultado = calcularOperacao({
      valor: parseFloat(valor),
      taxaCliente: parseFloat(taxaCliente),
      taxaFornecedor: parseFloat(taxaFornecedor),
      dataEmissao: dEmissao,
      dataVencimento: dVencimento,
    });

    let config: any = null;
    try {
      const rows = await prisma.$queryRaw<any[]>`SELECT * FROM configuracoes WHERE id = 'default'`;
      config = rows[0] ?? null;
    } catch {}

    const fiscal = calcularFiscal(
      resultado,
      parseFloat(valor),
      resultado.prazoEfetivo,
      Number(config?.taxaMinimaFiscal ?? 0.5),
      Number(config?.aliquotaImposto ?? 38.63),
    );

    const titulo = await prisma.titulo.create({
      data: {
        tipo: tipo as any,
        numero,
        emitenteCpfCnpj,
        emitenteNome,
        sacadoCpfCnpj,
        sacadoNome,
        dataEmissao: dEmissao,
        dataVencimento: dVencimento,
        prazo: resultado.prazo,
        valor: parseFloat(valor),
        taxaCliente: parseFloat(taxaCliente),
        taxaFornecedor: parseFloat(taxaFornecedor),
        encargo: resultado.encargo,
        valorLiquidoCliente: resultado.valorLiquidoCliente,
        custoCedente: resultado.custoCedente,
        spreadBruto: resultado.spreadBruto,
        taxaEspelho: fiscal.taxaEspelho,
        baseEspelho: fiscal.baseEspelho,
        impostoProvisao: fiscal.impostoProvisao,
        spreadLiquido: fiscal.spreadLiquido,
        clienteId: clienteId || null,
        fornecedorId: fornecedorId || null,
        observacoes: observacoes || null,
      },
    });

    return NextResponse.json(titulo, { status: 201 });
  } catch (err) {
    console.error('[POST /api/titulos]', err);
    return NextResponse.json({ error: 'Erro ao criar título.' }, { status: 500 });
  }
}
