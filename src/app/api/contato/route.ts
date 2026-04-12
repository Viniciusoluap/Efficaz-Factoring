import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const EMAIL_DESTINO = 'contato@grupoefficaz.com.br';

function criarTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function htmlEmail(dados: {
  name: string;
  company: string;
  email: string;
  phone: string;
  companyType: string;
  service: string;
  message: string;
}) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Nova solicitação – Efficaz Factoring</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#1e3a8a);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Efficaz <span style="font-weight:300;color:#fbbf24;">Factoring</span>
              </p>
              <p style="margin:8px 0 0;font-size:13px;color:rgba(255,255,255,0.7);">
                Nova solicitação de análise recebida
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
                Uma nova solicitação foi enviada pelo site. Confira os dados abaixo e entre em contato o quanto antes.
              </p>

              <!-- Dados -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr style="background:#f8fafc;">
                  <td colspan="2" style="padding:12px 20px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e5e7eb;">
                    Dados do solicitante
                  </td>
                </tr>
                ${[
                  ['Nome', dados.name],
                  ['Empresa', dados.company],
                  ['E-mail', dados.email],
                  ['Telefone / WhatsApp', dados.phone],
                  ['Porte da empresa', dados.companyType || '—'],
                  ['Serviço de interesse', dados.service || '—'],
                ]
                  .map(
                    ([label, value], i) => `
                <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f9fafb'};">
                  <td style="padding:12px 20px;font-size:13px;font-weight:600;color:#374151;width:40%;border-bottom:1px solid #f3f4f6;">${label}</td>
                  <td style="padding:12px 20px;font-size:13px;color:#4b5563;border-bottom:1px solid #f3f4f6;">${value}</td>
                </tr>`
                  )
                  .join('')}
              </table>

              ${
                dados.message
                  ? `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
                <tr style="background:#f8fafc;">
                  <td style="padding:12px 20px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.8px;border-bottom:1px solid #e5e7eb;">
                    Mensagem
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 20px;font-size:14px;color:#374151;line-height:1.7;">${dados.message.replace(/\n/g, '<br/>')}</td>
                </tr>
              </table>`
                  : ''
              }

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 0;">
                    <a href="mailto:${dados.email}"
                       style="display:inline-block;background:#f59e0b;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:10px;">
                      Responder ao solicitante
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Este e-mail foi gerado automaticamente pelo formulário do site da Efficaz Factoring.<br/>
                © ${new Date().getFullYear()} Efficaz Factoring — contato@grupoefficaz.com.br
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function htmlConfirmacao(nome: string) {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Solicitação recebida – Efficaz Factoring</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#1e3a8a);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">
                Efficaz <span style="font-weight:300;color:#fbbf24;">Factoring</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;text-align:center;">
              <div style="width:64px;height:64px;background:#dcfce7;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:32px;">✓</span>
              </div>
              <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#111827;">
                Solicitação recebida, ${nome}!
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.7;max-width:420px;margin-left:auto;margin-right:auto;">
                Recebemos sua solicitação com sucesso. Nossa equipe de especialistas entrará em contato em até <strong style="color:#1d4ed8;">24 horas úteis</strong>.
              </p>
              <a href="https://wa.me/5511990000000?text=Ol%C3%A1%21%20Acabei%20de%20enviar%20uma%20solicita%C3%A7%C3%A3o%20pelo%20site."
                 style="display:inline-block;background:#22c55e;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;">
                Prefere falar agora? WhatsApp
              </a>
            </td>
          </tr>

          <tr>
            <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                © ${new Date().getFullYear()} Efficaz Factoring — contato@grupoefficaz.com.br
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, company, email, phone, companyType, service, message } = body;

    if (!name || !company || !email || !phone) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes.' },
        { status: 400 }
      );
    }

    const transporter = criarTransporter();

    // E-mail para a equipe Efficaz
    await transporter.sendMail({
      from: `"Site Efficaz Factoring" <${process.env.SMTP_USER}>`,
      to: EMAIL_DESTINO,
      replyTo: email,
      subject: `Nova solicitação de análise – ${company}`,
      html: htmlEmail({ name, company, email, phone, companyType, service, message }),
    });

    // E-mail de confirmação para o solicitante
    await transporter.sendMail({
      from: `"Efficaz Factoring" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recebemos sua solicitação – Efficaz Factoring',
      html: htmlConfirmacao(name),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API /contato] Erro ao enviar e-mail:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar e-mail. Tente novamente.' },
      { status: 500 }
    );
  }
}
