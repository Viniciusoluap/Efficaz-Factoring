'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  TrendingUp, LayoutDashboard, FileText, Calculator,
  Calendar, Users, Building2, Settings, LogOut,
  ChevronLeft, ChevronRight, Shield, X, Inbox,
} from 'lucide-react';

const navItems = [
  { href: '/sistema/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sistema/titulos', label: 'Títulos', icon: FileText },
  { href: '/sistema/calcular', label: 'Calculadora', icon: Calculator },
  { href: '/sistema/vencimentos', label: 'Vencimentos', icon: Calendar },
  { href: '/sistema/clientes', label: 'Clientes', icon: Users },
  { href: '/sistema/fornecedores', label: 'Fornecedores', icon: Building2 },
  { href: '/sistema/solicitacoes', label: 'Solicitações', icon: Inbox },
  { href: '/sistema/relatorios', label: 'Relatórios', icon: TrendingUp },
  { href: '/sistema/configuracoes', label: 'Configurações', icon: Settings },
];

const perfilLabel: Record<string, string> = {
  ADMIN: 'Administrador', OPERADOR: 'Operador',
  CLIENTE: 'Cliente', FORNECEDOR: 'Fornecedor',
};
const perfilCor: Record<string, string> = {
  ADMIN: 'bg-red-500/20 text-red-300',
  OPERADOR: 'bg-blue-500/20 text-blue-300',
  CLIENTE: 'bg-green-500/20 text-green-300',
  FORNECEDOR: 'bg-purple-500/20 text-purple-300',
};

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const perfil = (session?.user as any)?.perfil ?? 'OPERADOR';

  const navContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-800">
        <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">Efficaz</p>
            <p className="text-amber-400 text-xs font-light">Factoring ERP</p>
          </div>
        )}
        {/* Close btn visible only on mobile */}
        <button
          onClick={onClose}
          className="md:hidden ml-auto text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                active
                  ? 'bg-amber-500/15 text-amber-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-amber-400' : ''}`} />
              {!collapsed && <span className="truncate">{label}</span>}
              {active && !collapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-800 p-3 space-y-2">
        {!collapsed && (
          <div className="px-2 py-2 bg-slate-800/50 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 bg-amber-500 rounded-lg flex items-center justify-center text-xs font-bold text-white">
                {session?.user?.name?.charAt(0) ?? 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{session?.user?.name}</p>
              </div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${perfilCor[perfil]}`}>
              <Shield className="w-3 h-3 inline mr-1" />
              {perfilLabel[perfil]}
            </span>
          </div>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && 'Sair'}
        </button>

        {/* Collapse toggle — desktop only */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex items-center gap-3 w-full px-3 py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-xl text-sm transition-all"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : (
            <><ChevronLeft className="w-4 h-4" /><span className="text-xs">Recolher</span></>
          )}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-60'
        } min-h-screen flex-shrink-0`}
      >
        {navContent}
      </aside>

      {/* ── Mobile overlay backdrop ──────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* ── Mobile slide-in sidebar ──────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-72 bg-slate-900 border-r border-slate-800 transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {navContent}
      </aside>
    </>
  );
}
