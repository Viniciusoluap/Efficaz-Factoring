import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calcularOperacao, calcularFiscal } from '@/lib/calculos';

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

    // Calcular resultado financeiro
    const resultado = calcularOperacao({
      valor: parseFloat(valor),
      taxaCliente: parseFloat(taxaCliente),
      taxaFornecedor: parseFloat(taxaFornecedor),
      dataEmissao: new Date(dataEmissao),
      dataVencimento: new Date(dataVencimento),
    });

    // Buscar configuração fiscal
    const config = await prisma.configuracao.findUnique({ where: { id: 'default' } });
    const fiscal = calcularFiscal(
      resultado,
      parseFloat(valor),
      resultado.prazo,
      Number(config?.taxaMinimaFiscal ?? 0.5),
      Number(config?.aliquotaImposto ?? 15),
    );

    const titulo = await prisma.titulo.create({
      data: {
        tipo: tipo as any,
        numero,
        emitenteCpfCnpj,
        emitenteNome,
        sacadoCpfCnpj,
        sacadoNome,
        dataEmissao: new Date(dataEmissao),
        dataVencimento: new Date(dataVencimento),
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
