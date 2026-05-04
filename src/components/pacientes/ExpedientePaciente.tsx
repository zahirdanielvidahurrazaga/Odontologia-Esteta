import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Activity, FileText, Phone, Mail, MapPin, Calendar,
  CreditCard, Clock, ChevronRight, Plus, User, Heart, DollarSign,
  CheckCircle2, AlertCircle, Hourglass, Loader2
} from 'lucide-react';
import { usePaciente } from '../../lib/useSupabase';

function getEstadoBadge(estado: string) {
  switch (estado) {
    case 'pagado':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle2 className="w-3 h-3" /> Pagado</span>;
    case 'en_proceso':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200"><Hourglass className="w-3 h-3" /> En Proceso</span>;
    case 'pendiente':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-500 border border-red-200"><AlertCircle className="w-3 h-3" /> Pendiente</span>;
    default:
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200">{estado}</span>;
  }
}

export default function ExpedientePaciente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { paciente, historia, presupuestos, citas, pagos, odontograma, loading } = usePaciente(id);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9] mb-4" />
        <p className="text-slate-500 font-medium">Cargando expediente...</p>
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
        <h2 className="text-xl font-bold text-slate-800">Paciente no encontrado</h2>
        <p className="mt-2 mb-6 text-center max-w-xs">El expediente que buscas no existe o ha sido eliminado.</p>
        <button onClick={() => navigate('/pacientes')} className="text-[#0EA5E9] font-bold hover:underline flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Regresar al directorio
        </button>
      </div>
    );
  }

  // Cálculos financieros
  const totalTratamientos = presupuestos.reduce((sum, p) => sum + Number(p.total), 0);
  const totalAbonado = pagos.reduce((sum, p) => sum + Number(p.monto), 0);
  const saldoPendiente = totalTratamientos - totalAbonado;

  // Resumen de odontograma (basado en el estado actual de los dientes)
  const piezasTratadas = odontograma ? Object.values(odontograma.teeth_data).filter(t => t.generalPre || t.generalTx).length : 0;
  const lesionesActivas = odontograma ? Object.values(odontograma.teeth_data).filter(t => t.generalLesion).length : 0;
  const tratamientosPendientes = presupuestos.filter(p => p.estado !== 'pagado').length;

  return (
    <div className="w-full flex flex-col gap-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/pacientes')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{paciente.nombre}</h1>
            <p className="text-sm text-slate-500">
              {paciente.apodo ? `"${paciente.apodo}" • ` : ''}{paciente.edad ? `${paciente.edad} años • ` : ''}{paciente.ocupacion || 'Sin ocupación'} • Sucursal {paciente.sucursal_id === 'alto_flujo' ? 'Alto Flujo' : 'Regular'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link 
            to={`/pacientes/${id}/odontograma`}
            className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Activity className="w-4 h-4" /> Odontograma
          </Link>
          <button
            onClick={() => navigate('/', { state: { pacienteId: id, pacienteNombre: paciente.nombre, tratamiento: 'Consulta de seguimiento' } })}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <Calendar className="w-4 h-4" /> Agendar Cita
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <motion.div whileHover={{ y: -2 }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-slate-400 mb-1">
            <Activity className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Piezas Tratadas</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{piezasTratadas}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-amber-500 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">TX Pendientes</span>
          </div>
          <p className="text-2xl font-black text-amber-600">{tratamientosPendientes}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-red-400 mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Lesiones</span>
          </div>
          <p className="text-2xl font-black text-red-500">{lesionesActivas}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 text-[#0EA5E9] mb-1">
            <DollarSign className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Saldo Pend.</span>
          </div>
          <p className="text-2xl font-black text-[#0EA5E9]">${saldoPendiente.toLocaleString('es-MX')}</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Info */}
        <div className="space-y-6">
          {/* Datos Personales */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3.5 h-3.5" /> Datos Personales
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <InfoRow icon={<Phone className="w-3.5 h-3.5" />} label="Teléfono" value={paciente.telefono || 'Sin teléfono'} />
              <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={paciente.email || 'Sin email'} />
              <InfoRow icon={<MapPin className="w-3.5 h-3.5" />} label="Dirección" value={paciente.direccion || 'Sin dirección'} />
              <InfoRow icon={<Calendar className="w-3.5 h-3.5" />} label="Registro" value={new Date(paciente.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} />
            </div>
          </div>

          {/* Alertas Médicas */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-red-50">
              <h2 className="text-xs font-bold text-red-600 uppercase tracking-widest flex items-center gap-2">
                <Heart className="w-3.5 h-3.5" /> Alertas Médicas
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alergias</span>
                <p className={`text-sm font-medium mt-0.5 ${historia?.alergias && historia.alergias !== 'Ninguna' ? 'text-red-600 bg-red-50 px-2 py-1 rounded-lg inline-block' : 'text-slate-600'}`}>
                  {historia?.alergias || 'Ninguna'}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Observaciones Clínicas</span>
                <p className="text-sm font-medium text-slate-600 mt-0.5">{historia?.observaciones || 'Sin observaciones'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Center + Right Column: Presupuestos & Citas */}
        <div className="lg:col-span-2 space-y-6">
          {/* Presupuestos */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5" /> Presupuestos
              </h2>
              <Link 
                to={`/pacientes/${id}/odontograma`}
                className="text-[10px] font-bold text-[#0EA5E9] uppercase tracking-wider hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Nuevo
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {presupuestos.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No hay presupuestos generados para este paciente.
                </div>
              ) : (
                presupuestos.map((pres) => {
                  // Calcular abonos para este presupuesto específico
                  const abonosPres = pagos.filter(p => p.presupuesto_id === pres.id).reduce((s, p) => s + Number(p.monto), 0);
                  const porcentaje = pres.total > 0 ? Math.round((abonosPres / Number(pres.total)) * 100) : 0;
                  const itemsDesc = pres.items?.map(i => i.descripcion).join(', ') || 'Presupuesto sin items';

                  return (
                    <motion.div key={pres.id} whileHover={{ backgroundColor: '#F8FAFC' }} className="p-4 transition-colors cursor-pointer" onClick={() => navigate(`/pacientes/${id}/cotizacion`, { state: { presupuestoId: pres.id } })}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="max-w-[70%]">
                          <p className="text-sm font-semibold text-slate-800 truncate">{itemsDesc}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{new Date(pres.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        {getEstadoBadge(pres.estado)}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }} animate={{ width: `${porcentaje}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full ${porcentaje >= 100 ? 'bg-emerald-500' : 'bg-[#0EA5E9]'}`}
                            />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-sm font-bold text-slate-800">${abonosPres.toLocaleString('es-MX')}</span>
                          <span className="text-xs text-slate-400"> / ${Number(pres.total).toLocaleString('es-MX')}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
            {/* Totals */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Total acumulado</span>
              <span className="text-lg font-black text-slate-800">${totalTratamientos.toLocaleString('es-MX')}</span>
            </div>
          </div>

          {/* Historial de Citas */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" /> Historial de Citas
              </h2>
              <button 
                onClick={() => navigate('/', { state: { pacienteId: id, pacienteNombre: paciente.nombre, tratamiento: 'Consulta de seguimiento' } })}
                className="text-[10px] font-bold text-[#0EA5E9] uppercase tracking-wider hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Agendar
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {citas.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">
                  No hay citas registradas.
                </div>
              ) : (
                citas.map((cita, idx) => (
                  <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cita.estado === 'pendiente' ? 'bg-sky-50 text-[#0EA5E9]' : 'bg-emerald-50 text-emerald-500'}`}>
                      {cita.estado === 'pendiente' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{cita.tratamiento}</p>
                      <p className="text-xs text-slate-400">{cita.doctor_nombre} • {new Date(cita.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} a las {cita.hora.substring(0, 5)}</p>
                    </div>
                    <div>
                      {cita.estado === 'pendiente' 
                        ? <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-full border border-sky-200 uppercase">Próxima</span>
                        : <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200 uppercase">Completada</span>
                      }
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Registro de Pagos - Quick Action */}
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-5 flex items-center justify-between text-white shadow-lg">
            <div>
              <h3 className="font-bold text-base">¿Registrar un pago?</h3>
              <p className="text-sm text-slate-400 mt-0.5">Saldo pendiente: <span className="text-[#0EA5E9] font-bold">${saldoPendiente.toLocaleString('es-MX')}</span></p>
            </div>
            <button 
              className="flex items-center gap-2 px-5 py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] rounded-xl font-semibold text-sm transition-colors shadow-sm"
              onClick={() => {
                // Future: open payment modal
                alert('Módulo de pagos en construcción. Use Supabase para registrar abonos manualmente por ahora.');
              }}
            >
              <CreditCard className="w-4 h-4" /> Registrar Abono
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <p className="text-sm text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
