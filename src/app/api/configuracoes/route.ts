import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const rows = await prisma.$queryRaw<any[]>`SELECT * FROM configuracoes WHERE id = 'default'`;
    return NextResponse.json(rows[0] ?? null);
  } catch {
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nomeEmpresa, cnpj, emailSistema, telefone, endereco,
      taxaMinimaFiscal, aliquotaImposto,
      aliquotaPIS, aliquotaCOFINS, aliquotaIRPJ,
      aliquotaCSLL, aliquotaISS, aliquotaIOF,
    } = body;

    const tMF = parseFloat(String(taxaMinimaFiscal).replace(',', '.')) || 0.5;
    const tAI = parseFloat(String(aliquotaImposto).replace(',', '.')) || 38.63;
    const tPIS = parseFloat(String(aliquotaPIS).replace(',', '.')) || 1.65;
    const tCOFINS = parseFloat(String(aliquotaCOFINS).replace(',', '.')) || 7.6;
    const tIRPJ = parseFloat(String(aliquotaIRPJ).replace(',', '.')) || 15;
    const tCSLL = parseFloat(String(aliquotaCSLL).replace(',', '.')) || 9;
    const tISS = parseFloat(String(aliquotaISS).replace(',', '.')) || 5;
    const tIOF = parseFloat(String(aliquotaIOF).replace(',', '.')) || 0.38;

    const nome = nomeEmpresa || 'Efficaz Factoring';
    const cnpjVal = cnpj || null;
    const emailVal = emailSistema || null;
    const telVal = telefone || null;
    const endVal = endereco || null;

    // Raw SQL: inclui atualizadoEm (NOT NULL @updatedAt sem default no PostgreSQL)
    await prisma.$executeRaw`
      INSERT INTO configuracoes (
        id, "taxaMinimaFiscal", "aliquotaImposto", "nomeEmpresa", "cnpj", "emailSistema",
        "telefone", "endereco", "aliquotaPIS", "aliquotaCOFINS", "aliquotaIRPJ",
        "aliquotaCSLL", "aliquotaISS", "aliquotaIOF", "atualizadoEm"
      )
      VALUES (
        'default', ${tMF}, ${tAI}, ${nome}, ${cnpjVal}, ${emailVal},
        ${telVal}, ${endVal}, ${tPIS}, ${tCOFINS}, ${tIRPJ},
        ${tCSLL}, ${tISS}, ${tIOF}, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        "taxaMinimaFiscal" = ${tMF},
        "aliquotaImposto" = ${tAI},
        "nomeEmpresa" = ${nome},
        "cnpj" = ${cnpjVal},
        "emailSistema" = ${emailVal},
        "telefone" = ${telVal},
        "endereco" = ${endVal},
        "aliquotaPIS" = ${tPIS},
        "aliquotaCOFINS" = ${tCOFINS},
        "aliquotaIRPJ" = ${tIRPJ},
        "aliquotaCSLL" = ${tCSLL},
        "aliquotaISS" = ${tISS},
        "aliquotaIOF" = ${tIOF},
        "atualizadoEm" = NOW()
    `;

    let saved = null;
    try {
      const rows = await prisma.$queryRaw<any[]>`SELECT * FROM configuracoes WHERE id = 'default'`;
      saved = rows[0] ?? null;
    } catch {}
    return NextResponse.json(saved ?? { id: 'default', taxaMinimaFiscal: tMF, aliquotaImposto: tAI });
  } catch (err) {
    console.error('[PUT /api/configuracoes]', err);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
