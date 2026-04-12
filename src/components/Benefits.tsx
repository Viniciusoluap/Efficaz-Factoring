import {
  Zap,
  Lock,
  DollarSign,
  HeadphonesIcon,
  TrendingUp,
  FileCheck,
  Globe,
  BarChart,
} from 'lucide-react';

const benefits = [
  {
    icon: Zap,
    title: 'Aprovação Rápida',
    description: 'Análise e aprovação em até 24 horas para não prejudicar sua operação.',
  },
  {
    icon: Lock,
    title: 'Segurança Total',
    description: 'Operações seguras com contratos claros e conformidade regulatória.',
  },
  {
    icon: DollarSign,
    title: 'Taxas Competitivas',
    description: 'Condições personalizadas e taxas ajustadas ao perfil de cada cliente.',
  },
  {
    icon: HeadphonesIcon,
    title: 'Suporte Dedicado',
    description: 'Gerente de conta exclusivo para acompanhar todas as suas operações.',
  },
  {
    icon: TrendingUp,
    title: 'Melhora o Fluxo de Caixa',
    description: 'Garanta capital de giro imediato sem esperar os prazos dos clientes.',
  },
  {
    icon: FileCheck,
    title: 'Menos Burocracia',
    description: 'Processo simplificado e digital. Documentação mínima necessária.',
  },
  {
    icon: Globe,
    title: '100% Digital',
    description: 'Solicitações, contratos e liberações totalmente online, de qualquer lugar.',
  },
  {
    icon: BarChart,
    title: 'Relatórios Completos',
    description: 'Acompanhe todas as suas operações com dashboards em tempo real.',
  },
];

const testimonials = [
  {
    name: 'Carlos Mendes',
    company: 'Distribuidora Mendes & Filhos',
    text: 'A Efficaz nos ajudou a superar uma crise de fluxo de caixa em tempo recorde. A aprovação foi muito mais rápida do que esperávamos.',
    rating: 5,
  },
  {
    name: 'Ana Paula Ferreira',
    company: 'Confecções AnaVera',
    text: 'Sempre que precisamos de capital de giro rapidamente, a Efficaz está lá. O suporte é excelente e as taxas são justas.',
    rating: 5,
  },
  {
    name: 'Roberto Silva',
    company: 'Construtora RS Ltda',
    text: 'Trabalho com a Efficaz há 5 anos. Nunca me decepcionaram. Processo ágil e transparente sempre.',
    rating: 5,
  },
];

export default function Benefits() {
  return (
    <section id="vantagens" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Vantagens
          </div>
          <h2 className="section-title">
            Por que escolher a{' '}
            <span className="text-accent-500">Efficaz Factoring</span>?
          </h2>
          <p className="section-subtitle">
            Mais de 15 anos oferecendo soluções financeiras inteligentes para empresas
            que querem crescer com segurança.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-16">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 group"
            >
              <div className="w-11 h-11 gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2 text-sm">{title}</h3>
              <p className="text-gray-500 text-xs leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-16">
          <h3 className="text-center text-2xl font-bold text-primary-900 mb-10">
            O que nossos clientes dizem
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(({ name, company, text, rating }) => (
              <div key={name} className="card">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: rating }).map((_, i) => (
                    <svg
                      key={i}
                      className="w-4 h-4 text-accent-500 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>

                <p className="text-gray-600 text-sm leading-relaxed mb-5 italic">
                  &ldquo;{text}&rdquo;
                </p>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="w-10 h-10 gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{name}</div>
                    <div className="text-gray-500 text-xs">{company}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
