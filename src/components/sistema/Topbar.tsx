'use client';

import { usePathname } from 'next/navigation';
import { Bell, Menu, FileText, AlertTriangle, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

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
  '/sistema/portal': 'Meu Relatório',
  '/sistema/portal/titulos': 'Meus Títulos',
  '/sistema/portal/solicitacoes': 'Solicitações',
  '/sistema/portal/configuracoes': 'Meu Perfil',
};

type Notifs = {
  solicitacoesNaoLidas: number;
  titulosVencendoHoje: number;
  titulosVencidos: number;
  total: number;
};

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const titulo = titulos[pathname] ?? 'Sistema';
  const hoje = format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR });

  const [notifs, setNotifs] = useState<Notifs | null>(null);
  const [open, setOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const carregar = () => {
    fetch('/api/notificacoes')
      .then(r => r.json())
      .then(d => setNotifs(d))
      .catch(() => {});
  };

  useEffect(() => {
    carregar();
    const id = setInterval(carregar, 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const total = notifs?.total ?? 0;

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-3">
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
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setOpen(v => !v)}
            className="relative w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Bell className="w-5 h-5" />
            {total > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                {total > 99 ? '99+' : total}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-11 w-80 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Notificações</span>
                {total > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">{total}</span>
                )}
              </div>

              <div className="divide-y divide-gray-50">
                {notifs?.solicitacoesNaoLidas > 0 && (
                  <Link href="/sistema/solicitacoes" onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {notifs.solicitacoesNaoLidas} solicitaç{notifs.solicitacoesNaoLidas === 1 ? 'ão' : 'ões'} nova{notifs.solicitacoesNaoLidas !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-400">Aguardando leitura</p>
                    </div>
                  </Link>
                )}

                {notifs?.titulosVencendoHoje > 0 && (
                  <Link href="/sistema/vencimentos" onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {notifs.titulosVencendoHoje} título{notifs.titulosVencendoHoje !== 1 ? 's' : ''} vencendo hoje
                      </p>
                      <p className="text-xs text-gray-400">Requerem atenção</p>
                    </div>
                  </Link>
                )}

                {notifs?.titulosVencidos > 0 && (
                  <Link href="/sistema/titulos" onClick={() => setOpen(false)}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {notifs.titulosVencidos} título{notifs.titulosVencidos !== 1 ? 's' : ''} vencido{notifs.titulosVencidos !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-gray-400">Status: Vencido</p>
                    </div>
                  </Link>
                )}

                {total === 0 && (
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    Nenhuma notificação pendente
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
