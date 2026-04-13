'use client';

import { useEffect, useState } from 'react';
import { Inbox, Phone, Mail, Building2, RefreshCw, Trash2, CheckCheck, Eye, MessageSquare, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Solicitacao = {
  id: string;
  nome: string;
  empresa: string;
  email: string;
  telefone: string;
  porte: string | null;
  servico: string | null;
  mensagem: string | null;
  lida: boolean;
  criadoEm: string;
};

export default function SolicitacoesPage() {
  const [dados, setDados] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecionada, setSelecionada] = useState<Solicitacao | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const carregar = () => {
    setLoading(true);
    fetch('/api/solicitacoes')
      .then(r => r.json())
      .then(d => { setDados(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { carregar(); }, []);

  const marcarLida = async (id: string, lida: boolean) => {
    await fetch(`/api/solicitacoes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lida }),
    });
    setDados(prev => prev.map(s => s.id === id ? { ...s, lida } : s));
    if (selecionada?.id === id) setSelecionada(prev => prev ? { ...prev, lida } : null);
  };

  const excluir = async (id: string) => {
    await fetch(`/api/solicitacoes/${id}`, { method: 'DELETE' });
    setDados(prev => prev.filter(s => s.id !== id));
    if (selecionada?.id === id) setSelecionada(null);
    setConfirmDelete(null);
  };

  const verDetalhes = (s: Solicitacao) => {
    setSelecionada(s);
    if (!s.lida) marcarLida(s.id, true);
  };

  const naoLidas = dados.filter(s => !s.lida).length;

  return (
    <div className="max-w-5xl space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Inbox className="w-5 h-5 text-blue-600" />
            Solicitações do Site
            {naoLidas > 0 && (
              <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {naoLidas} nova{naoLidas > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Leads recebidos pelo formulário de contato</p>
        </div>
        <button onClick={carregar}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 bg-white border border-gray-200 px-3 py-2 rounded-xl transition-colors shadow-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
          Carregando...
        </div>
      ) : dados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma solicitação recebida ainda.</p>
          <p className="text-gray-400 text-sm mt-1">As solicitações do formulário do site aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-4">
          {/* Lista */}
          <div className="lg:col-span-2 space-y-2">
            {dados.map(s => (
              <div
                key={s.id}
                className={`bg-white rounded-xl border p-4 shadow-sm transition-all ${
                  selecionada?.id === s.id ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'
                } ${!s.lida ? 'border-l-4 border-l-blue-500' : ''}`}
              >
                {/* Cabeçalho */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    {!s.lida && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                    <p className={`text-sm truncate ${!s.lida ? 'font-bold text-gray-900' : 'font-semibold text-gray-700'}`}>
                      {s.nome}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {format(new Date(s.criadoEm), 'dd/MM', { locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mb-2 ml-4">{s.empresa}</p>
                {s.servico && (
                  <span className="ml-4 inline-block text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full mb-3">
                    {s.servico}
                  </span>
                )}

                {/* Botões de ação */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => verDetalhes(s)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 px-2 py-1.5 rounded-lg transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </button>
                  <button
                    onClick={() => marcarLida(s.id, !s.lida)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-lg transition-colors ${
                      s.lida
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        : 'bg-green-50 hover:bg-green-100 text-green-700'
                    }`}
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    {s.lida ? 'Não lida' : 'Lida'}
                  </button>
                  {confirmDelete === s.id ? (
                    <button
                      onClick={() => excluir(s.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium bg-red-600 hover:bg-red-700 text-white px-2 py-1.5 rounded-lg transition-colors"
                    >
                      Confirmar
                    </button>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(s.id)}
                      className="flex items-center justify-center gap-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1.5 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Detalhe */}
          <div className="lg:col-span-3">
            {selecionada ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-gray-800">{selecionada.nome}</h2>
                    <p className="text-sm text-gray-500">{selecionada.empresa}{selecionada.porte ? ` — ${selecionada.porte}` : ''}</p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(selecionada.criadoEm), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    selecionada.lida ? 'bg-gray-100 text-gray-500' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {selecionada.lida ? 'Lida' : 'Não lida'}
                  </span>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { icon: Mail, label: 'E-mail', value: selecionada.email, href: `mailto:${selecionada.email}` },
                    { icon: Phone, label: 'Telefone', value: selecionada.telefone, href: `tel:${selecionada.telefone}` },
                  ].map(({ icon: Icon, label, value, href }) => (
                    <a key={label} href={href}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group">
                      <div className="w-8 h-8 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:border-blue-300">
                        <Icon className="w-4 h-4 text-gray-500 group-hover:text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">{label}</p>
                        <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">{value}</p>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  {selecionada.servico && (
                    <span className="flex items-center gap-1.5 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-xl">
                      <Building2 className="w-3.5 h-3.5" /> {selecionada.servico}
                    </span>
                  )}
                  {selecionada.porte && (
                    <span className="text-sm bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl">
                      {selecionada.porte}
                    </span>
                  )}
                </div>

                {selecionada.mensagem && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> Mensagem
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{selecionada.mensagem}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <a href={`mailto:${selecionada.email}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                    <Mail className="w-4 h-4" /> Responder por E-mail
                  </a>
                  <a href={`https://wa.me/55${selecionada.telefone.replace(/\D/g, '')}?text=Olá%20${encodeURIComponent(selecionada.nome)}!%20Vi%20sua%20solicitação%20na%20Efficaz%20Factoring.`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                    WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center text-gray-400 h-full flex flex-col items-center justify-center min-h-[200px]">
                <Inbox className="w-8 h-8 mb-3 text-gray-300" />
                <p className="text-sm">Clique em <strong>Ver</strong> em uma solicitação para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
