'use client';

import { useEffect, useState } from 'react';
import { formatarMoeda } from '@/lib/calculos';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_OPTS = [
  { value: '', label: 'Todos os status' },
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'LIQUIDADO', label: 'Pago' },
  { value: 'VENCIDO', label: 'Vencido' },
];

const statusInfo: Record<string, { label: string; cor: string }> = {
  PENDENTE:  { label: 'Pendente', cor: 'bg-amber-100 text-amber-700' },
  LIQUIDADO: { label: 'Pago', cor: 'bg-green-100 text-green-700' },
  VENCIDO:   { label: 'Vencido', cor: 'bg-red-100 text-red-700' },
};

export default function PortalTitulosPage() {
  const [titulos, setTitulos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFiltro, setStatusFiltro] = useState('');

  const carregar = (status: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set('status', status);
    fetch(`/api/portal/titulos?${params}`)
      .then(r => r.json())
      .then(d => { setTitulos(d); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { carregar(statusFiltro); }, [statusFiltro]);

  const selCls = 'px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400';

  return (
    <div className="space-y-5">
      {/* Filtro de status */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4">
        <label className="text-xs font-semibold text-gray-500">Status:</label>
        <select className={selCls} value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}>
          {STATUS_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span className="ml-auto text-xs text-gray-400">{titulos.length} título{titulos.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Meus Títulos
        </h2>

        {loading ? (
          <p className="text-sm text-gray-400 text-center py-8">Carregando...</p>
        ) : titulos.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum título encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  {['Número', 'Tipo', 'Vencimento', 'Valor', 'Líquido Recebido', 'Encargo', 'Taxa', 'Operação', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {titulos.map((t: any) => {
                  const st = statusInfo[t.status] ?? statusInfo.PENDENTE;
                  const hoje = new Date();
                  const venc = new Date(t.dataVencimento);
                  const vencido = venc < hoje && t.status === 'PENDENTE';
                  return (
                    <tr key={t.id} className={`hover:bg-gray-50/50 ${vencido ? 'bg-red-50/30' : ''}`}>
                      <td className="px-3 py-3 font-mono text-gray-600 text-xs">{t.numero}</td>
                      <td className="px-3 py-3 text-gray-600 text-xs">{t.tipo}</td>
                      <td className={`px-3 py-3 text-xs font-medium ${vencido ? 'text-red-600' : 'text-gray-600'}`}>
                        {format(venc, 'dd/MM/yyyy', { locale: ptBR })}
                      </td>
                      <td className="px-3 py-3 text-blue-600 font-semibold text-xs">{formatarMoeda(Number(t.valor))}</td>
                      <td className="px-3 py-3 text-green-600 font-semibold text-xs">{formatarMoeda(Number(t.valorLiquidoCliente))}</td>
                      <td className="px-3 py-3 text-amber-600 text-xs">{formatarMoeda(Number(t.encargo))}</td>
                      <td className="px-3 py-3 text-gray-600 text-xs">{Number(t.taxaCliente).toFixed(2)}% a.m.</td>
                      <td className="px-3 py-3 text-gray-500 text-xs font-mono">{t.operacao?.numero ?? '—'}</td>
                      <td className="px-3 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cor}`}>{st.label}</span>
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
