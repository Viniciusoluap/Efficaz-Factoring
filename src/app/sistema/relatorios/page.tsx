'use client';

import { useEffect, useState, useCallback } from 'react';
import { formatarMoeda } from '@/lib/calculos';
import { BarChart3, FileDown, Filter, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const ANOS = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

type Dados = {
  totaisGeral: any;
  totaisPeriodo: any;
  porTipo: any[];
  titulos: any[];
  clientes: { id: string; nome: string }[];
  fornecedores: { id: string; nome: string }[];
  mes: number;
  ano: number;
};

export default function RelatoriosPage() {
  const hoje = new Date();
  const [mes, setMes] = useState(hoje.getMonth() + 1);
  const [ano, setAno] = useState(hoje.getFullYear());
  const [clienteId, setClienteId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [dados, setDados] = useState<Dados | null>(null);
  const [loading, setLoading] = useState(true);
  const [gerando, setGerando] = useState(false);

  const carregar = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ mes: String(mes), ano: String(ano) });
    if (clienteId) params.set('clienteId', clienteId);
    if (fornecedorId) params.set('fornecedorId', fornecedorId);
    fetch(`/api/relatorios?${params}`)
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [mes, ano, clienteId, fornecedorId]);

  useEffect(() => { carregar(); }, [carregar]);

  const gerarPDF = async () => {
    if (!dados) return;
    setGerando(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const periodoLabel = `${MESES[mes - 1]} de ${ano}`;
      const clienteNome = dados.clientes.find(c => c.id === clienteId)?.nome ?? 'Todos';
      const fornecedorNome = dados.fornecedores.find(f => f.id === fornecedorId)?.nome ?? 'Todos';

      // Header
      doc.setFillColor(29, 78, 216);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('EFFICAZ FACTORING', 14, 13);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Relatório Financeiro — ${periodoLabel}`, 14, 22);
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 140, 22);

      // Filtros
      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.text(`Cliente: ${clienteNome}   |   Fornecedor: ${fornecedorNome}`, 14, 37);

      // Resumo do período
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text(`Resumo — ${periodoLabel}`, 14, 46);

      const tp = dados.totaisPeriodo;
      autoTable(doc, {
        startY: 50,
        head: [['Indicador', 'Valor']],
        body: [
          ['Títulos no período', String(tp._count?.id ?? 0)],
          ['Volume', formatarMoeda(Number(tp._sum?.valor ?? 0))],
          ['Encargos', formatarMoeda(Number(tp._sum?.encargo ?? 0))],
          ['Spread Bruto', formatarMoeda(Number(tp._sum?.spreadBruto ?? 0))],
          ['Imposto Provisório', formatarMoeda(Number(tp._sum?.impostoProvisao ?? 0))],
          ['Spread Líquido', formatarMoeda(Number(tp._sum?.spreadLiquido ?? 0))],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [29, 78, 216] },
        alternateRowStyles: { fillColor: [245, 247, 255] },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });

      // Totais gerais
      const yGeral = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Totais Gerais (acumulado)', 14, yGeral);

      const tg = dados.totaisGeral;
      autoTable(doc, {
        startY: yGeral + 4,
        head: [['Indicador', 'Valor']],
        body: [
          ['Total de Títulos', String(tg._count?.id ?? 0)],
          ['Volume Total', formatarMoeda(Number(tg._sum?.valor ?? 0))],
          ['Spread Bruto Total', formatarMoeda(Number(tg._sum?.spreadBruto ?? 0))],
          ['Spread Líquido Total', formatarMoeda(Number(tg._sum?.spreadLiquido ?? 0))],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [88, 28, 135] },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });

      // Títulos do período
      if (dados.titulos.length > 0) {
        const yTitulos = (doc as any).lastAutoTable.finalY + 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(`Títulos do Período (${dados.titulos.length})`, 14, yTitulos);

        autoTable(doc, {
          startY: yTitulos + 4,
          head: [['Nº / Emitente', 'Tipo', 'Vencimento', 'Valor', 'Encargo', 'Spread Líq.', 'Status']],
          body: dados.titulos.map(t => [
            t.numero,
            t.tipo,
            format(new Date(t.dataVencimento), 'dd/MM/yyyy'),
            formatarMoeda(Number(t.valor)),
            formatarMoeda(Number(t.encargo)),
            formatarMoeda(Number(t.spreadLiquido ?? 0)),
            t.status,
          ]),
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: [15, 118, 110] },
          alternateRowStyles: { fillColor: [240, 253, 250] },
          columnStyles: {
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right' },
          },
          margin: { left: 14, right: 14 },
        });
      }

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Efficaz Factoring — CNPJ 04.578.232/0001-82`, 14, 290);
        doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: 'right' });
      }

      doc.save(`relatorio-efficaz-${ano}-${String(mes).padStart(2, '0')}.pdf`);
    } finally {
      setGerando(false);
    }
  };

  const selCls = 'px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400';

  return (
    <div className="space-y-5">
      {/* Filtros */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-gray-700 text-sm">Filtros</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Mês</label>
            <select className={`${selCls} w-full`} value={mes} onChange={e => setMes(Number(e.target.value))}>
              {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Ano</label>
            <select className={`${selCls} w-full`} value={ano} onChange={e => setAno(Number(e.target.value))}>
              {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Cliente</label>
            <select className={`${selCls} w-full`} value={clienteId} onChange={e => setClienteId(e.target.value)}>
              <option value="">Todos os clientes</option>
              {dados?.clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Fornecedor</label>
            <select className={`${selCls} w-full`} value={fornecedorId} onChange={e => setFornecedorId(e.target.value)}>
              <option value="">Todos os fornecedores</option>
              {dados?.fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <button onClick={carregar}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
          <button onClick={gerarPDF} disabled={gerando || loading || !dados}
            className="flex items-center gap-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl transition-colors disabled:opacity-60 shadow-sm">
            <FileDown className="w-4 h-4" />
            {gerando ? 'Gerando PDF...' : 'Baixar PDF'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          Carregando...
        </div>
      ) : dados ? (
        <>
          {/* Resumo geral */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total de Títulos', value: String(dados.totaisGeral._count?.id ?? 0), cor: 'text-gray-800' },
              { label: 'Volume Total', value: formatarMoeda(Number(dados.totaisGeral._sum?.valor ?? 0)), cor: 'text-blue-600' },
              { label: 'Encargos Totais', value: formatarMoeda(Number(dados.totaisGeral._sum?.encargo ?? 0)), cor: 'text-amber-600' },
              { label: 'Spread Bruto Total', value: formatarMoeda(Number(dados.totaisGeral._sum?.spreadBruto ?? 0)), cor: 'text-purple-600' },
              { label: 'Spread Líquido Total', value: formatarMoeda(Number(dados.totaisGeral._sum?.spreadLiquido ?? 0)), cor: 'text-green-600' },
            ].map(({ label, value, cor }) => (
              <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                <p className={`text-xl font-bold ${cor}`}>{value}</p>
                <p className="text-xs text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Período selecionado */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-4 capitalize">
                {MESES[mes - 1]} de {ano}
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'Títulos', value: String(dados.totaisPeriodo._count?.id ?? 0) },
                  { label: 'Volume', value: formatarMoeda(Number(dados.totaisPeriodo._sum?.valor ?? 0)) },
                  { label: 'Spread Bruto', value: formatarMoeda(Number(dados.totaisPeriodo._sum?.spreadBruto ?? 0)) },
                  { label: 'Imposto Prov.', value: formatarMoeda(Number(dados.totaisPeriodo._sum?.impostoProvisao ?? 0)) },
                  { label: 'Spread Líquido', value: formatarMoeda(Number(dados.totaisPeriodo._sum?.spreadLiquido ?? 0)) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="text-sm font-semibold text-gray-800">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Por tipo */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-700 mb-4">Volume por Tipo de Título</h3>
              {dados.porTipo.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">Sem dados no período.</p>
              ) : (
                <div className="space-y-3">
                  {dados.porTipo.map(t => {
                    const tipoLabel: Record<string, string> = { CHEQUE: 'Cheque', BOLETO: 'Boleto', PROMISSORIA: 'Promissória' };
                    const total = Number(dados.totaisPeriodo._sum?.valor ?? 1);
                    const v = Number(t._sum?.valor ?? 0);
                    const pct = total > 0 ? (v / total) * 100 : 0;
                    return (
                      <div key={t.tipo}>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>{tipoLabel[t.tipo] ?? t.tipo}</span>
                          <span>{formatarMoeda(v)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full">
                          <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Títulos do período */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Títulos — {MESES[mes - 1]} de {ano}
              <span className="ml-auto text-xs text-gray-400 font-normal">{dados.titulos.length} título{dados.titulos.length !== 1 ? 's' : ''}</span>
            </h3>
            {dados.titulos.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhum título no período com os filtros selecionados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50">
                      {['Número', 'Tipo', 'Cliente', 'Vencimento', 'Valor', 'Encargo', 'Spread Líq.', 'Status'].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {dados.titulos.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 font-mono text-gray-600">{t.numero}</td>
                        <td className="px-3 py-2.5 text-gray-600">{t.tipo}</td>
                        <td className="px-3 py-2.5 text-gray-700">{t.cliente?.nome ?? '—'}</td>
                        <td className="px-3 py-2.5 text-gray-600">{format(new Date(t.dataVencimento), 'dd/MM/yyyy')}</td>
                        <td className="px-3 py-2.5 text-blue-600 font-semibold">{formatarMoeda(Number(t.valor))}</td>
                        <td className="px-3 py-2.5 text-amber-600">{formatarMoeda(Number(t.encargo))}</td>
                        <td className="px-3 py-2.5 text-green-600 font-semibold">{formatarMoeda(Number(t.spreadLiquido ?? 0))}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            t.status === 'APROVADO' ? 'bg-green-100 text-green-700' :
                            t.status === 'PENDENTE' ? 'bg-yellow-100 text-yellow-700' :
                            t.status === 'VENCIDO' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
