'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { CheckSquare, Square, FileText, Mail, Download, Loader2, X, Send } from 'lucide-react';
import { formatarMoeda, formatarCpfCnpj } from '@/lib/calculos';
import { gerarDocumentosTitulosPDF, TituloDocumentoItem } from '@/lib/pdf';
import AlterarStatusBtn from './AlterarStatusBtn';
import TituloNaOperacaoAcoes from './TituloNaOperacaoAcoes';
import Link from 'next/link';
import { Plus } from 'lucide-react';

const statusLabel: Record<string, string> = {
  PENDENTE: 'Pendente', APROVADO: 'Aprovado', VENCIDO: 'Vencido',
  LIQUIDADO: 'Pago', PROTESTADO: 'Protestado', CANCELADO: 'Cancelado',
};
const statusCor: Record<string, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  APROVADO: 'bg-green-100 text-green-700 border-green-200',
  VENCIDO: 'bg-red-100 text-red-700 border-red-200',
  LIQUIDADO: 'bg-blue-100 text-blue-700 border-blue-200',
  PROTESTADO: 'bg-purple-100 text-purple-700 border-purple-200',
  CANCELADO: 'bg-gray-100 text-gray-500 border-gray-200',
};
const tipoLabel: Record<string, string> = {
  CHEQUE: 'Cheque', BOLETO: 'Boleto', PROMISSORIA: 'Promissória',
};
const tipoCor: Record<string, string> = {
  CHEQUE: 'bg-indigo-50 text-indigo-600',
  BOLETO: 'bg-cyan-50 text-cyan-600',
  PROMISSORIA: 'bg-rose-50 text-rose-600',
};

export type TituloTabela = TituloDocumentoItem & {
  status: string;
  sacadoCpfCnpj: string;
  spreadBruto: number;
  linhaDigitavel?: string | null;
};

type Totais = {
  valor: number;
  encargo: number;
  liquidoCliente: number;
  spreadBruto: number;
};

type Props = {
  titulos: TituloTabela[];
  totais: Totais;
  operacaoId: string;
  operacaoNumero: string;
  clienteNome?: string;
  clienteCpfCnpj?: string;
  clienteRepresentanteNome?: string;
  clienteRepresentanteCpf?: string;
  isPaga?: boolean;
  c6BankConfigurado?: boolean;
};

