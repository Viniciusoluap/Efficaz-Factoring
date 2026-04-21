import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { calcularOperacao, calcularFiscal, calcularDataD2 } from '@/lib/calculos';
import { differenceInDays } from 'date-fns';
import { randomUUID } from 'crypto';

const parseDate = (s: string) => new Date(s.includes('T') ? s : s + 'T12:00:00.000Z');

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const body = await req.json();
    const { novaData, taxaCliente, taxaFornecedor: taxaFornecedorProrr = 0 } = body;
    if (!novaData || !taxaCliente) {
      return NextResponse.json({ error: 'Nova data e taxa são obrigatórias.' }, { status: 400 });
    }

    const titulo = await prisma.titulo.findUnique({
      where: { id: params.id },
      include: { cliente: true },
    });
    if (!titulo) return NextResponse.json({ error: 'Título não encontrado.' }, { status: 404 });

    const dataVencAnterior = new Date(titulo.dataVencimento);
    const dataVencNova = parseDate(novaData);

    if (dataVencNova <= dataVencAnterior) {
      return NextResponse.json({ error: 'Nova data deve ser posterior ao vencimento atual.' }, { status: 400 });
    }

    const taxaClienteNum = parseFloat(String(taxaCliente));
    const taxaFornecedorNum = parseFloat(String(taxaFornecedorProrr)) || 0;
    const valor = Number(titulo.valor);

    const dataD2Prorrogacao = calcularDataD2(dataVencNova);
    const prazoProrrogacao = differenceInDays(dataD2Prorrogacao, dataVencAnterior);
    let encargoProrrogacao = ((valor * (taxaClienteNum / 100)) / 30) * prazoProrrogacao;
    if (encargoProrrogacao < 50) encargoProrrogacao = 50;
    encargoProrrogacao = Math.round(encargoProrrogacao * 100) / 100;

    let config: any = null;
    try {
      const rows = await prisma.$queryRaw<any[]>`SELECT * FROM configuracoes WHERE id = 'default'`;
      config = rows[0] ?? null;
    } catch {}

    const taxaFornFinal = taxaFornecedorNum > 0 ? taxaFornecedorNum : Number(titulo.taxaFornecedor);

    const novoResultado = calcularOperacao({
      valor,
      taxaCliente: taxaClienteNum,
      taxaFornecedor: taxaFornFinal,
      dataEmissao: new Date(titulo.dataEmissao),
      dataVencimento: dataVencNova,
    });

    const novoFiscal = calcularFiscal(
      novoResultado, valor, novoResultado.prazoEfetivo,
      Number(config?.taxaMinimaFiscal ?? 0.5),
      Number(config?.aliquotaImposto ?? 38.63),
    );

    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS prorrogacoes (
          id TEXT PRIMARY KEY,
          "tituloId" TEXT NOT NULL REFERENCES titulos(id) ON DELETE CASCADE,
          "dataVencAnterior" TIMESTAMPTZ NOT NULL,
          "dataVencNova" TIMESTAMPTZ NOT NULL,
          "taxaCliente" DECIMAL(8,4) NOT NULL,
          "encargoProrrogacao" DECIMAL(15,2) NOT NULL,
          "criadoEm" TIMESTAMPTZ DEFAULT NOW()
        )
      `;
    } catch {}

    const prorrogacaoId = randomUUID();

    await prisma.$transaction(async (tx) => {
      try {
        await tx.$executeRaw`
          INSERT INTO prorrogacoes (id, "tituloId", "dataVencAnterior", "dataVencNova", "taxaCliente", "encargoProrrogacao")
          VALUES (${prorrogacaoId}, ${params.id}, ${dataVencAnterior}, ${dataVencNova}, ${taxaClienteNum}, ${encargoProrrogacao})
        `;
      } catch {}

      await tx.titulo.update({
        where: { id: params.id },
        data: {
          dataVencimento: dataVencNova,
          taxaCliente: taxaClienteNum,
          taxaFornecedor: taxaFornFinal,
          prazo: novoResultado.prazo,
          encargo: novoResultado.encargo,
          valorLiquidoCliente: novoResultado.valorLiquidoCliente,
          custoCedente: novoResultado.custoCedente,
          spreadBruto: novoResultado.spreadBruto,
          taxaEspelho: novoFiscal.taxaEspelho,
          baseEspelho: novoFiscal.baseEspelho,
          impostoProvisao: novoFiscal.impostoProvisao,
          spreadLiquido: novoFiscal.spreadLiquido,
        },
      });
    });

    return NextResponse.json({ encargoProrrogacao, prorrogacaoId, novoResultado });
  } catch (err) {
    console.error('[POST /api/titulos/[id]/prorrogar]', err);
    return NextResponse.json({ error: 'Erro ao prorrogar título.' }, { status: 500 });
  }
}
