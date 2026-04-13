'use client';

import { useState } from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
} from 'lucide-react';

const contactInfo = [
  {
    icon: Phone,
    label: 'Telefone',
    value: '(99) 8139-2210',
    href: 'tel:+559981392210',
  },
  {
    icon: MessageSquare,
    label: 'WhatsApp',
    value: '(99) 8139-2210',
    href: 'https://wa.me/559981392210',
  },
  {
    icon: Mail,
    label: 'E-mail',
    value: 'contato@grupoefficaz.com.br',
    href: 'mailto:contato@grupoefficaz.com.br',
  },
  {
    icon: MapPin,
    label: 'Endereço',
    value: 'R. Leôncio Pires Dourado, 840A — Imperatriz/MA',
    href: '#',
  },
  {
    icon: Clock,
    label: 'Horário',
    value: 'Seg–Sex: 8h–18h',
    href: '#',
  },
];

const companyTypes = [
  'Micro Empresa (ME)',
  'Empresa de Pequeno Porte (EPP)',
  'Empresa de Médio Porte',
  'Empresa de Grande Porte',
];

const services = [
  'Antecipação de Duplicatas',
  'Compra de Recebíveis',
  'Capital de Giro',
  'Factoring Convencional',
  'Factoring Maturity',
  'Outro',
];

type FormState = {
  name: string;
  company: string;
  email: string;
  phone: string;
  companyType: string;
  service: string;
  message: string;
};

export default function Contact() {
  const [form, setForm] = useState<FormState>({
    name: '',
    company: '',
    email: '',
    phone: '',
    companyType: '',
    service: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao enviar formulário.');
      }

      setSubmitted(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm transition-all bg-gray-50 focus:bg-white';

  return (
    <section id="contato" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-block bg-primary-50 text-primary-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Fale Conosco
          </div>
          <h2 className="section-title">
            Pronto para{' '}
            <span className="text-accent-500">começar</span>?
          </h2>
          <p className="section-subtitle">
            Entre em contato com nossa equipe e receba uma análise gratuita e personalizada
            para a sua empresa.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-10">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="gradient-primary rounded-3xl p-8 text-white">
              <h3 className="text-xl font-bold mb-6">Informações de Contato</h3>
              <div className="space-y-4">
                {contactInfo.map(({ icon: Icon, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="flex items-start gap-3 group hover:text-accent-300 transition-colors"
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-accent-400" />
                    </div>
                    <div>
                      <div className="text-xs text-white/50 uppercase tracking-wide">{label}</div>
                      <div className="text-sm font-medium text-white/90 group-hover:text-accent-300 transition-colors">
                        {value}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div className="bg-accent-50 border border-accent-100 rounded-2xl p-6">
              <h4 className="font-bold text-gray-800 mb-3 text-sm">
                Atendimento pelo WhatsApp
              </h4>
              <p className="text-gray-600 text-xs mb-4 leading-relaxed">
                Prefere falar diretamente com um especialista? Clique abaixo e inicie o
                atendimento agora mesmo.
              </p>
              <a
                href="https://wa.me/559981392210?text=Olá!%20Gostaria%20de%20uma%20análise%20gratuita%20para%20minha%20empresa."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-green-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Falar no WhatsApp
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-3">
            {submitted ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center py-16 px-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-3">
                    Solicitação enviada!
                  </h3>
                  <p className="text-gray-600 max-w-sm mx-auto">
                    Recebemos sua solicitação. Um especialista da Efficaz entrará em
                    contato em até 24 horas úteis.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="mt-8 text-primary-600 text-sm font-medium hover:underline"
                  >
                    Enviar outra solicitação
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Nome completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Empresa *
                    </label>
                    <input
                      type="text"
                      name="company"
                      required
                      value={form.company}
                      onChange={handleChange}
                      placeholder="Nome da empresa"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      E-mail *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={form.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={form.phone}
                      onChange={handleChange}
                      placeholder="(11) 99000-0000"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Porte da empresa
                    </label>
                    <select
                      name="companyType"
                      value={form.companyType}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Selecione...</option>
                      {companyTypes.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Serviço de interesse
                    </label>
                    <select
                      name="service"
                      value={form.service}
                      onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Selecione...</option>
                      {services.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Mensagem (opcional)
                  </label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Descreva brevemente sua necessidade financeira..."
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <p className="text-xs text-gray-400">
                  Ao enviar, você concorda com nossa{' '}
                  <a href="#" className="text-primary-600 hover:underline">
                    política de privacidade
                  </a>
                  .
                </p>

                {erro && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {erro}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full gap-2 py-4 text-base disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <svg
                        className="w-5 h-5 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Solicitar análise gratuita
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
