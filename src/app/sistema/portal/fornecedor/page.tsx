'use client';

import { useEffect, useState } from 'react';
import { formatarMoeda, formatarCpfCnpj } from '@/lib/calculos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, Building2, FileDown } from 'lucide-react';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const hoje = new Date();
const ANOS = Array.from({ length: 8 }, (_, i) => hoje.getFullYear() - 2 + i);

const statusLabel: Record<string, { label: string; cor: string }> = {
  PENDENTE:   { label: 'Pendente',   cor: 'bg-amber-100 text-amber-700' },
  APROVADO:   { label: 'Aprovado',   cor: 'bg-green-100 text-green-700' },
  VENCIDO:    { label: 'Vencido',    cor: 'bg-red-100 text-red-700' },
  LIQUIDADO:  { label: 'Pago',       cor: 'bg-blue-100 text-blue-700' },
  PROTESTADO: { label: 'Protestado', cor: 'bg-purple-100 text-purple-700' },
  CANCELADO:  { label: 'Cancelado',  cor: 'bg-gray-100 text-gray-500' },
};

export default function FornecedorPortalPage() {
  const [dados, setDados] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [mesFiltro, setMesFiltro] = useState<number | ''>(hoje.getMonth() + 1);
  const [anoFiltro, setAnoFiltro] = useState<number | ''>(hoje.getFullYear());
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    fetch('/api/portal/fornecedor')
      .then(r => r.json())
      .then(d => { setDados(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-gray-400">Carregando...</div>;
  if (!dados?.fornecedor) return <div className="p-12 text-center text-gray-400">Dados não encontrados.</div>;

  const { fornecedor, titulos } = dados;
  const capitalTotal = Number(fornecedor.capitalTotal ?? 0);
  const alocado = titulos.reduce((s: number, t: any) => s + Number(t.valor), 0);
  const rendimento = titulos.reduce((s: number, t: any) => s + Number(t.custoCedente), 0);
  const disponivel = capitalTotal - alocado;

  const titulosFiltrados = filtroStatus
    ? titulos.filter((t: any) => t.status === filtroStatus)
    : titulos;

  const pendentes = titulos.filter((t: any) => ['PENDENTE', 'APROVADO'].includes(t.status)).length;
  const vencidos = titulos.filter((t: any) => t.status === 'VENCIDO').length;
  const pagos = titulos.filter((t: any) => t.status === 'LIQUIDADO').length;

  const titulosParaPDF = titulos.filter((t: any) => {
    const d = new Date(t.dataVencimento);
    if (anoFiltro !== '' && d.getFullYear() !== Number(anoFiltro)) return false;
    if (mesFiltro !== '' && d.getMonth() + 1 !== Number(mesFiltro)) return false;
    return true;
  });

  const periodoLabel = mesFiltro && anoFiltro
    ? `${MESES[Number(mesFiltro) - 1]} de ${anoFiltro}`
    : anoFiltro
    ? `Ano de ${anoFiltro}`
    : mesFiltro
    ? `${MESES[Number(mesFiltro) - 1]} (todos os anos)`
    : 'Todo o período';

  const gerarPDF = async () => {
    setGerando(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      doc.setFillColor(88, 28, 135);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('EFFICAZ FACTORING', 14, 13);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Relatório do Fornecedor — ${periodoLabel}`, 14, 22);
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, 130, 22);

      doc.setTextColor(80, 80, 80);
      doc.setFontSize(9);
      doc.text(`Fornecedor: ${fornecedor.nome}   |   CPF/CNPJ: ${formatarCpfCnpj(fornecedor.cpfCnpj)}   |   E-mail: ${fornecedor.email}`, 14, 37);

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Resumo Financeiro', 14, 46);

      const valorPeriodo = titulosParaPDF.reduce((s: number, t: any) => s + Number(t.valor), 0);
      const rendimentoPeriodo = titulosParaPDF.reduce((s: number, t: any) => s + Number(t.custoCedente), 0);

      autoTable(doc, {
        startY: 50,
        head: [['Indicador', 'Valor']],
        body: [
          ['Capital Total', formatarMoeda(capitalTotal)],
          ['Alocado (total)', formatarMoeda(alocado)],
          ['Rendimento Total', formatarMoeda(rendimento)],
          ['Disponível', formatarMoeda(disponivel)],
          [`Volume no Período (${periodoLabel})`, formatarMoeda(valorPeriodo)],
          [`Rendimento no Período (${periodoLabel})`, formatarMoeda(rendimentoPeriodo)],
          ['Títulos no Período', String(titulosParaPDF.length)],
        ],
        styles: { fontSize: 9 },
        headStyles: { fillColor: [88, 28, 135] },
        alternateRowStyles: { fillColor: [250, 245, 255] },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: 14, right: 14 },
      });

      if (titulosParaPDF.length > 0) {
        const yTitulos = (doc as any).lastAutoTable.finalY + 8;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 30, 30);
        doc.text(`Títulos — ${periodoLabel} (${titulosParaPDF.length})`, 14, yTitulos);

        autoTable(doc, {
          startY: yTitulos + 4,
          head: [['Nº', 'Tipo', 'Emitente', 'Vencimento', 'Prazo', 'Valor', 'Rendimento', 'Status']],
          body: titulosParaPDF.map((t: any) => [
            t.numero,
            t.tipo,
            t.emitenteNome,
            format(new Date(t.dataVencimento), 'dd/MM/yyyy'),
            `${t.prazo}d`,
            formatarMoeda(Number(t.valor)),
            formatarMoeda(Number(t.custoCedente)),
            t.status === 'LIQUIDADO' ? 'Pago' : t.status === 'VENCIDO' ? 'Vencido' : t.status === 'APROVADO' ? 'Aprovado' : 'Pendente',
          ]),
          styles: { fontSize: 7.5, cellPadding: 2 },
          headStyles: { fillColor: [88, 28, 135] },
          alternateRowStyles: { fillColor: [250, 245, 255] },
          columnStyles: { 5: { halign: 'right' }, 6: { halign: 'right' } },
          margin: { left: 14, right: 14 },
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Efficaz Factoring — CNPJ 04.578.232/0001-82', 14, 290);
        doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: 'right' });
      }

      const mesStr = mesFiltro !== '' ? String(mesFiltro).padStart(2, '0') : 'todos';
      const anoStr = anoFiltro !== '' ? String(anoFiltro) : 'todos';
      doc.save(`relatorio-fornecedor-${anoStr}-${mesStr}.pdf`);
    } finally {
      setGerando(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-5">
      {/* Perfil */}
      <div className="bg-gradient-to-br from-slate-900 to-purple-950 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 bg-purple-400/20 rounded-2xl flex items-center justify-center text-2xl font-bold">
            {fornecedor.nome.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-bold">{fornecedor.nome}</h1>
            <p className="text-white/60 text-sm">{formatarCpfCnpj(fornecedor.cpfCnpj)}</p>
            <p className="text-white/60 text-sm">{fornecedor.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-white/10">
          {[
            { label: 'Capital Total', value: formatarMoeda(capitalTotal), cor: 'text-white' },
            { label: 'Alocado', value: formatarMoeda(alocado), cor: 'text-purple-300' },
            { label: 'Rendimento', value: formatarMoeda(rendimento), cor: 'text-green-300' },
            { label: 'Disponível', value: formatarMoeda(disponivel), cor: 'text-amber-300' },
          ].map(({ label, value, cor }) => (
            <div key={label}>
              <p className="text-white/40 text-xs mb-1">{label}</p>
              <p className={`text-lg font-bold ${cor}`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resumo status */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Pendentes / Aprovados', count: pendentes, icon: Clock, cor: 'text-amber-600', bg: 'bg-amber-50', status: '' },
          { label: 'Vencidos', count: vencidos, icon: AlertTriangle, cor: 'text-red-600', bg: 'bg-red-50', status: 'VENCIDO' },
          { label: 'Pagos (Liquidados)', count: pagos, icon: CheckCircle2, cor: 'text-blue-600', bg: 'bg-blue-50', status: 'LIQUIDADO' },
        ].map(({ label, count, icon: Icon, cor, bg, status }) => (
          <button key={label}
            onClick={() => setFiltroStatus(filtroStatus === status && status !== '' ? '' : status)}
            className={`${bg} rounded-2xl p-4 border-2 transition-all text-left ${filtroStatus === status && status !== '' ? 'border-current ring-2 ring-offset-2' : 'border-transparent'}`}>
            <Icon className={`w-5 h-5 ${cor} mb-2`} />
            <p className={`text-2xl font-bold ${cor}`}>{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Títulos */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            Meus Títulos
            <span className="text-xs text-gray-400 font-normal ml-1">({titulosFiltrados.length} de {titulos.length})</span>
          </h2>
          <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30">
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="APROVADO">Aprovado</option>
            <option value="VENCIDO">Vencido</option>
            <option value="LIQUIDADO">Pago</option>
          </select>
        </div>

        {/* Filtros de relatório */}
        <div className="flex items-center gap-2 mb-4 pt-3 border-t border-gray-100 flex-wrap">
          <span className="text-xs font-semibold text-gray-500 mr-1">Imprimir relatório:</span>
          <select
            value={mesFiltro}
            onChange={e => setMesFiltro(e.target.value === '' ? '' : Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="">Todos os meses</option>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select
            value={anoFiltro}
            onChange={e => setAnoFiltro(e.target.value === '' ? '' : Number(e.target.value))}
            className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          >
            <option value="">Todos os anos</option>
            {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          <button
            onClick={gerarPDF}
            disabled={gerando}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 px-4 py-1.5 rounded-xl transition-colors disabled:opacity-60 shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            {gerando ? 'Gerando...' : `PDF${titulosParaPDF.length > 0 ? ` (${titulosParaPDF.length})` : ''}`}
          </button>
        </div>

        {titulosFiltrados.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Nenhum título encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50">
                  {['Nº', 'Tipo', 'Emitente', 'Vencimento', 'Prazo', 'Valor', 'Rendimento', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {titulosFiltrados.map((t: any) => {
                  const st = statusLabel[t.status] ?? { label: t.status, cor: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2.5 font-mono text-gray-600">{t.numero}</td>
                      <td className="px-3 py-2.5 text-gray-600">{t.tipo}</td>
                      <td className="px-3 py-2.5 text-gray-700">{t.emitenteNome}</td>
                      <td className="px-3 py-2.5 text-gray-600">
                        {format(new Date(t.dataVencimento), 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">{t.prazo}d</td>
                      <td className="px-3 py-2.5 text-purple-600 font-semibold">{formatarMoeda(Number(t.valor))}</td>
                      <td className="px-3 py-2.5 text-green-600 font-semibold">{formatarMoeda(Number(t.custoCedente))}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${st.cor}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
