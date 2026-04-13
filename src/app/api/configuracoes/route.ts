import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const config = await prisma.configuracao.findUnique({ where: { id: 'default' } });
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

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
