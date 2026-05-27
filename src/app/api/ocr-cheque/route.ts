import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export const runtime = 'nodejs';
export const maxDuration = 60; // Vercel: aumenta timeout de 10s para 60s

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY não configurada no Vercel.' }, { status: 500 });
    }

    const body = await req.json();
    const { imageBase64, mediaType = 'image/jpeg' } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Imagem não fornecida.' }, { status: 400 });
    }

    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as any,
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Analise esta imagem de cheque brasileiro e extraia os dados. Responda SOMENTE em JSON válido com este formato exato (use null para campos não encontrados):
{
  "numero": "número do cheque (6 dígitos)",
  "valor": "valor numérico apenas, ex: 6000.00",
  "vencimento": "data no formato DD/MM/AAAA",
  "cnpjCpf": "CNPJ ou CPF do emitente com formatação",
  "nomeEmitente": "nome ou razão social do emitente",
  "banco": "nome do banco"
}`,
            },
          ],
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Não foi possível extrair dados do cheque.' }, { status: 422 });
    }

    const dados = JSON.parse(jsonMatch[0]);
    return NextResponse.json(dados);
  } catch (err: any) {
    console.error('[OCR cheque]', err);
    const msg = err?.message ?? err?.error?.message ?? 'Erro ao processar imagem.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
