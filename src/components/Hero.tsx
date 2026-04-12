'use client';

import { ArrowRight, CheckCircle, TrendingUp, Shield, Clock } from 'lucide-react';

const highlights = [
  { icon: Clock, text: 'Aprovação em até 24h' },
  { icon: Shield, text: 'Operações seguras e transparentes' },
  { icon: TrendingUp, text: 'Taxas competitivas' },
];

export default function Hero() {
  const scrollToContact = () => {
    const el = document.querySelector('#contato');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToServices = () => {
    const el = document.querySelector('#servicos');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center overflow-hidden gradient-primary"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-600/10 rounded-full blur-3xl" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 pt-24 pb-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - text */}
          <div className="text-white animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse" />
              Soluções Financeiras para Empresas
            </div>

            <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold leading-tight mb-6">
              Transforme seus{' '}
              <span className="text-accent-400">recebíveis</span> em{' '}
              <span className="relative">
                capital
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 200 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5.5C50 1.5 150 1.5 199 5.5"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{' '}
              imediato
            </h1>

            <p className="text-lg text-white/80 mb-8 max-w-lg leading-relaxed">
              A Efficaz Factoring oferece antecipação de recebíveis, compra de duplicatas e
              capital de giro com aprovação rápida e taxas competitivas. Seu negócio cresce
              sem esperar.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button
                onClick={scrollToContact}
                className="btn-primary gap-2 text-base px-8 py-4"
              >
                Solicitar Análise Gratuita
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={scrollToServices}
                className="btn-outline text-base px-8 py-4"
              >
                Conheça nossos serviços
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              {highlights.map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-white/80 text-sm">
                  <Icon className="w-5 h-5 text-accent-400 flex-shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - stats card */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              {/* Main card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 w-80">
                <h3 className="text-white font-semibold text-lg mb-6">
                  Por que escolher a Efficaz?
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Clientes atendidos', value: '+2.500', color: 'text-accent-400' },
                    { label: 'Volume antecipado', value: 'R$ 500M+', color: 'text-green-400' },
                    { label: 'Anos de experiência', value: '15+', color: 'text-blue-300' },
                    { label: 'Taxa de aprovação', value: '94%', color: 'text-purple-300' },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 border border-white/10"
                    >
                      <span className="text-white/70 text-sm">{stat.label}</span>
                      <span className={`font-bold text-xl ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-white/10">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>Empresa certificada e regulamentada</span>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-accent-500 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-lg">
                ANFIDC Associada
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 80L60 72C120 64 240 48 360 42.7C480 37.3 600 42.7 720 48C840 53.3 960 58.7 1080 56C1200 53.3 1320 42.7 1380 37.3L1440 32V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
