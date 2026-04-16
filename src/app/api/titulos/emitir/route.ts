import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import nodemailer from 'nodemailer';

function criarTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { email, pdfBase64, operacaoNumero, quantidadeTitulos } = await req.json();

  if (!email || !pdfBase64) {
    return NextResponse.json({ error: 'Email e PDF são obrigatórios.' }, { status: 400 });
  }

  try {
    const transporter = criarTransporter();
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    await transporter.sendMail({
      from: `"Efficaz Factoring" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Documentos da Operação ${operacaoNumero} — Efficaz Factoring`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0f172a; padding: 24px; border-radius: 8px 8px 0 0;">
            <h1 style="color: #fff; font-size: 20px; margin: 0;">Efficaz Factoring</h1>
            <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0;">Documentos de cobrança</p>
          </div>
          <div style="background: #f8fafc; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e2e8f0;">
            <p style="color: #334155; font-size: 14px;">Prezado(a),</p>
            <p style="color: #334155; font-size: 14px;">
              Segue em anexo o(s) documento(s) referente(s) à <strong>Operação ${operacaoNumero}</strong>,
              totalizando <strong>${quantidadeTitulos} título(s)</strong>.
            </p>
            <p style="color: #334155; font-size: 14px;">
              Em caso de dúvidas, entre em contato conosco pelo e-mail
              <a href="mailto:contato@grupoefficaz.com.br" style="color: #2563eb;">contato@grupoefficaz.com.br</a>
              ou pelo telefone (99) 8139-2210.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;" />
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              EFFICAZ SERVIÇOS FINANCEIROS LTDA — CNPJ 04.578.232/0001-82<br/>
              Rua Leôncio Pires Dourado, nº 840-A, Bairro Bacuri, Imperatriz – MA
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `documentos-operacao-${operacaoNumero}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Erro ao enviar email:', err);
    return NextResponse.json({ error: 'Erro ao enviar email.' }, { status: 500 });
  }
}
