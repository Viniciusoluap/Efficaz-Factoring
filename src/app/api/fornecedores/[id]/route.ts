import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

async function auth(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await auth(req)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const fornecedor = await prisma.fornecedor.findUnique({ where: { id: params.id } });
  if (!fornecedor) return NextResponse.json({ error: 'Não encontrado.' }, { status: 404 });
  return NextResponse.json(fornecedor);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await auth(req)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const { nome, cpfCnpj, email, telefone, capitalTotal, ativo } = await req.json();

    const fornecedor = await prisma.fornecedor.update({
      where: { id: params.id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(cpfCnpj !== undefined && { cpfCnpj }),
        ...(email !== undefined && { email }),
        ...(telefone !== undefined && { telefone }),
        ...(capitalTotal !== undefined && { capitalTotal: parseFloat(capitalTotal) }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    // Sync nome/email on usuario as well
    if (nome !== undefined || email !== undefined) {
      await prisma.usuario.update({
        where: { id: fornecedor.usuarioId },
        data: {
          ...(nome !== undefined && { nome }),
          ...(email !== undefined && { email }),
        },
      });
    }

    return NextResponse.json(fornecedor);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json({ error: 'CPF/CNPJ ou e-mail já em uso.' }, { status: 409 });
    }
    if (err.code === 'P2025') {
      return NextResponse.json({ error: 'Fornecedor não encontrado.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erro ao atualizar fornecedor.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await auth(req)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  try {
    const fornecedor = await prisma.fornecedor.findUnique({
      where: { id: params.id },
      select: { usuarioId: true },
    });
    if (!fornecedor) return NextResponse.json({ error: 'Fornecedor não encontrado.' }, { status: 404 });

    await prisma.$transaction([
      prisma.fornecedor.delete({ where: { id: params.id } }),
      prisma.usuario.delete({ where: { id: fornecedor.usuarioId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao excluir fornecedor.' }, { status: 500 });
  }
}