export default function TitulosSelecionaveis({ titulos, totais, operacaoId, operacaoNumero, clienteNome, clienteCpfCnpj, clienteRepresentanteNome, clienteRepresentanteCpf, isPaga, c6BankConfigurado }: Props) {
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [mostrarEmail, setMostrarEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState<{ tipo: 'ok' | 'erro'; msg: string } | null>(null);

  const todos = titulos.length > 0 && selecionados.size === titulos.length;
  const algum = selecionados.size > 0;

  const toggleTudo = () => {
    if (todos) {
      setSelecionados(new Set());
    } else {
      setSelecionados(new Set(titulos.map(t => t.id)));
    }
  };

  const toggleTitulo = (id: string) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const getTitulosSelecionados = (): TituloDocumentoItem[] =>
    titulos
      .filter(t => selecionados.has(t.id))
      .map(t => ({
        id: t.id,
        numero: t.numero,
        tipo: t.tipo,
        sacadoNome: t.sacadoNome,
        sacadoCpfCnpj: t.sacadoCpfCnpj,
        emitenteNome: t.emitenteNome,
        emitenteCpfCnpj: t.emitenteCpfCnpj,
        dataVencimento: t.dataVencimento,
        dataEmissao: t.dataEmissao,
        prazo: t.prazo,
        valor: t.valor,
        encargo: t.encargo,
        valorLiquidoCliente: t.valorLiquidoCliente,
        linhaDigitavel: t.linhaDigitavel,
      }));

  const handleDownload = async () => {
    let sel = getTitulosSelecionados();
    if (!sel.length) return;
    setLoadingPdf(true);
    try {
      if (c6BankConfigurado) {
        const boletos = sel.filter(t => t.tipo === 'BOLETO');
        if (boletos.length > 0) {
          const res = await fetch('/api/boletos/emitir-lote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tituloIds: boletos.map(t => t.id) }),
          });
          if (res.ok) {
            const data = await res.json();
            const mapa: Record<string, string> = {};
            for (const r of (data.titulos ?? [])) mapa[r.id] = r.linhaDigitavel;
            sel = sel.map(t => t.tipo === 'BOLETO' && mapa[t.id]
              ? { ...t, linhaDigitavel: mapa[t.id] }
              : t);
          }
        }
      }
      const doc = await gerarDocumentosTitulosPDF(sel, operacaoNumero, clienteNome, clienteCpfCnpj);
      doc.save(`documentos-op-${operacaoNumero}.pdf`);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleEnviarEmail = async () => {
    if (!email) return;
    const sel = getTitulosSelecionados();
    if (!sel.length) return;
    setLoadingEmail(true);
    setFeedbackEmail(null);
    try {
      const doc = await gerarDocumentosTitulosPDF(sel, operacaoNumero, clienteNome, clienteCpfCnpj);
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      const res = await fetch('/api/titulos/emitir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pdfBase64, operacaoNumero, quantidadeTitulos: sel.length }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erro ao enviar.');
      setFeedbackEmail({ tipo: 'ok', msg: `Email enviado para ${email}!` });
      setEmail('');
      setTimeout(() => { setMostrarEmail(false); setFeedbackEmail(null); }, 3000);
    } catch (err) {
      setFeedbackEmail({ tipo: 'erro', msg: err instanceof Error ? err.message : 'Erro ao enviar email.' });
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header da tabela */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-700 text-sm">Títulos desta Operação</h3>
          {algum && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              {selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {!isPaga && (
          <Link
            href={`/sistema/titulos/novo?operacaoId=${operacaoId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Título
          </Link>
        )}
      </div>

      {/* Barra de ações flutuante quando há selecionados */}
      {algum && (
        <div className="bg-blue-950 text-white px-4 py-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-blue-200">
            {selecionados.size} título{selecionados.size !== 1 ? 's' : ''} selecionado{selecionados.size !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <button
              onClick={handleDownload}
              disabled={loadingPdf}
              className="inline-flex items-center gap-1.5 bg-white text-blue-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-blue-50 disabled:opacity-60"
            >
              {loadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Baixar documentos
            </button>
            <button
              onClick={() => { setMostrarEmail(v => !v); setFeedbackEmail(null); }}
              className="inline-flex items-center gap-1.5 bg-amber-400 text-amber-900 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors hover:bg-amber-300"
            >
              <Mail className="w-3.5 h-3.5" />
              Enviar por email
            </button>
          </div>
          <button onClick={() => setSelecionados(new Set())} className="text-blue-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Painel de email */}
      {algum && mostrarEmail && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex flex-wrap items-center gap-3">
          <Mail className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleEnviarEmail(); }}
            placeholder="Digite o e-mail do destinatário..."
            className="flex-1 min-w-[220px] px-3 py-2 border border-blue-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 bg-white"
          />
          <button
            onClick={handleEnviarEmail}
            disabled={loadingEmail || !email}
            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl disabled:opacity-60 transition-colors"
          >
            {loadingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Enviar
          </button>
          {feedbackEmail && (
            <span className={`text-xs font-medium px-3 py-1.5 rounded-lg ${feedbackEmail.tipo === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {feedbackEmail.msg}
            </span>
          )}
        </div>
      )}

      {titulos.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum título nesta operação.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-2 py-2">
                  <button onClick={toggleTudo} className="flex items-center justify-center text-gray-400 hover:text-blue-600">
                    {todos
                      ? <CheckSquare className="w-4 h-4 text-blue-600" />
                      : <Square className="w-4 h-4" />}
                  </button>
                </th>
                {['Tipo', 'Número', 'Sacado', 'Vencimento', 'Valor', 'Encargo', 'Líquido', 'Spread', 'Status', ''].map(h => (
                  <th key={h} className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {titulos.map((t) => {
                const sel = selecionados.has(t.id);
                return (
                  <tr key={t.id} className={`transition-colors ${sel ? 'bg-blue-50/60' : 'hover:bg-gray-50/50'}`}>
                    <td className="px-2 py-2">
                      <button onClick={() => toggleTitulo(t.id)} className="flex items-center justify-center text-gray-300 hover:text-blue-600">
                        {sel
                          ? <CheckSquare className="w-4 h-4 text-blue-600" />
                          : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-2 py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-lg font-medium ${tipoCor[t.tipo]}`}>
                        {tipoLabel[t.tipo]}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-mono text-xs text-gray-600 whitespace-nowrap">{t.numero}</td>
                    <td className="px-2 py-2 max-w-[140px]">
                      <p className="font-medium text-gray-700 text-xs truncate">{t.sacadoNome}</p>
                      <p className="text-gray-400 text-xs truncate">{formatarCpfCnpj(t.sacadoCpfCnpj)}</p>
                    </td>
                    <td className="px-2 py-2 text-gray-600 text-xs whitespace-nowrap">
                      {t.dataVencimento}
                      <p className="text-gray-400">{t.prazo}d</p>
                    </td>
                    <td className="px-2 py-2 font-semibold text-gray-800 text-xs whitespace-nowrap">
                      {formatarMoeda(t.valor)}
                    </td>
                    <td className="px-2 py-2 text-amber-600 font-medium text-xs whitespace-nowrap">
                      {formatarMoeda(t.encargo)}
                    </td>
                    <td className="px-2 py-2 text-blue-600 font-medium text-xs whitespace-nowrap">
                      {formatarMoeda(t.valorLiquidoCliente)}
                    </td>
                    <td className="px-2 py-2 text-green-600 font-medium text-xs whitespace-nowrap">
                      {formatarMoeda(t.spreadBruto)}
                    </td>
                    <td className="px-2 py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${statusCor[t.status]}`}>
                        {statusLabel[t.status]}
                      </span>
                      <div className="mt-1">
                        <AlterarStatusBtn tituloId={t.id} statusAtual={t.status as any} />
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <TituloNaOperacaoAcoes tituloId={t.id} operacaoPaga={isPaga} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 font-semibold">
                <td className="px-2 py-2" />
                <td colSpan={3} className="px-2 py-2 text-xs text-gray-500 uppercase tracking-wide">Total</td>
                <td className="px-2 py-2 text-xs text-gray-800 font-bold whitespace-nowrap">{formatarMoeda(totais.valor)}</td>
                <td className="px-2 py-2 text-xs text-amber-600 font-bold whitespace-nowrap">{formatarMoeda(totais.encargo)}</td>
                <td className="px-2 py-2 text-xs text-blue-600 font-bold whitespace-nowrap">{formatarMoeda(totais.liquidoCliente)}</td>
                <td className="px-2 py-2 text-xs text-green-600 font-bold whitespace-nowrap">{formatarMoeda(totais.spreadBruto)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
