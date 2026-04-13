import { prisma } from '@/lib/prisma';
import { formatarMoeda } from '@/lib/calculos';
import { TituloStatus, TituloTipo } from '@prisma/client';
import { format } from 'date-fns';
import Link from 'next/link';
import { Plus, FileText, Layers, ChevronRight } from 'lucide-react';
import ExportarTitulosBtn from '@/components/sistema/ExportarTitulosBtn';

const statusLabel: Record<TituloStatus, string> = {
  PENDENTE: 'Pendente', APROVADO: 'Aprovado', VENCIDO: 'Vencido',
  LIQUIDADO: 'Liquidado', PROTESTADO: 'Protestado', CANCELADO: 'Cancelado',
};
const statusCor: Record<TituloStatus, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  APROVADO: 'bg-green-100 text-green-700 border-green-200',
  VENCIDO: 'bg-red-100 text-red-700 border-red-200',
  LIQUIDADO: 'bg-blue-100 text-blue-700 border-blue-200',
  PROTESTADO: 'bg-purple-100 text-purple-700 border-purple-200',
  CANCELADO: 'bg-gray-100 text-gray-500 border-gray-200',
};
const tipoLabel: Record<TituloTipo, string> = {
  CHEQUE: 'Cheque', BOLETO: 'Boleto', PROMISSORIA: 'Promissória',
};
const tipoCor: Record<TituloTipo, string> = {
  CHEQUE: 'bg-indigo-50 text-indigo-600',
  BOLETO: 'bg-cyan-50 text-cyan-600',
  PROMISSORIA: 'bg-rose-50 text-rose-600',
};

function opStatusLabel(status: string) {
  if (status === 'CONCLUIDA') return { label: 'Concluída', cls: 'bg-green-100 text-green-700 border-green-200' };
  if (status === 'CANCELADA') return { label: 'Cancelada', cls: 'bg-gray-100 text-gray-500 border-gray-200' };
  return { label: 'Aberta', cls: 'bg-blue-100 text-blue-700 border-blue-200' };
}

export default async function TitulosPage() {
  const [operacoes, titulosAvulsos] = await Promise.all([
    prisma.operacao.findMany({
      orderBy: { criadoEm: 'desc' },
      include: {
        cliente: { select: { nome: true } },
        fornecedor: { select: { nome: true } },
        titulos: {
          select: {
            id: true, valor: true, encargo: true, spreadBruto: true,
            status: true, tipo: true, numero: true, dataVencimento: true,
          },
        },
      },
    }),
    prisma.titulo.findMany({
      where: { operacaoId: null },
      orderBy: { criadoEm: 'desc' },
      include: { cliente: { select: { nome: true } } },
    }),
  ]);

  const totais = {
    valor: 0, encargo: 0, spread: 0,
    titulos: titulosAvulsos.length,
  };
  for (const op of operacoes) {
    for (const t of op.titulos) {
      totais.valor += Number(t.valor);
      totais.encargo += Number(t.encargo);
      totais.spread += Number(t.spreadBruto);
      totais.titulos++;
    }
  }
  for (const t of titulosAvulsos) {
    totais.valor += Number(t.valor);
    totais.encargo += Number(t.encargo);
    totais.spread += Number(t.spreadBruto);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {operacoes.length} operação(ões) · {totais.titulos} título(s)
        </p>
        <div className="flex items-center gap-2">
          <ExportarTitulosBtn />
          <Link
            href="/sistema/titulos/novo"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Nova Operação
          </Link>
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Volume Total', value: formatarMoeda(totais.valor), cor: 'text-blue-600' },
          { label: 'Total de Encargos', value: formatarMoeda(totais.encargo), cor: 'text-amber-600' },
          { label: 'Spread Bruto Total', value: formatarMoeda(totais.spread), cor: 'text-green-600' },
        ].map(({ label, value, cor }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-xl font-bold ${cor}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Lista de Operações */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-gray-700 text-sm">Operações</h3>
        </div>

        {operacoes.length === 0 && titulosAvulsos.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma operação cadastrada.</p>
            <Link href="/sistema/titulos/novo" className="inline-flex items-center gap-1 text-blue-600 text-sm mt-2 hover:underline">
              <Plus className="w-3 h-3" /> Cadastrar a primeira operação
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {operacoes.map((op) => {
              const opTotais = op.titulos.reduce(
                (acc, t) => ({ valor: acc.valor + Number(t.valor), encargo: acc.encargo + Number(t.encargo) }),
                { valor: 0, encargo: 0 }
              );
              const { label: sLabel, cls: sCls } = opStatusLabel(op.status);
              const temPendente = op.titulos.some(t => t.status === TituloStatus.PENDENTE);
              const temVencido = op.titulos.some(t => t.status === TituloStatus.VENCIDO);
              const tiposUnicos = [...new Set(op.titulos.map(t => t.tipo))];

              return (
                <Link
                  key={op.id}
                  href={`/sistema/operacoes/${op.id}`}
                  className="flex items-center justify-between px-4 py-4 hover:bg-gray-50/60 transition-colors group"
                >
                  {/* Lado esquerdo */}
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <Layers className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800 text-sm">{op.numero}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${sCls}`}>
                          {sLabel}
                        </span>
                        {temVencido && (
                          <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-red-100 text-red-700 border-red-200">
                            Vencido
                          </span>
                        )}
                        {temPendente && !temVencido && (
                          <span className="text-xs px-2 py-0.5 rounded-full border font-medium bg-amber-100 text-amber-700 border-amber-200">
                            Pendente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-gray-400">
                          {format(new Date(op.criadoEm), 'dd/MM/yyyy')}
                        </span>
                        {op.cliente && (
                          <span className="text-xs text-blue-600 truncate max-w-[140px]">{op.cliente.nome}</span>
                        )}
                        {op.fornecedor && (
                          <span className="text-xs text-purple-600 truncate max-w-[140px]">{op.fornecedor.nome}</span>
                        )}
                        <span className="text-xs text-gray-400">
                          {op.titulos.length} título{op.titulos.length !== 1 ? 's' : ''}
                        </span>
                        {tiposUnicos.map(tipo => (
                          <span key={tipo} className={`text-xs px-1.5 py-0.5 rounded font-medium ${tipoCor[tipo]}`}>
                            {tipoLabel[tipo]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Lado direito */}
                  <div className="flex items-center gap-4 shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-bold text-gray-800">{formatarMoeda(opTotais.valor)}</p>
                      <p className="text-xs text-amber-600">enc. {formatarMoeda(opTotais.encargo)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </div>
                </Link>
              );
            })}

            {/* Títulos avulsos (sem operação) */}
            {titulosAvulsos.length > 0 && (
              <>
                <div className="px-4 py-2 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Títulos Avulsos</p>
                </div>
                {titulosAvulsos.map((t) => (
                  <Link
                    key={t.id}
                    href={`/sistema/titulos/${t.id}`}
                    className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50/60 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${tipoCor[t.tipo]}`}>
                            {tipoLabel[t.tipo]}
                          </span>
                          <span className="text-sm font-medium text-gray-700 truncate">{t.numero}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{t.cliente?.nome ?? t.sacadoNome}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-semibold text-gray-800">{formatarMoeda(Number(t.valor))}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusCor[t.status]}`}>
                          {statusLabel[t.status]}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                    </div>
                  </Link>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
