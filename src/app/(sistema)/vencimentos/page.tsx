import { prisma } from '@/lib/prisma';
import { formatarMoeda } from '@/lib/calculos';
import { format, isToday, isPast, addDays, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TituloStatus } from '@prisma/client';
import { AlertTriangle, Clock, CheckCircle, Bell } from 'lucide-react';
import EnviarComunicacoesBtn from '@/components/sistema/EnviarComunicacoesBtn';

async function getVencimentos() {
  const titulos = await prisma.titulo.findMany({
    where: { status: { in: [TituloStatus.APROVADO, TituloStatus.VENCIDO] } },
    orderBy: { dataVencimento: 'asc' },
    include: { cliente: true },
  });

  const hoje = new Date();
  const em3dias = addDays(hoje, 3);

  const vencemHoje = titulos.filter(t => isToday(new Date(t.dataVencimento)));
  const vencidos = titulos.filter(t => isPast(new Date(t.dataVencimento)) && !isToday(new Date(t.dataVencimento)));
  const proximos = titulos.filter(t =>
    isWithinInterval(new Date(t.dataVencimento), { start: addDays(hoje, 1), end: em3dias })
  );
  const futuros = titulos.filter(t => new Date(t.dataVencimento) > em3dias);

  return { vencemHoje, vencidos, proximos, futuros };
}

const tipoLabel: Record<string, string> = { CHEQUE: 'Cheque', BOLETO: 'Boleto', PROMISSORIA: 'Promissória' };

function TituloRow({ t, urgencia }: { t: any; urgencia: string }) {
  const cores: Record<string, string> = {
    vencido: 'border-l-red-500 bg-red-50/30',
    hoje: 'border-l-orange-500 bg-orange-50/30',
    proximo: 'border-l-amber-500 bg-amber-50/10',
    futuro: 'border-l-gray-300 bg-white',
  };
  return (
    <div className={`flex items-center justify-between p-3 border-l-4 rounded-r-xl ${cores[urgencia]} mb-2`}>
      <div className="flex items-center gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-700">{t.numero}</p>
          <p className="text-xs text-gray-500">{tipoLabel[t.tipo]} · {t.emitenteNome}</p>
          {t.cliente && <p className="text-xs text-blue-600">{t.cliente.nome}</p>}
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-gray-800">{formatarMoeda(Number(t.valor))}</p>
        <p className="text-xs text-gray-500">
          {format(new Date(t.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}

export default async function VencimentosPage() {
  const { vencemHoje, vencidos, proximos, futuros } = await getVencimentos();

  const totalHoje = vencemHoje.reduce((s, t) => s + Number(t.valor), 0);
  const totalVencidos = vencidos.reduce((s, t) => s + Number(t.valor), 0);

  return (
    <div className="space-y-5">
      {/* Resumo */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Vencem Hoje', count: vencemHoje.length, valor: totalHoje, icon: Clock, cor: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Vencidos', count: vencidos.length, valor: totalVencidos, icon: AlertTriangle, cor: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Próximos 3 dias', count: proximos.length, valor: proximos.reduce((s, t) => s + Number(t.valor), 0), icon: Bell, cor: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Futuros', count: futuros.length, valor: futuros.reduce((s, t) => s + Number(t.valor), 0), icon: CheckCircle, cor: 'text-green-600', bg: 'bg-green-50' },
        ].map(({ label, count, valor, icon: Icon, cor, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${cor}`} />
            </div>
            <p className="text-2xl font-bold text-gray-800">{count}</p>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xs font-medium text-gray-600 mt-1">{formatarMoeda(valor)}</p>
          </div>
        ))}
      </div>

      {/* Vencem Hoje */}
      {vencemHoje.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" />
              Vencem Hoje — {formatarMoeda(totalHoje)}
            </h3>
            <EnviarComunicacoesBtn
              tituloIds={vencemHoje.map(t => t.id)}
              gatilho="D_0"
              label="Disparar notificações D0"
            />
          </div>
          {vencemHoje.map(t => <TituloRow key={t.id} t={t} urgencia="hoje" />)}
        </div>
      )}

      {/* Vencidos */}
      {vencidos.length > 0 && (
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
          <h3 className="font-semibold text-red-600 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4" />
            Vencidos ({vencidos.length}) — {formatarMoeda(totalVencidos)}
          </h3>
          {vencidos.slice(0, 10).map(t => <TituloRow key={t.id} t={t} urgencia="vencido" />)}
          {vencidos.length > 10 && <p className="text-xs text-gray-400 text-center mt-2">+{vencidos.length - 10} mais</p>}
        </div>
      )}

      {/* Próximos */}
      {proximos.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-amber-500" />
            Vencem nos próximos 3 dias
          </h3>
          {proximos.map(t => <TituloRow key={t.id} t={t} urgencia="proximo" />)}
        </div>
      )}
    </div>
  );
}
