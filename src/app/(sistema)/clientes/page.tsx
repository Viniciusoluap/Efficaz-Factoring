import { prisma } from '@/lib/prisma';
import { formatarMoeda, formatarCpfCnpj } from '@/lib/calculos';
import Link from 'next/link';
import { Plus, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: 'asc' },
    include: {
      _count: { select: { titulos: true } },
      titulos: { select: { valor: true, spreadBruto: true, status: true } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{clientes.length} cliente(s) cadastrado(s)</p>
        <Link href="/sistema/clientes/novo"
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Novo Cliente
        </Link>
      </div>

      {clientes.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-100 shadow-sm">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Nenhum cliente cadastrado.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clientes.map(c => {
            const volume = c.titulos.reduce((s, t) => s + Number(t.valor), 0);
            const spread = c.titulos.reduce((s, t) => s + Number(t.spreadBruto), 0);
            return (
              <div key={c.id} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold text-sm">
                    {c.nome.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {c.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">{c.nome}</h3>
                <p className="text-xs text-gray-400 mb-3">{formatarCpfCnpj(c.cpfCnpj)} · {c.email}</p>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-700">{c._count.titulos}</p>
                    <p className="text-xs text-gray-400">Títulos</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-blue-600">{formatarMoeda(volume)}</p>
                    <p className="text-xs text-gray-400">Volume</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-green-600">{formatarMoeda(spread)}</p>
                    <p className="text-xs text-gray-400">Spread</p>
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
