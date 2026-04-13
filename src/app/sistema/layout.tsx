import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/sistema/SessionProvider';
import SistemaShell from '@/components/sistema/SistemaShell';

export default async function SistemaLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <SessionProvider session={session}>
      <SistemaShell>{children}</SistemaShell>
    </SessionProvider>
  );
}
