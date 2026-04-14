'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const titulos: Record<string, string> = {
  '/sistema/dashboard': 'Dashboard',
  '/sistema/titulos': 'Custódias',
  '/sistema/titulos/novo': 'Nova Custódia',
  '/sistema/calcular': 'Calculadora Financeira',
  '/sistema/vencimentos': 'Vencimentos',
  '/sistema/clientes': 'Clientes',
  '/sistema/clientes/novo': 'Novo Cliente',
  '/sistema/fornecedores': 'Fornecedores',
  '/sistema/fornecedores/novo': 'Novo Fornecedor',
  '/sistema/relatorios': 'Relatórios',
  '/sistema/configuracoes': 'Configurações',
  // Portal do cliente
  '/sistema/portal': 'Meu Relatório',
  '/sistema/portal/titulos': 'Meus Títulos',
  '/sistema/portal/solicitacoes': 'Solicitações',
  '/sistema/portal/configuracoes': 'Meu Perfil',
};

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const titulo = titulos[pathname] ?? 'Sistema';
  const hoje = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuClick}
          className="md:hidden w-9 h-9 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-semibold text-gray-800 leading-tight">{titulo}</h1>
          <p className="text-xs text-gray-400 capitalize hidden sm:block">{hoje}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

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
