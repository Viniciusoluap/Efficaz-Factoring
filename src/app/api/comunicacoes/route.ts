import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function criarTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const gatilhoLabel: Record<string, string> = {
  D_MENOS_3: '3 dias antes do vencimento',
  D_MENOS_1: '1 dia antes do vencimento',
  D_0: 'no dia do vencimento',
  D_MAIS_1: '1 dia após o vencimento',
  D_MAIS_3: '3 dias após o vencimento',
  D_MAIS_5: '5 dias após o vencimento',
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { tituloIds, gatilho } = await req.json();
  if (!tituloIds?.length || !gatilho) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
  }

  const titulos = await prisma.titulo.findMany({
    where: { id: { in: tituloIds } },
    include: { cliente: true },
  });

  const transporter = criarTransporter();
  const resultados: string[] = [];

  for (const titulo of titulos) {
    const emailDestino = titulo.cliente?.email;
    if (!emailDestino) continue;

    const vencimento = format(new Date(titulo.dataVencimento), "dd/MM/yyyy", { locale: ptBR });
    const desc = gatilhoLabel[gatilho] ?? gatilho;

    try {
      await transporter.sendMail({
        from: `"Efficaz Factoring" <${process.env.SMTP_USER}>`,
        to: emailDestino,
        subject: `[Efficaz Factoring] Aviso de vencimento — Título ${titulo.numero}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
            <h2 style="color:#1e3a8a;">Aviso de Vencimento</h2>
            <p>Olá, <strong>${titulo.cliente?.nome ?? 'Cliente'}</strong>.</p>
            <p>Este é um aviso automático sobre o título <strong>${titulo.numero}</strong>,
            que vence <strong>${desc}</strong> (${vencimento}).</p>
            <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin:16px 0;">
              <p style="margin:4px 0;"><strong>Tipo:</strong> ${titulo.tipo}</p>
              <p style="margin:4px 0;"><strong>Número:</strong> ${titulo.numero}</p>
              <p style="margin:4px 0;"><strong>Valor:</strong> R$ ${Number(titulo.valor).toFixed(2).replace('.', ',')}</p>
              <p style="margin:4px 0;"><strong>Vencimento:</strong> ${vencimento}</p>
            </div>
            <p>Em caso de dúvidas, entre em contato: <a href="mailto:contato@grupoefficaz.com.br">contato@grupoefficaz.com.br</a></p>
            <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;"/>
            <p style="color:#9ca3af;font-size:12px;">© ${new Date().getFullYear()} Efficaz Factoring</p>
          </div>
        `,
      });

      await prisma.comunicacao.create({
        data: {
          tituloId: titulo.id,
          tipo: 'EMAIL',
          gatilho: gatilho as any,
          enviadoEm: new Date(),
          status: 'ENVIADO',
        },
      });
      resultados.push(titulo.id);
    } catch (err: any) {
      await prisma.comunicacao.create({
        data: {
          tituloId: titulo.id,
          tipo: 'EMAIL',
          gatilho: gatilho as any,
          status: 'ERRO',
          erro: err.message,
        },
      });
    }
  }

  return NextResponse.json({ enviados: resultados.length, total: titulos.length });
}
