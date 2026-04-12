import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/sistema/SessionProvider';
import { TrendingUp, LogOut } from 'lucide-react';
import Link from 'next/link';

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-100 shadow-sm">
          <div className="container mx-auto px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-800 text-sm">Efficaz <span className="text-amber-500 font-light">Factoring</span></span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{session.user?.name}</span>
              <Link href="/api/auth/signout" className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">{children}</main>
      </div>
    </SessionProvider>
  );
}
