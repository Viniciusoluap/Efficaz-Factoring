import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

async function auth(req: NextRequest) {
  return await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await auth(req)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const cliente = await prisma.cliente.findUnique({ where: { id: params.id } });
  if (!cliente) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  return NextResponse.json(cliente);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await auth(req)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const { nome, cpfCnpj, email, telefone, endereco, ativo, representanteNome, representanteCpf } = await req.json();

    const cliente = await prisma.cliente.update({
      where: { id: params.id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(cpfCnpj !== undefined && { cpfCnpj }),
        ...(email !== undefined && { email }),
        ...(telefone !== undefined && { telefone }),
        ...(endereco !== undefined && { endereco }),
        ...(ativo !== undefined && { ativo }),
        representanteNome: representanteNome || null,
        representanteCpf: representanteCpf || null,
      },
    });

    if (nome !== undefined || email !== undefined) {
      await prisma.usuario.update({
        where: { id: cliente.usuarioId },
        data: {
          ...(nome !== undefined && { nome }),
          ...(email !== undefined && { email }),
        },
      });
    }

    return NextResponse.json(cliente);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'CPF/CNPJ ou e-mail já em uso.' }, { status: 409 });
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar cliente.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await auth(req)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { id: params.id },
      select: { usuarioId: true },
    });
    if (!cliente) return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });

    await prisma.$transaction([
      prisma.cliente.delete({ where: { id: params.id } }),
      prisma.usuario.delete({ where: { id: cliente.usuarioId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir cliente.' }, { status: 500 });
  }
}
