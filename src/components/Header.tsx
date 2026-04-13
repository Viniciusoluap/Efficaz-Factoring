'use client';

import { useState, useEffect } from 'react';
import { Menu, X, TrendingUp } from 'lucide-react';

const navLinks = [
  { label: 'Início', href: '#inicio' },
  { label: 'Sobre Nós', href: '#sobre' },
  { label: 'Serviços', href: '#servicos' },
  { label: 'Como Funciona', href: '#como-funciona' },
  { label: 'Vantagens', href: '#vantagens' },
  { label: 'Contato', href: '#contato' },
];

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white shadow-lg py-2'
          : 'bg-black/30 backdrop-blur-sm py-4'
      }`}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('#inicio');
            }}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-accent-500 to-accent-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <span
                className={`text-xl font-bold transition-colors ${
                  isScrolled ? 'text-primary-800' : 'text-white'
                }`}
              >
                Efficaz
              </span>
              <span
                className={`text-xl font-light transition-colors ${
                  isScrolled ? 'text-accent-500' : 'text-accent-400'
                }`}
              >
                {' '}
                Factoring
              </span>
            </div>
          </a>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(link.href);
                }}
                className={`text-sm font-medium transition-colors hover:text-accent-500 ${
                  isScrolled ? 'text-gray-700' : 'text-white/90'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <a
              href="/login"
              className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${
                isScrolled
                  ? 'border-gray-300 text-gray-700 hover:bg-gray-100'
                  : 'border-white/40 text-white hover:bg-white/10'
              }`}
            >
              Acessar Sistema
            </a>
            <a
              href="#contato"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick('#contato');
              }}
              className="btn-primary text-sm"
            >
              Solicitar Análise
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isScrolled
                ? 'text-primary-800 hover:bg-gray-100'
                : 'text-white hover:bg-white/10'
            }`}
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Abrir menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-white/20">
            <nav className="flex flex-col gap-2 pt-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick(link.href);
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isScrolled
                      ? 'text-gray-700 hover:bg-gray-100'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <a
                href="/login"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isScrolled
                    ? 'text-gray-700 hover:bg-gray-100'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                Acessar Sistema
              </a>
              <a
                href="#contato"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('#contato');
                }}
                className="btn-primary text-sm mt-2"
              >
                Solicitar Análise
              </a>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
