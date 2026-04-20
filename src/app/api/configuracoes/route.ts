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

    const tMF = parseFloat(taxaMinimaFiscal) || 0.5;
    const tAI = parseFloat(aliquotaImposto) || 35;

    // Level 1: all fields (full schema)
    const fullData = {
      nomeEmpresa: nomeEmpresa || 'Efficaz Factoring',
      cnpj: cnpj || null,
      emailSistema: emailSistema || null,
      telefone: telefone || null,
      endereco: endereco || null,
      taxaMinimaFiscal: tMF,
      aliquotaImposto: tAI,
      aliquotaPIS: parseFloat(aliquotaPIS) || 1.65,
      aliquotaCOFINS: parseFloat(aliquotaCOFINS) || 7.6,
      aliquotaIRPJ: parseFloat(aliquotaIRPJ) || 15,
      aliquotaCSLL: parseFloat(aliquotaCSLL) || 9,
      aliquotaISS: parseFloat(aliquotaISS) || 5,
      aliquotaIOF: parseFloat(aliquotaIOF) || 0.38,
    };

    // Level 2: without telefone/endereco (added later)
    const midData = {
      nomeEmpresa: nomeEmpresa || 'Efficaz Factoring',
      cnpj: cnpj || null,
      emailSistema: emailSistema || null,
      taxaMinimaFiscal: tMF,
      aliquotaImposto: tAI,
      aliquotaPIS: parseFloat(aliquotaPIS) || 1.65,
      aliquotaCOFINS: parseFloat(aliquotaCOFINS) || 7.6,
      aliquotaIRPJ: parseFloat(aliquotaIRPJ) || 15,
      aliquotaCSLL: parseFloat(aliquotaCSLL) || 9,
      aliquotaISS: parseFloat(aliquotaISS) || 5,
      aliquotaIOF: parseFloat(aliquotaIOF) || 0.38,
    };

    // Level 3: only original fields — guaranteed to exist since day 1
    const minData = {
      taxaMinimaFiscal: tMF,
      aliquotaImposto: tAI,
    };

    let config;
    try {
      config = await prisma.configuracao.upsert({
        where: { id: 'default' },
        update: fullData,
        create: { id: 'default', ...fullData },
      });
    } catch {
      try {
        config = await prisma.configuracao.upsert({
          where: { id: 'default' },
          update: midData,
          create: { id: 'default', ...midData },
        });
      } catch {
        config = await prisma.configuracao.upsert({
          where: { id: 'default' },
          update: minData,
          create: { id: 'default', ...minData },
        });
      }
    }

    return NextResponse.json(config);
  } catch (err) {
    console.error('[PUT /api/configuracoes]', err);
    return NextResponse.json({ error: 'Erro ao salvar configurações.' }, { status: 500 });
  }
}
