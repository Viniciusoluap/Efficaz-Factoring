import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calcularOperacao, calcularFiscal } from '@/lib/calculos';

const parseDate = (s: string) => new Date(s.includes('T') ? s : s + 'T12:00:00.000Z');

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

    let config: any = null;
    try {
      const rows = await prisma.$queryRaw<any[]>`SELECT * FROM configuracoes WHERE id = 'default'`;
      config = rows[0] ?? null;
    } catch {}

    const montarTitulo = (t: any, idx: number, opId: string) => {
      const valor = parseFloat(t.valor);
      const dEmissao = parseDate(t.dataEmissao);
      const dVencimento = parseDate(t.dataVencimento);
      if (!isFinite(valor) || isNaN(dEmissao.getTime()) || isNaN(dVencimento.getTime())) {
        throw new Error(`TITULO_INVALIDO:${idx + 1}`);
      }
      const resultado = calcularOperacao({
        valor,
        taxaCliente: parseFloat(taxaCliente),
        taxaFornecedor: parseFloat(taxaFornecedor),
        dataEmissao: dEmissao,
        dataVencimento: dVencimento,
      });
      const fiscal = calcularFiscal(
        resultado,
        valor,
        resultado.prazoEfetivo,
        Number(config?.taxaMinimaFiscal ?? 0.5),
        Number(config?.aliquotaImposto ?? 38.63),
      );
      return {
        operacaoId: opId,
        tipo: t.tipo,
        numero: t.numero,
        emitenteCpfCnpj: t.emitenteCpfCnpj,
        emitenteNome: t.emitenteNome,
        sacadoCpfCnpj: t.sacadoCpfCnpj,
        sacadoNome: t.sacadoNome,
        dataEmissao: dEmissao,
        dataVencimento: dVencimento,
        prazo: resultado.prazo,
        valor,
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
      };
    };
    const txOpts = { timeout: 30000, maxWait: 10000 };

    if (operacaoId) {
      const op = await prisma.operacao.findUnique({ where: { id: operacaoId } });
      if (!op) return NextResponse.json({ error: 'Operação não encontrada.' }, { status: 404 });
      const data = titulos.map((t: any, i: number) => montarTitulo(t, i, operacaoId));
      await prisma.titulo.createMany({ data });
      return NextResponse.json({ id: operacaoId }, { status: 200 });
    }

    // Número sequencial baseado no maior existente; retenta em caso de colisão (unique)
    for (let tentativa = 0; tentativa < 5; tentativa++) {
      const ultima = await prisma.operacao.findFirst({ orderBy: { numero: 'desc' }, select: { numero: true } });
      const proximo = (parseInt(ultima?.numero?.replace(/\D/g, '') || '0', 10) || 0) + 1 + tentativa;
      const numero = `OP-${String(proximo).padStart(5, '0')}`;
      try {
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
          const data = titulos.map((t: any, i: number) => montarTitulo(t, i, op.id));
          await tx.titulo.createMany({ data });
          return op;
        }, txOpts);
        return NextResponse.json(operacao, { status: 201 });
      } catch (e: any) {
        if (e?.code === 'P2002' && tentativa < 4) continue;
        throw e;
      }
    }
    return NextResponse.json({ error: 'Não foi possível gerar o número da operação.' }, { status: 500 });
  } catch (err) {
    console.error('[POST /api/operacoes]', err);
    const msg = err instanceof Error ? err.message : '';
    if (msg.startsWith('TITULO_INVALIDO:')) {
      return NextResponse.json({ error: `Título ${msg.split(':')[1]}: valor ou data inválidos.` }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao criar operação.', detail: msg.slice(0, 300) }, { status: 500 });
  }
}
