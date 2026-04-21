import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const ativo = req.nextUrl.searchParams.get('ativo');
  const where = ativo ? { ativo: ativo === 'true' } : {};
  const clientes = await prisma.cliente.findMany({ where, orderBy: { nome: 'asc' } });
  return NextResponse.json(clientes);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const { nome, cpfCnpj, email, telefone, endereco, senhaPortal, representanteNome, representanteCpf } = await req.json();
    if (!nome || !cpfCnpj || !email) {
      return NextResponse.json({ error: 'Nome, CPF/CNPJ e e-mail são obrigatórios.' }, { status: 400 });
    }

    const senhaHash = senhaPortal
      ? await bcrypt.hash(senhaPortal, 10)
      : await bcrypt.hash(Math.random().toString(36).slice(-8), 10);

    const usuario = await prisma.usuario.create({
      data: { nome, email, senha: senhaHash, perfil: 'CLIENTE' },
    });

    const cliente = await prisma.cliente.create({
      data: {
        usuarioId: usuario.id, nome, cpfCnpj, email, telefone, endereco,
        ...(representanteNome ? { representanteNome } : {}),
        ...(representanteCpf ? { representanteCpf } : {}),
      },
    });

    return NextResponse.json(cliente, { status: 201 });
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'CPF/CNPJ ou e-mail já cadastrado.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Erro ao criar cliente.' }, { status: 500 });
  }
}
