import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const nomeCustom = (formData.get('nome') as string) || '';

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 10MB.' }, { status: 413 });
  }

  const ext = (file.name.split('.').pop() ?? 'pdf').toLowerCase();
  const blobPath = `operacoes/${params.id}/${Date.now()}.${ext}`;
  const nome = nomeCustom || file.name;

  let url: string;
  try {
    const blob = await put(blobPath, file, { access: 'public' });
    url = blob.url;
  } catch {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    url = `data:${file.type || 'application/pdf'};base64,${base64}`;
  }

  const doc = await (prisma as any).documentoOperacao.create({
    data: { operacaoId: params.id, nome, url },
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { docId } = await req.json();
  try {
    await (prisma as any).documentoOperacao.delete({
      where: { id: docId, operacaoId: params.id },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erro ao remover documento.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const docs = await (prisma as any).documentoOperacao.findMany({
    where: { operacaoId: params.id },
    orderBy: { criadoEm: 'desc' },
  });
  return NextResponse.json(docs);
}
