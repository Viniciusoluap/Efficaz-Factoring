import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const userId = (session.user as any).id as string;

  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const pasta = (formData.get('pasta') as string) || 'uploads';

  if (!file) return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo 2MB por arquivo.' }, { status: 413 });
  }

  const ext = file.name.split('.').pop() ?? 'bin';
  const filename = `${pasta}/${userId}/${Date.now()}.${ext}`;
  const contentType = file.type || 'application/octet-stream';

  // Try Vercel Blob first; fall back to base64 data URI if not configured
  try {
    const blob = await put(filename, file, { access: 'public', contentType });
    return NextResponse.json({ url: blob.url });
  } catch {
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUri = `data:${contentType};base64,${base64}`;
    return NextResponse.json({ url: dataUri });
  }
}
