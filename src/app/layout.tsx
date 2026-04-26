import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Efficaz Factoring | Antecipação de Recebíveis e Capital de Giro',
  description:
    'A Efficaz Factoring oferece soluções financeiras ágeis para sua empresa: antecipação de recebíveis, compra de duplicatas, capital de giro e muito mais. Crédito rápido e sem burocracia.',
  keywords:
    'factoring, antecipação de recebíveis, capital de giro, compra de duplicatas, crédito empresarial, Efficaz Factoring',
  authors: [{ name: 'Efficaz Factoring' }],
  icons: { icon: '/icon.svg', shortcut: '/icon.svg', apple: '/icon.svg' },
  openGraph: {
    title: 'Efficaz Factoring | Antecipação de Recebíveis',
    description:
      'Soluções financeiras ágeis para impulsionar o crescimento da sua empresa.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
