import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { calcularOperacao, calcularFiscal } from '@/lib/calculos';
import { z } from 'zod';

const pagamentoSchema = z.object({
  valorPagamento: z.number().finite().positive(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const parsed = pagamentoSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Valor de pagamento inválido.' }, { status: 400 });
    }
    const pgtoNum = parsed.data.valorPagamento;

    const titulo = await prisma.titulo.findUnique({ where: { id: params.id } });
    if (!titulo) return NextResponse.json({ error: 'Título não encontrado.' }, { status: 404 });

    const valorAtual = Number(titulo.valor);
    if (pgtoNum >= valorAtual) {
      return NextResponse.json({
        error: 'Pagamento parcial não pode ser maior ou igual ao valor total. Use Liquidar para pagamento total.',
      }, { status: 400 });
    }

    const novoValor = Math.round((valorAtual - pgtoNum) * 100) / 100;

    const config = await prisma.configuracao.findUnique({ where: { id: 'default' } });

    const resultado = calcularOperacao({
      valor: novoValor,
      taxaCliente: Number(titulo.taxaCliente),
      taxaFornecedor: Number(titulo.taxaFornecedor),
      dataEmissao: new Date(titulo.dataEmissao),
      dataVencimento: new Date(titulo.dataVencimento),
    });

    const fiscal = calcularFiscal(
      resultado, novoValor, resultado.prazoEfetivo,
      Number(config?.taxaMinimaFiscal ?? 0.5),
      Number(config?.aliquotaImposto ?? 38.63),
    );

    const updated = await prisma.titulo.update({
      where: { id: params.id },
      data: {
        valor: novoValor,
        encargo: resultado.encargo,
        valorLiquidoCliente: resultado.valorLiquidoCliente,
        custoCedente: resultado.custoCedente,
        spreadBruto: resultado.spreadBruto,
        taxaEspelho: fiscal.taxaEspelho,
        baseEspelho: fiscal.baseEspelho,
        impostoProvisao: fiscal.impostoProvisao,
        spreadLiquido: fiscal.spreadLiquido,
      },
    });

    return NextResponse.json({ novoValor, updated });
  } catch (err) {
    console.error('[POST /api/titulos/[id]/pagamento-parcial]', err);
    return NextResponse.json({ error: 'Erro ao registrar pagamento parcial.' }, { status: 500 });
  }
}
