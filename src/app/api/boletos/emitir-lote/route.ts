import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emitirBoleto } from '@/lib/c6bank';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { tituloIds } = await req.json();
    if (!Array.isArray(tituloIds) || tituloIds.length === 0) {
      return NextResponse.json({ error: 'tituloIds obrigatório' }, { status: 400 });
    }

    const cfgRows = await prisma.$queryRaw<any[]>`SELECT * FROM configuracoes WHERE id = 'default'`;
    const cfg = cfgRows[0] ?? null;

    if (!cfg?.c6BankAccessToken || !cfg?.c6BankPersonId) {
      return NextResponse.json({ titulos: [], c6NaoConfigurado: true });
    }

    const c6Config = {
      c6BankAccessToken: String(cfg.c6BankAccessToken),
      c6BankPersonId: String(cfg.c6BankPersonId),
      c6BankSandbox: Boolean(cfg.c6BankSandbox ?? true),
    };

    const titulos = await (prisma as any).titulo.findMany({
      where: { id: { in: tituloIds }, tipo: 'BOLETO' },
      select: {
        id: true,
        sacadoNome: true,
        sacadoCpfCnpj: true,
        valor: true,
        dataVencimento: true,
        boletoId: true,
        linhaDigitavel: true,
      },
    });

    const results: { id: string; linhaDigitavel: string }[] = [];

    for (const titulo of titulos) {
      if (titulo.boletoId && titulo.linhaDigitavel) {
        results.push({ id: titulo.id, linhaDigitavel: titulo.linhaDigitavel });
        continue;
      }

      try {
        const boleto = await emitirBoleto(
          {
            id: titulo.id,
            sacadoNome: titulo.sacadoNome,
            sacadoCpfCnpj: titulo.sacadoCpfCnpj,
            valor: Number(titulo.valor),
            dataVencimento: new Date(titulo.dataVencimento).toISOString(),
          },
          c6Config,
        );

        await (prisma as any).titulo.update({
          where: { id: titulo.id },
          data: {
            boletoId: boleto.id,
            linhaDigitavel: boleto.linhaDigitavel,
            codigoBarra: boleto.codigoBarra,
            boletoUrl: boleto.boletoUrl ?? null,
            boletoEmitidoEm: new Date(),
          },
        });

        results.push({ id: titulo.id, linhaDigitavel: boleto.linhaDigitavel });
      } catch (err) {
        console.error(`[emitir-lote] erro no boleto ${titulo.id}:`, err);
        results.push({ id: titulo.id, linhaDigitavel: '' });
      }
    }

    return NextResponse.json({ titulos: results });
  } catch (err) {
    console.error('[emitir-lote]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
