import { prisma } from '@/lib/prisma';
import { formatarMoeda } from '@/lib/calculos';
import Link from 'next/link';
import { Plus, Building2 } from 'lucide-react';

export default async function FornecedoresPage() {
  const fornecedores = await prisma.fornecedor.findMany({
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { titulos: true } },
      titulos: { select: { valor: true, custoCedente: true, status: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{fornecedores.length} fornecedor(es) cadastrado(s)</p>
        <Link href="/sistema/fornecedores/novo"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo Fornecedor
        </Link>
      </div>

      {fornecedores.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
          <Building2 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum fornecedor de capital cadastrado.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {fornecedores.map(f => {
            const alocado = f.titulos.reduce((s, t) => s + Number(t.valor), 0);
            const rendimento = f.titulos.reduce((s, t) => s + Number(t.custoCedente), 0);
            const capitalTotal = Number(f.capitalTotal);
            const disponivel = capitalTotal - alocado;
            const pct = capitalTotal > 0 ? Math.min(100, (alocado / capitalTotal) * 100) : 0;
            return (
              <div key={f.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 font-bold text-sm">
                    {f.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${f.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {f.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">{f.nome}</h3>
                <p className="text-xs text-gray-400 mb-3">{f.cpfCnpj} · {f.email}</p>

                {/* Barra de alocação */}
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Capital Alocado</span>
                    <span>{pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full">
                    <div className="h-2 bg-purple-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-xs font-bold text-purple-600">{formatarMoeda(capitalTotal)}</p>
                    <p className="text-xs text-gray-400">Total</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-600">{formatarMoeda(alocado)}</p>
                    <p className="text-xs text-gray-400">Alocado</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-green-600">{formatarMoeda(rendimento)}</p>
                    <p className="text-xs text-gray-400">Rendimento</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
