'use client';

import { ClipboardList, Search, CheckCircle2, Banknote } from 'lucide-react';

const steps = [
  {
    step: '01',
    icon: ClipboardList,
    title: 'Envie sua solicitação',
    description:
      'Preencha o formulário online com os dados da sua empresa e os títulos que deseja antecipar. Processo 100% digital, sem sair de casa.',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    step: '02',
    icon: Search,
    title: 'Análise e avaliação',
    description:
      'Nossa equipe analisa sua documentação e realiza a avaliação de crédito. Processo ágil com foco na aprovação do seu negócio.',
    color: 'bg-amber-500',
    lightColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    step: '03',
    icon: CheckCircle2,
    title: 'Aprovação e contrato',
    description:
      'Após a análise, apresentamos a proposta com as condições da operação. Aprovado, assinamos o contrato digitalmente.',
    color: 'bg-emerald-500',
    lightColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
  {
    step: '04',
    icon: Banknote,
    title: 'Receba o capital',
    description:
      'Com a operação aprovada e contratada, o valor é transferido diretamente para a conta da sua empresa em até 24 horas.',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
  },
];

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Como Funciona
          </div>
          <h2 className="section-title">
            Simples, rápido e{' '}
            <span className="text-accent-500">sem burocracia</span>
          </h2>
          <p className="section-subtitle">
            Em apenas 4 passos você transforma seus recebíveis em capital de giro para
            impulsionar o seu negócio.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connector line (desktop) */}
          <div className="absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gray-100 hidden lg:block" />

          {steps.map(({ step, icon: Icon, title, description, color, lightColor, textColor }, index) => (
            <div key={step} className="relative flex flex-col items-center text-center group">
              {/* Step indicator */}
              <div className="relative mb-6 z-10">
                <div
                  className={`w-24 h-24 ${lightColor} rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm`}
                >
                  <Icon className={`w-10 h-10 ${textColor}`} />
                </div>
                <div
                  className={`absolute -top-2 -right-2 w-7 h-7 ${color} text-white text-xs font-bold rounded-full flex items-center justify-center shadow-md`}
                >
                  {index + 1}
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-3">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-gray-600 mb-5 text-sm">
            Pronto para começar? É rápido, seguro e sem compromisso.
          </p>
          <button
            onClick={() => {
              const el = document.querySelector('#contato');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="btn-primary"
          >
            Iniciar minha solicitação
          </button>
        </div>
      </div>
    </section>
  );
}
