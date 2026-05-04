import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { DollarSign, TrendingUp, AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { useDashboard } from '../../lib/useSupabase';

export default function DashboardFinanciero() {
  const { stats, loading } = useDashboard();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9] mb-4" />
        <p className="text-slate-500 font-medium">Cargando métricas financieras...</p>
      </div>
    );
  }

  const dataIngresos = [
    { name: 'Lun', AltoFlujo: 4000, Regular: 2400 },
    { name: 'Mar', AltoFlujo: 3000, Regular: 1398 },
    { name: 'Mié', AltoFlujo: 2000, Regular: 9800 },
    { name: 'Jue', AltoFlujo: 2780, Regular: 3908 },
    { name: 'Vie', AltoFlujo: 1890, Regular: 4800 },
    { name: 'Sáb', AltoFlujo: 2390, Regular: 3800 },
  ];

  const dataSucursales = [
    { name: 'Alto Flujo', value: 65, color: '#0EA5E9' },
    { name: 'Regular', value: 35, color: '#8B5CF6' },
  ];

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Control Financiero</h1>
          <p className="text-sm text-slate-500">Métricas y Corte de Caja</p>
        </div>
        <button className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Exportar Reporte
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Ingresos Hoy" amount={`$${stats.ingresosHoy.toLocaleString()}`} icon={<DollarSign />} trend="Hoy" color="bg-emerald-50 text-emerald-600" />
        <KPICard title="Ingresos del Mes" amount={`$${stats.ingresosMes.toLocaleString()}`} icon={<TrendingUp />} trend="Mes" color="bg-sky-50 text-[#0EA5E9]" />
        <KPICard title="Cuentas por Cobrar" amount={`$${stats.cuentasPorCobrar.toLocaleString()}`} icon={<AlertCircle />} trend="Pendientes" color="bg-amber-50 text-amber-600" />
        <KPICard title="Citas de Hoy" amount={stats.citasHoy.length.toString()} icon={<CreditCard />} trend="Agenda" color="bg-rose-50 text-rose-600" />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-6">Ingresos Semanales por Sucursal</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataIngresos} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="AltoFlujo" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="Regular" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 w-full text-left">Distribución</h2>
          <div className="h-48 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dataSucursales} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                  {dataSucursales.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
              <span className="text-2xl font-bold text-slate-800">65%</span>
              <span className="text-xs font-medium text-slate-500">Alto Flujo</span>
            </div>
          </div>
          <div className="w-full mt-4 space-y-2">
            {dataSucursales.map(s => (
              <div key={s.name} className="flex justify-between items-center text-sm">
                <span className="flex items-center text-slate-600"><span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: s.color }}></span>{s.name}</span>
                <span className="font-semibold text-slate-800">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla Control de Pagos */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Control de Pagos Recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 bg-white">
                <th className="px-6 py-4 font-semibold">Fecha</th>
                <th className="px-6 py-4 font-semibold">Doctor/a</th>
                <th className="px-6 py-4 font-semibold">Paciente</th>
                <th className="px-6 py-4 font-semibold text-right">Monto (Abono)</th>
                <th className="px-6 py-4 font-semibold">Método</th>
              </tr>
            </thead>
            <tbody>
              {stats.pagosRecientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No hay pagos registrados recientemente.</td>
                </tr>
              ) : (
                stats.pagosRecientes.map((pago: any) => (
                  <motion.tr key={pago.id} whileHover={{ backgroundColor: '#F8FAFC' }} className="border-b border-slate-100 last:border-0 transition-colors text-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(pago.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-medium text-[#0EA5E9]">Dr. Carlos E.</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{pago.pacientes?.nombre}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-semibold">${Number(pago.monto).toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 capitalize">{pago.metodo_pago}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KPICard({ title, amount, icon, trend, color }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{trend}</span>
      </div>
      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <p className="text-2xl font-bold text-slate-800">{amount}</p>
      </div>
    </motion.div>
  );
}
