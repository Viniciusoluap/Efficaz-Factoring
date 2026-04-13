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

  const { nomeEmpresa, cnpj, emailSistema, taxaMinimaFiscal, aliquotaImposto } = await req.json();

  const config = await prisma.configuracao.upsert({
    where: { id: 'default' },
    update: {
      nomeEmpresa, cnpj, emailSistema,
      taxaMinimaFiscal: parseFloat(taxaMinimaFiscal),
      aliquotaImposto: parseFloat(aliquotaImposto),
    },
    create: {
      id: 'default',
      nomeEmpresa, cnpj, emailSistema,
      taxaMinimaFiscal: parseFloat(taxaMinimaFiscal),
      aliquotaImposto: parseFloat(aliquotaImposto),
    },
  });

  return NextResponse.json(config);
}
