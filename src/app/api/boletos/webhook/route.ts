import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    const cfgRows = await prisma.$queryRaw<any[]>`SELECT * FROM configuracoes WHERE id = 'default'`;
    const webhookSecret: string | null = cfgRows[0]?.c6BankWebhookSecret ?? null;

    if (webhookSecret) {
      const signature = req.headers.get('x-c6-signature') ?? '';
      const expected = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
      if (signature !== expected) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body);
    const externalRef: string =
      event.external_reference_id ??
      event.data?.external_reference_id ??
      '';
    const status: string =
      (event.status ?? event.data?.status ?? '').toString().toUpperCase();

    if (externalRef && ['PAID', 'LIQUIDADO', 'SETTLED'].includes(status)) {
      await (prisma as any).titulo.updateMany({
        where: { id: externalRef },
        data: { status: 'LIQUIDADO' },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[webhook/c6bank]', err);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
