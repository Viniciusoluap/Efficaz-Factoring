'use client';

import { usePathname } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const titulos: Record<string, string> = {
  '/sistema/dashboard': 'Dashboard',
  '/sistema/titulos': 'Títulos',
  '/sistema/titulos/novo': 'Novo Título',
  '/sistema/calcular': 'Calculadora Financeira',
  '/sistema/vencimentos': 'Vencimentos',
  '/sistema/clientes': 'Clientes',
  '/sistema/clientes/novo': 'Novo Cliente',
  '/sistema/fornecedores': 'Fornecedores',
  '/sistema/fornecedores/novo': 'Novo Fornecedor',
  '/sistema/relatorios': 'Relatórios',
  '/sistema/configuracoes': 'Configurações',
};

export default function Topbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const titulo = titulos[pathname] ?? 'Sistema';
  const hoje = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">{titulo}</h1>
        <p className="text-xs text-gray-400 capitalize">{hoje}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notificações */}
        <button className="relative w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">
            {session?.user?.name?.charAt(0) ?? 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700 hidden md:block">
            {session?.user?.name}
          </span>
        </div>
      </div>
    </header>
  );
}
