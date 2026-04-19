import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const config = await prisma.configuracao.findUnique({ where: { id: 'default' } });
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const body = await req.json();
    const {
      nomeEmpresa, cnpj, emailSistema, telefone, endereco,
      taxaMinimaFiscal, aliquotaImposto,
      aliquotaPIS, aliquotaCOFINS, aliquotaIRPJ,
      aliquotaCSLL, aliquotaISS, aliquotaIOF,
    } = body;

    const baseData = {
      nomeEmpresa: nomeEmpresa || 'Efficaz Factoring',
      cnpj: cnpj || null,
      emailSistema: emailSistema || null,
      telefone: telefone || null,
      endereco: endereco || null,
      taxaMinimaFiscal: parseFloat(taxaMinimaFiscal) || 0.5,
      aliquotaImposto: parseFloat(aliquotaImposto) || 35,
    };

    const fullData = {
      ...baseData,
      aliquotaPIS: parseFloat(aliquotaPIS) || 1.65,
      aliquotaCOFINS: parseFloat(aliquotaCOFINS) || 7.6,
      aliquotaIRPJ: parseFloat(aliquotaIRPJ) || 15,
      aliquotaCSLL: parseFloat(aliquotaCSLL) || 9,
      aliquotaISS: parseFloat(aliquotaISS) || 5,
      aliquotaIOF: parseFloat(aliquotaIOF) || 0.38,
    };

    let config;
    try {
      config = await prisma.configuracao.upsert({
        where: { id: 'default' },
        update: fullData,
        create: { id: 'default', ...fullData },
      });
    } catch (prismaErr: any) {
      // Fallback: DB migration may not have run yet for new tax columns
      config = await prisma.configuracao.upsert({
        where: { id: 'default' },
        update: baseData,
        create: { id: 'default', ...baseData },
      });
    }

    return NextResponse.json(config);
  } catch (err) {
    console.error('[PUT /api/configuracoes]', err);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
