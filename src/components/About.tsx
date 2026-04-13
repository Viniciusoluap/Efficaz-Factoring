import { Award, Users, Target, Heart } from 'lucide-react';

const values = [
  {
    icon: Award,
    title: 'Excelência',
    description: 'Buscamos sempre a melhor solução para cada cliente, com qualidade e precisão.',
  },
  {
    icon: Users,
    title: 'Relacionamento',
    description: 'Construímos parcerias duradouras baseadas em confiança e transparência.',
  },
  {
    icon: Target,
    title: 'Agilidade',
    description: 'Processos otimizados para entregar soluções rápidas sem abrir mão da segurança.',
  },
  {
    icon: Heart,
    title: 'Compromisso',
    description: 'Comprometidos com o crescimento sustentável das empresas que atendemos.',
  },
];

export default function About() {
  return (
    <section id="sobre" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left - Image/Visual */}
          <div className="relative">
            <div className="gradient-primary rounded-3xl p-8 text-white">
              <div className="grid grid-cols-2 gap-6">
                {[
                  { number: '2001', label: 'Fundada em' },
                  { number: '+2.500', label: 'Empresas atendidas' },
                  { number: 'R$ 500M+', label: 'Em recebíveis antecipados' },
                  { number: '100%', label: 'Digital e ágil' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 text-center"
                  >
                    <div className="text-2xl font-bold text-accent-400 mb-1">{item.number}</div>
                    <div className="text-sm text-white/70">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-white/10 rounded-2xl p-5 border border-white/20">
                <p className="text-white/90 text-sm leading-relaxed">
                  &ldquo;Nossa missão é democratizar o acesso ao crédito empresarial, oferecendo
                  soluções financeiras ágeis que impulsionam o crescimento de negócios em todo
                  o Brasil.&rdquo;
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center font-bold text-sm">
                    EF
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Equipe Efficaz</div>
                    <div className="text-xs text-white/60">Diretoria Executiva</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-accent-500/20 rounded-2xl -z-10" />
            <div className="absolute -top-6 -left-6 w-16 h-16 bg-primary-200 rounded-xl -z-10" />
          </div>

          {/* Right - Text */}
          <div>
            <div className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Sobre a Efficaz Factoring
            </div>
            <h2 className="section-title">
              Uma empresa construída para{' '}
              <span className="text-accent-500">impulsionar</span> o seu negócio
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Há mais de 15 anos no mercado, a Efficaz Factoring é especializada em soluções
              financeiras para micro, pequenas e médias empresas. Entendemos que o fluxo de caixa
              é o coração de qualquer negócio e atuamos para mantê-lo sempre saudável.
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              Com uma equipe de especialistas financeiros e uma plataforma digital moderna,
              simplificamos o processo de antecipação de recebíveis para que você possa
              focar no que realmente importa: crescer.
            </p>

            <div className="grid grid-cols-2 gap-4">
              {values.map(({ icon: Icon, title, description }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary-700" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
