import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import nodemailer from 'nodemailer';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  enviarWhatsApp,
  formatarTelefone,
  montarMensagemVencimento,
} from '@/lib/whatsapp';

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

const tipoLabel: Record<string, string> = {
  CHEQUE: 'Cheque', BOLETO: 'Boleto', PROMISSORIA: 'Promissória',
};

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { tituloIds, gatilho, canal = 'ambos' } = await req.json();
  // canal: 'email' | 'whatsapp' | 'ambos'

  if (!tituloIds?.length || !gatilho) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 });
  }

  const titulos = await prisma.titulo.findMany({
    where: { id: { in: tituloIds } },
    include: { cliente: true },
  });

  const transporter = criarTransporter();
  const enviados: string[] = [];

  for (const titulo of titulos) {
    const cliente = titulo.cliente;
    const vencimento = format(new Date(titulo.dataVencimento), 'dd/MM/yyyy', { locale: ptBR });
    const desc = gatilhoLabel[gatilho] ?? gatilho;

    // ── E-mail ──────────────────────────────────────────
    if ((canal === 'email' || canal === 'ambos') && cliente?.email) {
      try {
        await transporter.sendMail({
          from: `"Efficaz Factoring" <${process.env.SMTP_USER}>`,
          to: cliente.email,
          subject: `[Efficaz Factoring] Aviso de vencimento — Título ${titulo.numero}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <div style="background:linear-gradient(135deg,#1d4ed8,#1e3a8a);border-radius:16px 16px 0 0;padding:24px;text-align:center;">
                <h1 style="color:#fff;margin:0;font-size:20px;">Efficaz <span style="font-weight:300;color:#fbbf24;">Factoring</span></h1>
              </div>
              <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 16px 16px;padding:24px;">
                <h2 style="color:#1e3a8a;font-size:16px;">⚠️ Aviso de Vencimento</h2>
                <p>Olá, <strong>${cliente.nome}</strong>.</p>
                <p>O título abaixo vence <strong>${desc}</strong>:</p>
                <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
                  <tr style="background:#f8fafc;">
                    <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:600;">Tipo</td>
                    <td style="padding:10px 14px;border:1px solid #e5e7eb;">${tipoLabel[titulo.tipo] ?? titulo.tipo}</td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:600;">Número</td>
                    <td style="padding:10px 14px;border:1px solid #e5e7eb;">${titulo.numero}</td>
                  </tr>
                  <tr style="background:#f8fafc;">
                    <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:600;">Valor</td>
                    <td style="padding:10px 14px;border:1px solid #e5e7eb;color:#1d4ed8;font-weight:700;">
                      R$ ${Number(titulo.valor).toFixed(2).replace('.', ',')}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:10px 14px;border:1px solid #e5e7eb;font-weight:600;">Vencimento</td>
                    <td style="padding:10px 14px;border:1px solid #e5e7eb;">${vencimento}</td>
                  </tr>
                </table>
                <p style="color:#6b7280;font-size:13px;">
                  Dúvidas? <a href="mailto:contato@grupoefficaz.com.br" style="color:#1d4ed8;">contato@grupoefficaz.com.br</a>
                </p>
              </div>
              <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:12px;">
                © ${new Date().getFullYear()} Efficaz Factoring
              </p>
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
        enviados.push(`${titulo.id}:email`);
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

    // ── WhatsApp ─────────────────────────────────────────
    if ((canal === 'whatsapp' || canal === 'ambos') && cliente?.telefone) {
      try {
        const telefoneFormatado = formatarTelefone(cliente.telefone);
        const mensagem = montarMensagemVencimento({
          nomeCliente: cliente.nome,
          numeroTitulo: titulo.numero,
          tipoTitulo: tipoLabel[titulo.tipo] ?? titulo.tipo,
          valorTitulo: Number(titulo.valor),
          dataVencimento: vencimento,
          gatilho,
        });

        const ok = await enviarWhatsApp({ telefone: telefoneFormatado, mensagem });

        await prisma.comunicacao.create({
          data: {
            tituloId: titulo.id,
            tipo: 'WHATSAPP',
            gatilho: gatilho as any,
            enviadoEm: ok ? new Date() : undefined,
            status: ok ? 'ENVIADO' : 'ERRO',
            erro: ok ? null : 'Falha Z-API ou instância não configurada',
          },
        });

        if (ok) enviados.push(`${titulo.id}:whatsapp`);
      } catch (err: any) {
        await prisma.comunicacao.create({
          data: {
            tituloId: titulo.id,
            tipo: 'WHATSAPP',
            gatilho: gatilho as any,
            status: 'ERRO',
            erro: err.message,
          },
        });
      }
    }
  }

  return NextResponse.json({
    enviados: enviados.length,
    total: titulos.length,
    detalhes: enviados,
  });
}
