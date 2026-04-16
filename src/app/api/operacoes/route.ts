import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calcularOperacao, calcularFiscal } from '@/lib/calculos';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const operacoes = await prisma.operacao.findMany({
    orderBy: { criadoEm: 'desc' },
    include: {
      cliente: { select: { nome: true } },
      fornecedor: { select: { nome: true } },
      _count: { select: { titulos: true } },
    },
  });
  return NextResponse.json(operacoes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const body = await req.json();
    const { taxaCliente, taxaFornecedor, clienteId, fornecedorId, observacoes, titulos, operacaoId } = body;

    if (!taxaCliente || !taxaFornecedor || !titulos?.length) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
    }

    const config = await prisma.configuracao.findUnique({ where: { id: 'default' } });

    const criarTituloData = async (tx: any, opId: string, t: any) => {
      const resultado = calcularOperacao({
        valor: parseFloat(t.valor),
        taxaCliente: parseFloat(taxaCliente),
        taxaFornecedor: parseFloat(taxaFornecedor),
        dataEmissao: new Date(t.dataEmissao),
        dataVencimento: new Date(t.dataVencimento),
      });
      const fiscal = calcularFiscal(
        resultado,
        parseFloat(t.valor),
        resultado.prazoEfetivo,
        Number(config?.taxaMinimaFiscal ?? 0.5),
        Number(config?.aliquotaImposto ?? 15),
      );
      await tx.titulo.create({
        data: {
          operacaoId: opId,
          tipo: t.tipo,
          numero: t.numero,
          emitenteCpfCnpj: t.emitenteCpfCnpj,
          emitenteNome: t.emitenteNome,
          sacadoCpfCnpj: t.sacadoCpfCnpj,
          sacadoNome: t.sacadoNome,
          dataEmissao: new Date(t.dataEmissao),
          dataVencimento: new Date(t.dataVencimento),
          prazo: resultado.prazo,
          valor: parseFloat(t.valor),
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
    };

    // Adicionar a operação existente
    if (operacaoId) {
      const op = await prisma.operacao.findUnique({ where: { id: operacaoId } });
      if (!op) return NextResponse.json({ error: 'Operação não encontrada.' }, { status: 404 });
      await prisma.$transaction(async (tx) => {
        for (const t of titulos) await criarTituloData(tx, operacaoId, t);
      });
      return NextResponse.json({ id: operacaoId }, { status: 200 });
    }

    // Criar nova operação
    const count = await prisma.operacao.count();
    const numero = `OP-${String(count + 1).padStart(5, '0')}`;

    const operacao = await prisma.$transaction(async (tx) => {
      const op = await tx.operacao.create({
        data: {
          numero,
          taxaCliente: parseFloat(taxaCliente),
          taxaFornecedor: parseFloat(taxaFornecedor),
          clienteId: clienteId || null,
          fornecedorId: fornecedorId || null,
          observacoes: observacoes || null,
        },
      });
      for (const t of titulos) await criarTituloData(tx, op.id, t);
      return op;
    });

    return NextResponse.json(operacao, { status: 201 });
  } catch (err) {
    console.error('[POST /api/operacoes]', err);
    return NextResponse.json({ error: 'Erro ao criar operação.' }, { status: 500 });
  }
}
