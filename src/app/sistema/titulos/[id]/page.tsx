import { prisma } from '@/lib/prisma';
import { formatarMoeda, formatarCpfCnpj } from '@/lib/calculos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, FileText, Calendar, User, Building2,
  TrendingUp, Percent, Shield, Clock,
} from 'lucide-react';
import TituloAcoes from '@/components/sistema/TituloAcoes';
import AlterarStatusBtn from '@/components/sistema/AlterarStatusBtn';
import ProrrogarBtn from '@/components/sistema/ProrrogarBtn';
import PagamentoParcialBtn from '@/components/sistema/PagamentoParcialBtn';

const statusLabel: Record<string, string> = {
  PENDENTE: 'Pendente', APROVADO: 'Aprovado', VENCIDO: 'Vencido',
  LIQUIDADO: 'Liquidado', PROTESTADO: 'Protestado', CANCELADO: 'Cancelado',
};
const statusCor: Record<string, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700 border-amber-200',
  APROVADO: 'bg-green-100 text-green-700 border-green-200',
  VENCIDO: 'bg-red-100 text-red-700 border-red-200',
  LIQUIDADO: 'bg-blue-100 text-blue-700 border-blue-200',
  PROTESTADO: 'bg-purple-100 text-purple-700 border-purple-200',
  CANCELADO: 'bg-gray-100 text-gray-500 border-gray-200',
};
const tipoLabel: Record<string, string> = {
  CHEQUE: 'Cheque', BOLETO: 'Boleto', PROMISSORIA: 'Promissória',
};

