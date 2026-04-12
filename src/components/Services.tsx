'use client';

import {
  FileText,
  CreditCard,
  BarChart3,
  Briefcase,
  RefreshCw,
  ShoppingCart,
} from 'lucide-react';

const services = [
  {
    icon: FileText,
    title: 'Antecipação de Duplicatas',
    description:
      'Antecipe suas duplicatas a receber e garanta capital imediato para o seu negócio. Processo 100% digital e aprovação rápida.',
    highlight: 'Aprovação em 24h',
    color: 'from-blue-500 to-blue-700',
    bgColor: 'bg-blue-50',
    iconColor: 'text-blue-600',
  },
  {
    icon: CreditCard,
    title: 'Compra de Recebíveis',
    description:
      'Vendemos à prazo, receba à vista. Compramos seus títulos e cheques com análise personalizada e condições especiais.',
    highlight: 'Cheques e títulos',
    color: 'from-emerald-500 to-emerald-700',
    bgColor: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  {
    icon: BarChart3,
    title: 'Capital de Giro',
    description:
      'Soluções de capital de giro para manter o fluxo de caixa da sua empresa sempre positivo e operações funcionando.',
    highlight: 'Taxas competitivas',
    color: 'from-purple-500 to-purple-700',
    bgColor: 'bg-purple-50',
    iconColor: 'text-purple-600',
  },
  {
    icon: Briefcase,
    title: 'Factoring Convencional',
    description:
      'A modalidade clássica de factoring: venda seus títulos e receba à vista, com a transferência completa do risco de crédito.',
    highlight: 'Sem endividamento',
    color: 'from-orange-500 to-orange-700',
    bgColor: 'bg-orange-50',
    iconColor: 'text-orange-600',
  },
  {
    icon: RefreshCw,
    title: 'Factoring Maturity',
    description:
      'Gestão profissional das suas contas a receber. A Efficaz administra a cobrança e garante o recebimento no vencimento.',
    highlight: 'Gestão completa',
    color: 'from-rose-500 to-rose-700',
    bgColor: 'bg-rose-50',
    iconColor: 'text-rose-600',
  },
  {
    icon: ShoppingCart,
    title: 'Forfaiting',
    description:
      'Solução para empresas que trabalham com exportações ou grandes contratos. Antecipação de recebíveis de médio e longo prazo.',
    highlight: 'Grandes operações',
    color: 'from-indigo-500 to-indigo-700',
    bgColor: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
  },
];

export default function Services() {
  return (
    <section id="servicos" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Nossos Serviços
          </div>
          <h2 className="section-title">
            Soluções financeiras para{' '}
            <span className="text-accent-500">cada necessidade</span>
          </h2>
          <p className="section-subtitle">
            Oferecemos um portfólio completo de produtos de factoring, adaptados à realidade
            e ao momento de cada empresa.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(({ icon: Icon, title, description, highlight, bgColor, iconColor }) => (
            <div
              key={title}
              className="card group cursor-default hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 ${bgColor} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
              </div>

              <div className="mb-3">
                <span className={`text-xs font-semibold ${iconColor} bg-opacity-10 ${bgColor} px-2.5 py-1 rounded-full`}>
                  {highlight}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    const el = document.querySelector('#contato');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`text-sm font-medium ${iconColor} flex items-center gap-1 hover:gap-2 transition-all`}
                >
                  Saiba mais
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA banner */}
        <div className="mt-12 gradient-primary rounded-3xl p-8 md:p-10 text-white text-center">
          <h3 className="text-2xl font-bold mb-3">
            Não encontrou o que precisa?
          </h3>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Nossa equipe de especialistas pode criar uma solução personalizada para a
            realidade financeira da sua empresa.
          </p>
          <button
            onClick={() => {
              const el = document.querySelector('#contato');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-primary"
          >
            Falar com um especialista
          </button>
        </div>
      </div>
    </section>
  );
}
