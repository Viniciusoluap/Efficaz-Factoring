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
    const {
      nomeEmpresa, cnpj, emailSistema,
      taxaMinimaFiscal, aliquotaImposto,
      aliquotaPIS, aliquotaCOFINS, aliquotaIRPJ,
      aliquotaCSLL, aliquotaISS, aliquotaIOF,
    } = await req.json();

    const data = {
      nomeEmpresa: nomeEmpresa || 'Efficaz Factoring',
      cnpj: cnpj || null,
      emailSistema: emailSistema || null,
      taxaMinimaFiscal: parseFloat(taxaMinimaFiscal) || 0.5,
      aliquotaImposto: parseFloat(aliquotaImposto) || 35,
      aliquotaPIS: parseFloat(aliquotaPIS) || 1.65,
      aliquotaCOFINS: parseFloat(aliquotaCOFINS) || 7.6,
      aliquotaIRPJ: parseFloat(aliquotaIRPJ) || 15,
      aliquotaCSLL: parseFloat(aliquotaCSLL) || 9,
      aliquotaISS: parseFloat(aliquotaISS) || 5,
      aliquotaIOF: parseFloat(aliquotaIOF) || 0.38,
    };

    const config = await prisma.configuracao.upsert({
      where: { id: 'default' },
      update: data,
      create: { id: 'default', ...data },
    });

    return NextResponse.json(config);
  } catch (err) {
    console.error('[PUT /api/configuracoes]', err);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