export default async function TituloDetalhePage({ params }: { params: { id: string } }) {
  const titulo = await prisma.titulo.findUnique({
    where: { id: params.id },
    include: { cliente: true, fornecedor: true, comunicacoes: { orderBy: { criadoEm: 'desc' } } },
  });

  if (!titulo) notFound();

  const dados = {
    id: titulo.id,
    numero: titulo.numero,
    tipo: titulo.tipo,
    status: titulo.status,
    emitenteNome: titulo.emitenteNome,
    emitenteCpfCnpj: titulo.emitenteCpfCnpj,
    sacadoNome: titulo.sacadoNome,
    sacadoCpfCnpj: titulo.sacadoCpfCnpj,
    dataEmissao: format(new Date(titulo.dataEmissao), 'dd/MM/yyyy'),
    dataVencimento: format(new Date(titulo.dataVencimento), 'dd/MM/yyyy'),
    prazo: titulo.prazo,
    valor: Number(titulo.valor),
    taxaCliente: Number(titulo.taxaCliente),
    taxaFornecedor: Number(titulo.taxaFornecedor),
    encargo: Number(titulo.encargo),
    valorLiquidoCliente: Number(titulo.valorLiquidoCliente),
    custoCedente: Number(titulo.custoCedente),
    spreadBruto: Number(titulo.spreadBruto),
    spreadLiquido: Number(titulo.spreadLiquido ?? 0),
    impostoProvisao: Number(titulo.impostoProvisao ?? 0),
    clienteNome: titulo.cliente?.nome,
    clienteEmail: titulo.cliente?.email,
    clienteTelefone: titulo.cliente?.telefone ?? undefined,
    clienteEndereco: titulo.cliente?.endereco ?? undefined,
    clienteRepresentanteNome: titulo.cliente?.representanteNome ?? undefined,
    clienteRepresentanteCpf: titulo.cliente?.representanteCpf ?? undefined,
    fornecedorNome: titulo.fornecedor?.nome,
    observacoes: titulo.observacoes,
    criadoEm: format(new Date(titulo.criadoEm), "dd/MM/yyyy 'às' HH:mm"),
  };

  const gatilhoLabel: Record<string, string> = {
    D_MENOS_3: 'D-3', D_MENOS_1: 'D-1', D_0: 'D0',
    D_MAIS_1: 'D+1', D_MAIS_3: 'D+3', D_MAIS_5: 'D+5',
  };

  return (
    <div className="max-w-5xl space-y-5">
      {/* Breadcrumb e ações */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Link href="/sistema/titulos" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Voltar para Títulos
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <TituloAcoes dados={dados} />
          <ProrrogarBtn
            tituloId={titulo.id}
            tituloNumero={titulo.numero}
            tituloTipo={titulo.tipo}
            valor={dados.valor}
            taxaClienteAtual={dados.taxaCliente}
            taxaFornecedorAtual={dados.taxaFornecedor}
            dataVencimentoAtual={dados.dataVencimento}
            dataVencimentoISO={format(new Date(titulo.dataVencimento), 'yyyy-MM-dd')}
            emitenteNome={titulo.emitenteNome}
            emitenteCpfCnpj={titulo.emitenteCpfCnpj}
            sacadoNome={titulo.sacadoNome}
            sacadoCpfCnpj={titulo.sacadoCpfCnpj}
            clienteNome={titulo.cliente?.nome}
            clienteRepresentanteNome={titulo.cliente?.representanteNome ?? undefined}
            clienteRepresentanteCpf={titulo.cliente?.representanteCpf ?? undefined}
          />
          <PagamentoParcialBtn tituloId={titulo.id} valorAtual={dados.valor} />
        </div>
      </div>

      {/* Header do título */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs bg-white/10 px-2.5 py-1 rounded-lg font-medium">
                {tipoLabel[titulo.tipo]}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusCor[titulo.status]}`}>
                {statusLabel[titulo.status]}
              </span>
            </div>
            <h1 className="text-2xl font-bold">Título nº {titulo.numero}</h1>
            <p className="text-white/50 text-sm mt-1">Cadastrado em {dados.criadoEm}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-amber-400">{formatarMoeda(dados.valor)}</p>
            <p className="text-white/50 text-sm">Valor bruto</p>
            <AlterarStatusBtn tituloId={titulo.id} statusAtual={titulo.status} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Coluna esquerda — dados */}
        <div className="lg:col-span-2 space-y-5">
          {/* Partes */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" /> Partes Envolvidas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Emitente', nome: titulo.emitenteNome, doc: formatarCpfCnpj(titulo.emitenteCpfCnpj) },
                { label: 'Sacado', nome: titulo.sacadoNome, doc: formatarCpfCnpj(titulo.sacadoCpfCnpj) },
              ].map(({ label, nome, doc }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-1">{label}</p>
                  <p className="font-semibold text-gray-800 text-sm">{nome}</p>
                  <p className="text-xs text-gray-400 font-mono">{doc}</p>
                </div>
              ))}
              {titulo.cliente && (
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 uppercase font-semibold mb-1">Cliente Custodiante</p>
                  <p className="font-semibold text-gray-800 text-sm">{titulo.cliente.nome}</p>
                </div>
              )}
              {titulo.fornecedor && (
                <div className="bg-purple-50 rounded-xl p-3">
                  <p className="text-xs text-purple-600 uppercase font-semibold mb-1">Fornecedor de Capital</p>
                  <p className="font-semibold text-gray-800 text-sm">{titulo.fornecedor.nome}</p>
                </div>
              )}
            </div>
          </div>

          {/* Datas */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Datas e Prazo
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Emissão', value: dados.dataEmissao },
                { label: 'Vencimento', value: dados.dataVencimento },
                { label: 'Prazo', value: `${titulo.prazo} dias` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-base font-bold text-gray-800">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Histórico de comunicações */}
          {titulo.comunicacoes.length > 0 && (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-semibold text-gray-700 text-sm mb-4">Histórico de Comunicações</h3>
              <div className="space-y-2">
                {titulo.comunicacoes.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${c.status === 'ENVIADO' ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="font-medium text-gray-700">{c.tipo} — Gatilho {gatilhoLabel[c.gatilho] ?? c.gatilho}</span>
                    </div>
                    <span className="text-gray-400">
                      {c.enviadoEm ? format(new Date(c.enviadoEm), 'dd/MM HH:mm') : 'Pendente'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita — financeiro */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Resultado Financeiro
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Valor Bruto', value: formatarMoeda(dados.valor), cor: 'text-gray-800 font-bold' },
                { label: 'Taxa Cliente', value: `${dados.taxaCliente.toFixed(2)}% a.m.`, cor: 'text-gray-600' },
                { label: 'Encargo', value: formatarMoeda(dados.encargo), cor: 'text-amber-600 font-semibold' },
                { label: 'Líquido Cliente', value: formatarMoeda(dados.valorLiquidoCliente), cor: 'text-green-600 font-semibold' },
              ].map(({ label, value, cor }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-sm ${cor}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <h3 className="font-semibold text-gray-700 text-sm mb-4 flex items-center gap-2">
              <Percent className="w-4 h-4 text-purple-600" /> Spread e Fiscal
            </h3>
            <div className="space-y-2.5">
              {[
                { label: 'Taxa Fornecedor', value: `${dados.taxaFornecedor.toFixed(2)}% a.m.`, cor: 'text-gray-600' },
                { label: 'Custo Cedente', value: formatarMoeda(dados.custoCedente), cor: 'text-blue-600' },
                { label: 'Spread Bruto', value: formatarMoeda(dados.spreadBruto), cor: 'text-purple-600 font-semibold' },
                { label: 'Imposto Prov.', value: formatarMoeda(dados.impostoProvisao), cor: 'text-red-500' },
                { label: 'Spread Líquido', value: formatarMoeda(dados.spreadLiquido), cor: 'text-green-600 font-bold' },
              ].map(({ label, value, cor }) => (
                <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-sm ${cor}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {titulo.observacoes && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">Observações</p>
              <p className="text-sm text-amber-800">{titulo.observacoes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
