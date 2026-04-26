'use client';

import { Instagram, Linkedin, Facebook, ArrowUp } from 'lucide-react';
import LogoEfficaz from '@/components/LogoEfficaz';

const links = {
  company: [
    { label: 'Sobre Nós', href: '#sobre' },
    { label: 'Serviços', href: '#servicos' },
    { label: 'Como Funciona', href: '#como-funciona' },
    { label: 'Vantagens', href: '#vantagens' },
    { label: 'Contato', href: '#contato' },
  ],
  services: [
    { label: 'Antecipação de Duplicatas', href: '#servicos' },
    { label: 'Compra de Recebíveis', href: '#servicos' },
    { label: 'Capital de Giro', href: '#servicos' },
    { label: 'Factoring Convencional', href: '#servicos' },
    { label: 'Factoring Maturity', href: '#servicos' },
  ],
  legal: [
    { label: 'Política de Privacidade', href: '#' },
    { label: 'Termos de Uso', href: '#' },
    { label: 'LGPD', href: '#' },
  ],
};

const socials = [
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Facebook, href: '#', label: 'Facebook' },
];

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (href: string) => {
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="bg-primary-900 text-white">
      {/* Main footer */}
      <div className="container mx-auto px-4 md:px-6 py-14">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <LogoEfficaz size={40} />
              <div>
                <span className="text-xl font-bold">Efficaz</span>
                <span className="text-xl font-light text-accent-400"> Factoring</span>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-5">
              Soluções financeiras inteligentes para impulsionar o crescimento da sua empresa
              com agilidade, segurança e transparência.
            </p>

            {/* Socials */}
            <div className="flex gap-3">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center hover:bg-accent-500 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Company links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
              Empresa
            </h4>
            <ul className="space-y-2.5">
              {links.company.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(href);
                    }}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
              Serviços
            </h4>
            <ul className="space-y-2.5">
              {links.services.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavClick(href);
                    }}
                    className="text-sm text-white/70 hover:text-white transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact + certifications */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-white/40 mb-4">
              Contato
            </h4>
            <ul className="space-y-2.5 mb-6">
              <li className="text-sm text-white/70">(99) 8139-2210</li>
              <li className="text-sm text-white/70">contato@grupoefficaz.com.br</li>
              <li className="text-sm text-white/70">R. Leôncio Pires Dourado, 840A — Imperatriz/MA</li>
            </ul>

            {/* Certifications */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/50 uppercase tracking-wide mb-2">
                Certificações
              </p>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-white/70 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-400" />
                  ANFIDC Associada
                </span>
                <span className="text-xs text-white/70 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  LGPD Conformidade
                </span>
                <span className="text-xs text-white/70 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  ISO 27001 em andamento
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container mx-auto px-4 md:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/40 text-center sm:text-left">
            © {new Date().getFullYear()} Efficaz Factoring. Todos os direitos reservados.
            CNPJ: 04.578.232/0001-82
          </p>

          <div className="flex items-center gap-4">
            {links.legal.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-xs text-white/40 hover:text-white/70 transition-colors"
              >
                {label}
              </a>
            ))}

            <button
              onClick={scrollToTop}
              className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-accent-500 transition-colors"
              aria-label="Voltar ao topo"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
