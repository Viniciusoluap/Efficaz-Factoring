/**
 * Integração WhatsApp via Z-API (zapi.io)
 *
 * Configuração necessária (.env):
 *   ZAPI_INSTANCE_ID=sua_instance_id
 *   ZAPI_TOKEN=seu_token
 *   ZAPI_CLIENT_TOKEN=seu_client_token
 *
 * Como obter:
 * 1. Acesse zapi.io e crie uma conta
 * 2. Crie uma instância e conecte seu WhatsApp via QR Code
 * 3. Copie os valores de Instance ID, Token e Client-Token
 */

const ZAPI_BASE = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE_ID}/token/${process.env.ZAPI_TOKEN}`;

export interface MensagemWhatsApp {
  telefone: string;   // formato: 5511999999999 (sem + e sem espaços)
  mensagem: string;
}

/**
 * Envia uma mensagem de texto simples via WhatsApp
 */
export async function enviarWhatsApp(msg: MensagemWhatsApp): Promise<boolean> {
  if (!process.env.ZAPI_INSTANCE_ID || !process.env.ZAPI_TOKEN) {
    console.warn('[WhatsApp] Variáveis ZAPI não configuradas. Mensagem não enviada.');
    return false;
  }

  try {
    const res = await fetch(`${ZAPI_BASE}/send-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Token': process.env.ZAPI_CLIENT_TOKEN ?? '',
      },
      body: JSON.stringify({
        phone: msg.telefone,
        message: msg.mensagem,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[WhatsApp] Erro Z-API:', err);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[WhatsApp] Falha na requisição:', err);
    return false;
  }
}

/**
 * Formata telefone brasileiro para o padrão Z-API (55 + DDD + número)
 * Ex: "(11) 99999-9999" → "5511999999999"
 */
export function formatarTelefone(tel: string): string {
  const apenas = tel.replace(/\D/g, '');
  // Se já começa com 55 e tem 13 dígitos, retorna como está
  if (apenas.startsWith('55') && apenas.length >= 12) return apenas;
  // Se tem 11 dígitos (com DDD), adiciona 55
  if (apenas.length === 11) return `55${apenas}`;
  // Se tem 10 dígitos (sem o 9), adiciona 55
  if (apenas.length === 10) return `55${apenas}`;
  return `55${apenas}`;
}

/**
 * Monta a mensagem de aviso de vencimento
 */
export function montarMensagemVencimento(params: {
  nomeCliente: string;
  numeroTitulo: string;
  tipoTitulo: string;
  valorTitulo: number;
  dataVencimento: string;
  gatilho: string;
}): string {
  const { nomeCliente, numeroTitulo, tipoTitulo, valorTitulo, dataVencimento, gatilho } = params;

  const valor = valorTitulo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const gatilhoTexto: Record<string, string> = {
    D_MENOS_3: 'vence em *3 dias*',
    D_MENOS_1: 'vence *amanhã*',
    D_0: 'vence *hoje*',
    D_MAIS_1: 'venceu *ontem*',
    D_MAIS_3: 'está vencido há *3 dias*',
    D_MAIS_5: 'está vencido há *5 dias*',
  };

  const quando = gatilhoTexto[gatilho] ?? 'tem vencimento próximo';

  return `🔔 *Efficaz Factoring — Aviso de Vencimento*

Olá, *${nomeCliente}*!

O seu ${tipoTitulo.toLowerCase()} de nº *${numeroTitulo}* ${quando}.

💰 *Valor:* ${valor}
📅 *Vencimento:* ${dataVencimento}

Para mais informações, entre em contato:
📧 contato@grupoefficaz.com.br
📞 (11) 3000-0000

_Efficaz Factoring — Soluções financeiras ágeis_`;
}
