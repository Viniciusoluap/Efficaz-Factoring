import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const token = await getToken({ req });
  if (!token) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const pasta = (formData.get('pasta') as string) || 'uploads';

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });

  const ext = file.name.split('.').pop() ?? 'bin';
  const filename = `${pasta}/${token.sub}/${Date.now()}.${ext}`;

  const blob = await put(filename, file, {
    access: 'public',
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}
