import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

export async function GET() {
  try {
    const config = await prisma.configuracao.findUnique({ where: { id: 'default' } });
    return NextResponse.json(config);
  } catch {
    return NextResponse.json(null);
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

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

    // Raw SQL: bypasses Prisma client schema compatibility issues entirely.
    // Uses only columns guaranteed to exist in every DB version.
    await prisma.$executeRaw`
      INSERT INTO configuracoes (id, "taxaMinimaFiscal", "aliquotaImposto", "nomeEmpresa", "cnpj", "emailSistema", "atualizadoEm")
      VALUES ('default', ${tMF}, ${tAI}, ${nome}, ${cnpjVal}, ${emailVal}, NOW())
      ON CONFLICT (id) DO UPDATE SET
        "taxaMinimaFiscal" = ${tMF},
        "aliquotaImposto" = ${tAI},
        "nomeEmpresa" = ${nome},
        "cnpj" = ${cnpjVal},
        "emailSistema" = ${emailVal},
        "atualizadoEm" = NOW()
    `;

    // Try to update columns added in later migrations (silently skip if absent).
    try {
      await prisma.$executeRaw`
        UPDATE configuracoes SET
          "telefone" = ${telVal},
          "endereco" = ${endVal},
          "aliquotaPIS" = ${tPIS},
          "aliquotaCOFINS" = ${tCOFINS},
          "aliquotaIRPJ" = ${tIRPJ},
          "aliquotaCSLL" = ${tCSLL},
          "aliquotaISS" = ${tISS},
          "aliquotaIOF" = ${tIOF}
        WHERE id = 'default'
      `;
    } catch { /* columns not yet migrated in this environment */ }

    const saved = await prisma.configuracao.findUnique({ where: { id: 'default' } });
    return NextResponse.json(saved ?? { id: 'default', taxaMinimaFiscal: tMF, aliquotaImposto: tAI });
  } catch (err) {
    console.error('[PUT /api/configuracoes]', err);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
