'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, X, Loader2, Download } from 'lucide-react';
import { calcularDataD2 } from '@/lib/calculos';
import { differenceInDays, format, addDays } from 'date-fns';
import { formatarMoeda } from '@/lib/calculos';

type Props = {
  tituloId: string;
  tituloNumero: string;
  tituloTipo: string;
  valor: number;
  taxaClienteAtual: number;
  taxaFornecedorAtual: number;
  dataVencimentoAtual: string; // dd/MM/yyyy
  dataVencimentoISO: string;   // yyyy-MM-dd
  emitenteNome: string;
  emitenteCpfCnpj: string;
  sacadoNome: string;
  sacadoCpfCnpj: string;
  clienteNome?: string;
  clienteRepresentanteNome?: string;
  clienteRepresentanteCpf?: string;
};

function calcEncargo(valor: number, taxa: number, dataVencAnterior: Date, dataVencNova: Date): number {
  const dataD2 = calcularDataD2(dataVencNova);
  const prazo = differenceInDays(dataD2, dataVencAnterior);
  let encargo = ((valor * (taxa / 100)) / 30) * prazo;
  if (encargo < 50) encargo = 50;
  return Math.round(encargo * 100) / 100;
}

export default function ProrrogarBtn(props: Props) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [novaData, setNovaData] = useState('');
  const [taxa, setTaxa] = useState(String(props.taxaClienteAtual));
  const [taxaFornecedor, setTaxaFornecedor] = useState(String(props.taxaFornecedorAtual));
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [resultado, setResultado] = useState<{ encargoProrrogacao: number } | null>(null);

  const dataMin = format(addDays(new Date(props.dataVencimentoISO + 'T00:00:00'), 1), 'yyyy-MM-dd');

  const taxaNum = parseFloat(taxa) || props.taxaClienteAtual;
  const taxaFornecedorNum = parseFloat(taxaFornecedor) || 0;
  const taxaEmpresaNum = Math.max(0, taxaNum - taxaFornecedorNum);

  const encargoPrev = novaData && taxa
    ? calcEncargo(
        props.valor,
        taxaNum,
        new Date(props.dataVencimentoISO + 'T00:00:00'),
        new Date(novaData + 'T00:00:00'),
      )
    : null;

  const custoCedentePrev = encargoPrev !== null && novaData
    ? (() => {
        const d2 = calcularDataD2(new Date(novaData + 'T00:00:00'));
        const prazo = differenceInDays(d2, new Date(props.dataVencimentoISO + 'T00:00:00'));
        return Math.round(((props.valor * (taxaFornecedorNum / 100)) / 30) * prazo * 100) / 100;
      })()
    : null;

  const spreadPrev = encargoPrev !== null && custoCedentePrev !== null
    ? Math.round((encargoPrev - custoCedentePrev) * 100) / 100
    : null;

  const handleConfirmar = async () => {
    if (!novaData || !taxa) { setErro('Preencha todos os campos.'); return; }
    setLoading(true); setErro('');
    try {
      const res = await fetch(`/api/titulos/${props.tituloId}/prorrogar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novaData,
          taxaCliente: parseFloat(taxa),
          taxaFornecedor: taxaFornecedorNum,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao prorrogar.');
      const data = await res.json();
      setResultado(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro.');
    } finally { setLoading(false); }
  };

  const handlePDF = async () => {
    const { gerarContratoProrrogacaoPDF } = await import('@/lib/pdf');
    const cfg = await fetch('/api/configuracoes').then(r => r.json()).catch(() => null);
    await gerarContratoProrrogacaoPDF({
      tituloNumero: props.tituloNumero,
      tituloTipo: props.tituloTipo,
      emitenteNome: props.emitenteNome,
      emitenteCpfCnpj: props.emitenteCpfCnpj,
      sacadoNome: props.sacadoNome,
      sacadoCpfCnpj: props.sacadoCpfCnpj,
      dataVencAnterior: props.dataVencimentoAtual,
      dataVencNova: format(new Date(novaData + 'T00:00:00'), 'dd/MM/yyyy'),
      taxaCliente: parseFloat(taxa),
      encargoProrrogacao: resultado!.encargoProrrogacao,
      clienteNome: props.clienteNome,
      clienteRepresentanteNome: props.clienteRepresentanteNome,
      clienteRepresentanteCpf: props.clienteRepresentanteCpf,
    }, cfg ?? undefined);
  };

  const handleFechar = () => {
    if (resultado) router.refresh();
    setAberto(false);
    setResultado(null);
    setNovaData('');
    setTaxa(String(props.taxaClienteAtual));
    setTaxaFornecedor(String(props.taxaFornecedorAtual));
    setErro('');
  };

  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 bg-gray-50 focus:bg-white transition-all';

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors shadow-sm"
      >
        <CalendarDays className="w-3.5 h-3.5" />
        Prorrogar
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Prorrogar Título nº {props.tituloNumero}</h3>
              <button onClick={handleFechar} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {!resultado ? (
                <>
                  <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium">Valor:</span> {formatarMoeda(props.valor)}</p>
                    <p><span className="font-medium">Vencimento atual:</span> {props.dataVencimentoAtual}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nova Data de Vencimento *</label>
                    <input type="date" className={inputCls} min={dataMin} value={novaData}
                      onChange={e => setNovaData(e.target.value)} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Taxa Cliente (% a.m.) *</label>
                      <input type="number" step="0.01" min="0.01" className={inputCls} value={taxa}
                        onChange={e => setTaxa(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Repasse Fornecedor (%)</label>
                      <input type="number" step="0.01" min="0" className={inputCls} value={taxaFornecedor}
                        onChange={e => setTaxaFornecedor(e.target.value)} />
                    </div>
                  </div>

                  {encargoPrev !== null && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-amber-700 font-medium">Encargo de prorrogação</span>
                        <span className="text-sm font-bold text-amber-800">{formatarMoeda(encargoPrev)}</span>
                      </div>
                      {taxaFornecedorNum > 0 && custoCedentePrev !== null && (
                        <>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>Custo cedente ({taxaFornecedorNum.toFixed(2)}% forn.)</span>
                            <span className="text-blue-600">− {formatarMoeda(custoCedentePrev)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-semibold border-t border-amber-200 pt-1.5">
                            <span className="text-amber-700">Spread Efficaz ({taxaEmpresaNum.toFixed(2)}%)</span>
                            <span className="text-green-700">{formatarMoeda(spreadPrev ?? 0)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {erro && (
                    <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{erro}</p>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={handleConfirmar} disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60 text-sm">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
                      {loading ? 'Processando...' : 'Confirmar Prorrogação'}
                    </button>
                    <button onClick={handleFechar} className="px-4 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium">
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-4 text-center space-y-2">
                    <p className="text-green-700 font-semibold">Prorrogação realizada com sucesso!</p>
                    <p className="text-sm text-green-600">
                      Novo vencimento: <strong>{format(new Date(novaData + 'T00:00:00'), 'dd/MM/yyyy')}</strong>
                    </p>
                    <p className="text-sm text-green-600">
                      Encargo: <strong>{formatarMoeda(resultado.encargoProrrogacao)}</strong>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handlePDF}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm">
                      <Download className="w-4 h-4" /> Contrato PDF
                    </button>
                    <button onClick={handleFechar}
                      className="flex-1 px-4 py-2.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium">
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
