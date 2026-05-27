export type C6Config = {
  c6BankAccessToken: string;
  c6BankPersonId: string;
  c6BankSandbox: boolean;
};

export type C6BoletoResult = {
  id: string;
  linhaDigitavel: string;
  codigoBarra: string;
  boletoUrl?: string;
};

export async function emitirBoleto(
  titulo: {
    id: string;
    sacadoNome: string;
    sacadoCpfCnpj: string;
    valor: number;
    dataVencimento: string; // ISO date string
  },
  config: C6Config,
): Promise<C6BoletoResult> {
  const baseUrl = config.c6BankSandbox
    ? 'https://baas-api-sandbox.c6bank.info'
    : 'https://baas-api.c6bank.info';

  const taxId = titulo.sacadoCpfCnpj.replace(/\D/g, '');
  const dueDate = new Date(titulo.dataVencimento).toISOString().split('T')[0];

  const body = {
    external_reference_id: titulo.id,
    amount: titulo.valor,
    due_date: dueDate,
    payer: {
      name: titulo.sacadoNome,
      tax_id: taxId,
      email: '',
      address: { street: '', number: 0, complement: '', city: '', state: '', zip_code: '' },
    },
    instructions: [
      'Após o vencimento, sujeito a multa de 2% e juros de 1% ao mês.',
      'Não receber após 30 dias do vencimento.',
    ],
    interest: { type: 'P', value: 1.0, dead_line: 0 },
    fine: { type: 'P', value: 2.0, dead_line: 0 },
  };

  const res = await fetch(`${baseUrl}/v1/bank_slips`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.c6BankAccessToken}`,
      person_Id: config.c6BankPersonId,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`C6 Bank API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return {
    id: data.id ?? data.bank_slip_id ?? '',
    linhaDigitavel: data.digitable_line ?? data.linha_digitavel ?? data.linhaDigitavel ?? '',
    codigoBarra: data.bar_code ?? data.barcode ?? data.codigoBarra ?? '',
    boletoUrl: data.url ?? data.boleto_url ?? undefined,
  };
}

export async function cancelarBoleto(boletoId: string, config: C6Config): Promise<void> {
  const baseUrl = config.c6BankSandbox
    ? 'https://baas-api-sandbox.c6bank.info'
    : 'https://baas-api.c6bank.info';

  const res = await fetch(`${baseUrl}/v1/bank_slips/${boletoId}/cancel`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.c6BankAccessToken}`,
      person_Id: config.c6BankPersonId,
    },
  });

  if (!res.ok) {
    const err = await res.text().catch(() => res.statusText);
    throw new Error(`C6 Bank cancel error ${res.status}: ${err}`);
  }
}
