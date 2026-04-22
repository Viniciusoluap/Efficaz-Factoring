import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export const runtime = 'nodejs';

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  png: 'image/png', gif: 'image/gif', webp: 'image/webp',
  heic: 'image/heic', heif: 'image/heif', bmp: 'image/bmp',
  tiff: 'image/tiff', tif: 'image/tiff',
};

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) return new NextResponse('Não autorizado', { status: 401 });

  const url = req.nextUrl.searchParams.get('url');
  const name = req.nextUrl.searchParams.get('name') ?? 'arquivo';

  if (!url) return new NextResponse('URL obrigatória', { status: 400 });

  // Only proxy our own Vercel Blob storage URLs
  if (!url.startsWith('https://') || !url.includes('vercel-storage.com')) {
    return new NextResponse('URL não permitida', { status: 403 });
  }

  try {
    const upstream = await fetch(url);
    const buffer = await upstream.arrayBuffer();
    const ext = name.split('.').pop()?.toLowerCase() ?? '';
    const contentType = MIME_BY_EXT[ext]
      ?? upstream.headers.get('content-type')
      ?? 'application/octet-stream';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${name}"`,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('Erro ao buscar arquivo', { status: 502 });
  }
}
