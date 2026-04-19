'use client';

import { useEffect, useState } from 'react';
import { formatarMoeda, formatarCpfCnpj } from '@/lib/calculos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, Clock, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react';

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

      {/* Filtro status */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
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
