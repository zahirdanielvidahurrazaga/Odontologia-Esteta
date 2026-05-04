import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Plus, Clock, User, X, 
  Save, MapPin, Stethoscope, CheckCircle, CalendarDays, Loader2
} from 'lucide-react';
import { useCitas, createCita } from '../../lib/useSupabase';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00
const DAYS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

const SUCURSALES = [
  { id: 'alto_flujo', label: 'Alto Flujo', color: '#0EA5E9' },
  { id: 'regular', label: 'Flujo Regular', color: '#8B5CF6' },
];

const DOCTORES = [
  { id: 'dr_carlos', label: 'Dr. Carlos E.' },
  { id: 'dra_maria', label: 'Dra. María G.' },
];

const getWeekDates = (offset: number) => {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - today.getDay() + 1 + (offset * 7));
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

export default function Agenda() {
  const location = useLocation();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'week' | 'day'>('day'); // Default to day on mobile
  const [showModal, setShowModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const startDate = weekDates[0].toISOString().split('T')[0];
  const endDate = weekDates[5].toISOString().split('T')[0];
  
  const { citas, loading, refetch } = useCitas(startDate, endDate);

  // Pre-fill from cotización navigation
  const prefilledPatientId = location.state?.pacienteId || null;
  const prefilledPatientName = location.state?.pacienteNombre || '';
  const prefilledTratamiento = location.state?.tratamiento || '';

  const [newAppt, setNewAppt] = useState({
    paciente_id: prefilledPatientId,
    paciente_nombre: prefilledPatientName,
    doctor_nombre: DOCTORES[0].label,
    sucursal_id: 'alto_flujo',
    tratamiento: prefilledTratamiento,
    fecha: weekDates[0].toISOString().split('T')[0],
    hora: '09:00',
    duracion_min: 60,
  });

  // Open modal from cotización redirect
  useState(() => {
    if (prefilledPatientName) {
      setShowModal(true);
    }
  });

  const monthLabel = weekDates[0].toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });

  const openNewAppointment = (dayIndex?: number, hour?: number) => {
    const dateStr = dayIndex !== undefined ? weekDates[dayIndex].toISOString().split('T')[0] : weekDates[0].toISOString().split('T')[0];
    const hourStr = hour !== undefined ? `${hour.toString().padStart(2, '0')}:00` : '09:00';
    
    setNewAppt({
      paciente_id: prefilledPatientId,
      paciente_nombre: prefilledPatientName || '',
      doctor_nombre: DOCTORES[0].label,
      sucursal_id: 'alto_flujo',
      tratamiento: prefilledTratamiento || '',
      fecha: dateStr,
      hora: hourStr,
      duracion_min: 60,
    });
    setShowModal(true);
  };

  const handleSaveAppointment = async () => {
    setSaving(true);
    const { error } = await createCita(newAppt);
    setSaving(false);

    if (error) {
      alert('Error al agendar cita: ' + error.message);
      return;
    }

    setShowModal(false);
    setSaved(true);
    refetch();
    setTimeout(() => setSaved(false), 3000);
  };

  const todayDayIndex = new Date().getDay() - 1; // 0=Mon in our system

  return (
    <div className="w-full flex flex-col h-[calc(100vh-6rem)] bg-[#F8FAFC] overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="md:hidden">
             <CalendarDays className="w-6 h-6 text-[#0EA5E9]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="hidden md:inline"><CalendarDays className="w-5 h-5 text-[#0EA5E9]" /></span> Agenda
            </h1>
            <p className="text-sm text-slate-500 capitalize">{monthLabel}</p>
          </div>
        </div>

        <div className="flex items-center w-full sm:w-auto justify-between sm:justify-end gap-3">
          {/* View Toggle (Mobile focus) */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button 
              onClick={() => setViewMode('day')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'day' ? 'bg-white text-[#0EA5E9] shadow-sm' : 'text-slate-500'}`}
            >
              Día
            </button>
            <button 
              onClick={() => setViewMode('week')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${viewMode === 'week' ? 'bg-white text-[#0EA5E9] shadow-sm' : 'text-slate-500'}`}
            >
              Semana
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button onClick={() => setWeekOffset(prev => prev - 1)} className="p-2 hover:bg-white rounded-lg transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <button onClick={() => { setWeekOffset(0); setSelectedDate(new Date().toISOString().split('T')[0]); }} className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-white rounded-lg transition-colors uppercase tracking-wider">
                Hoy
              </button>
              <button onClick={() => setWeekOffset(prev => prev + 1)} className="p-2 hover:bg-white rounded-lg transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <button 
              onClick={() => openNewAppointment()}
              className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white p-2 sm:px-4 sm:py-2 rounded-xl font-semibold text-sm flex items-center transition-colors shadow-sm gap-2"
            >
              <Plus className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Nueva Cita</span>
            </button>
          </div>
        </div>
      </div>

      {/* iPhone Style Date Picker (Mobile Only) */}
      <div className={`md:hidden bg-white border-b border-slate-100 px-4 py-3 shrink-0 overflow-x-auto no-scrollbar ${viewMode === 'day' ? 'block' : 'hidden'}`}>
        <div className="flex gap-4 min-w-max">
          {weekDates.map((date, idx) => {
            const dateStr = date.toISOString().split('T')[0];
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateStr)}
                className={`flex flex-col items-center gap-1 min-w-[50px] py-2 rounded-2xl transition-all ${isSelected ? 'bg-[#0EA5E9] text-white shadow-lg shadow-sky-100' : 'hover:bg-slate-50'}`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>
                  {DAYS_LABELS[idx]}
                </span>
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : isToday ? 'text-[#0EA5E9]' : 'text-slate-800'}`}>
                  {date.getDate()}
                </span>
                {isToday && !isSelected && <div className="w-1 h-1 bg-[#0EA5E9] rounded-full mt-0.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto custom-scrollbar relative bg-white">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
          </div>
        )}

        {/* Day View (iPhone Style) */}
        {viewMode === 'day' ? (
          <div className="flex flex-col">
            {HOURS.map(hour => {
              const hourStr = `${hour.toString().padStart(2, '0')}:00:00`;
              const hourCitas = citas.filter(c => c.fecha === selectedDate && c.hora === hourStr);
              
              return (
                <div key={hour} className="flex border-b border-slate-50 min-h-[80px] relative group">
                  {/* Time Column */}
                  <div className="w-16 flex flex-col items-center pt-3 border-r border-slate-50 shrink-0">
                    <span className="text-[11px] font-bold text-slate-400">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>

                  {/* Content Area */}
                  <div 
                    className="flex-1 p-2 relative cursor-pointer hover:bg-slate-50/50 transition-colors"
                    onClick={() => {
                      const dayIdx = weekDates.findIndex(d => d.toISOString().split('T')[0] === selectedDate);
                      openNewAppointment(dayIdx, hour);
                    }}
                  >
                    {hourCitas.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4 text-slate-200" />
                      </div>
                    )}
                    
                    {hourCitas.map(appt => (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (appt.paciente_id) navigate(`/pacientes/${appt.paciente_id}`);
                        }}
                        className="bg-white border border-slate-100 shadow-sm rounded-2xl p-3 flex flex-col gap-2 hover:shadow-md transition-all border-l-4 border-l-[#0EA5E9]"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{appt.doctor_nombre}</p>
                            <h4 className="text-sm font-bold text-slate-800">{appt.paciente?.nombre}</h4>
                          </div>
                          <div className="bg-sky-50 text-[#0EA5E9] p-2 rounded-lg">
                            <User className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {appt.hora.substring(0, 5)}</span>
                          <span className="flex items-center gap-1"><Stethoscope className="w-3.5 h-3.5" /> {appt.tratamiento}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Weekly Grid (Existing) */
          <div className="w-full h-full">
            <div className="md:hidden flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 uppercase py-2 bg-slate-50 border-b border-slate-200">
              <span>Desliza para ver la semana</span>
              <div className="w-8 h-1 bg-slate-200 rounded-full relative overflow-hidden">
                <motion.div animate={{ x: [0, 16, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-y-0 left-0 w-4 bg-[#0EA5E9] rounded-full" />
              </div>
            </div>
            
            <div className="min-w-[800px]">
              {/* Day Headers */}
              <div className="grid grid-cols-[80px_repeat(6,1fr)] sticky top-0 z-10 bg-white border-b border-slate-200">
                <div className="p-3 border-r border-slate-100" />
                {weekDates.map((date, idx) => {
                  const isToday = weekOffset === 0 && idx === todayDayIndex;
                  return (
                    <div key={idx} className={`p-3 text-center border-r border-slate-100 last:border-0 ${isToday ? 'bg-sky-50' : ''}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-[#0EA5E9]' : 'text-slate-400'}`}>
                        {DAYS_LABELS[idx]}
                      </div>
                      <div className={`text-lg font-bold mt-0.5 ${isToday ? 'text-white bg-[#0EA5E9] w-8 h-8 rounded-full flex items-center justify-center mx-auto' : 'text-slate-800'}`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Rows */}
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-[80px_repeat(6,1fr)] border-b border-slate-100 min-h-[60px]">
                  <div className="p-2 text-right pr-4 border-r border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>

                  {Array.from({ length: 6 }, (_, dayIdx) => {
                    const dayDateStr = weekDates[dayIdx].toISOString().split('T')[0];
                    const hourStr = `${hour.toString().padStart(2, '0')}:00:00`;
                    const cellAppointments = citas.filter(a => a.fecha === dayDateStr && a.hora === hourStr);
                    const isToday = weekOffset === 0 && dayIdx === todayDayIndex;

                    return (
                      <div 
                        key={dayIdx} 
                        className={`relative border-r border-slate-100 last:border-0 cursor-pointer hover:bg-sky-50/30 transition-colors ${isToday ? 'bg-sky-50/20' : ''}`}
                        onClick={() => openNewAppointment(dayIdx, hour)}
                      >
                        {cellAppointments.map(appt => {
                          const durationHours = appt.duracion_min / 60;
                          return (
                            <motion.div
                              key={appt.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute inset-x-1 top-1 rounded-lg px-2 py-1.5 text-white text-[10px] cursor-pointer hover:shadow-lg transition-shadow overflow-hidden z-[5]"
                              style={{ 
                                backgroundColor: '#0EA5E9',
                                height: `${durationHours * 60 - 8}px`,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (appt.paciente_id) navigate(`/pacientes/${appt.paciente_id}`);
                              }}
                            >
                              <div className="font-bold truncate">{appt.paciente?.nombre}</div>
                              <div className="opacity-80 truncate flex items-center gap-1 mt-0.5">
                                <Clock className="w-2.5 h-2.5" />
                                {appt.hora.substring(0, 5)}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Appointment Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden mt-auto md:mt-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-900 p-5 flex justify-between items-center text-white">
                <h3 className="font-bold text-base flex items-center gap-2">
                  <CalendarDays className="w-5 h-5" /> Agendar Nueva Cita
                </h3>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Patient */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <User className="w-3 h-3" /> Paciente
                  </label>
                  <input 
                    type="text" value={newAppt.paciente_nombre} onChange={(e) => setNewAppt(prev => ({ ...prev, paciente_nombre: e.target.value }))}
                    placeholder="Nombre del paciente"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-sky-100 bg-slate-50/50" 
                  />
                </div>

                {/* Treatment */}
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" /> Tratamiento / Motivo
                  </label>
                  <input 
                    type="text" value={newAppt.tratamiento} onChange={(e) => setNewAppt(prev => ({ ...prev, tratamiento: e.target.value }))}
                    placeholder="Ej: Corona pieza 16, Limpieza dental..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-sky-100 bg-slate-50/50" 
                  />
                </div>

                {/* Doctor & Sucursal */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Doctor</label>
                    <select 
                      value={newAppt.doctor_nombre} onChange={(e) => setNewAppt(prev => ({ ...prev, doctor_nombre: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] bg-slate-50/50"
                    >
                      {DOCTORES.map(d => <option key={d.id} value={d.label}>{d.label}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Sucursal
                    </label>
                    <select 
                      value={newAppt.sucursal_id} onChange={(e) => setNewAppt(prev => ({ ...prev, sucursal_id: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] bg-slate-50/50"
                    >
                      {SUCURSALES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Day, Time & Duration */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha</label>
                    <input 
                      type="date" value={newAppt.fecha} onChange={(e) => setNewAppt(prev => ({ ...prev, fecha: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] bg-slate-50/50"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Hora
                    </label>
                    <select 
                      value={newAppt.hora.substring(0, 5)} onChange={(e) => setNewAppt(prev => ({ ...prev, hora: `${e.target.value}:00` }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] bg-slate-50/50"
                    >
                      {HOURS.map(h => <option key={h} value={`${h.toString().padStart(2,'0')}:00`}>{h.toString().padStart(2,'0')}:00</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Duración</label>
                    <select 
                      value={newAppt.duracion_min} onChange={(e) => setNewAppt(prev => ({ ...prev, duracion_min: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] bg-slate-50/50"
                    >
                      <option value={30}>30 min</option>
                      <option value={60}>1 hora</option>
                      <option value={90}>1.5 horas</option>
                      <option value={120}>2 horas</option>
                      <option value={150}>2.5 horas</option>
                      <option value={180}>3 horas</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button 
                  onClick={handleSaveAppointment}
                  disabled={saving}
                  className="bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-sky-300 text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center transition-colors shadow-sm gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Agendando...' : 'Agendar Cita'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {saved && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }}
            className="fixed bottom-8 right-8 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center font-medium text-sm z-50"
          >
            <CheckCircle className="w-5 h-5 mr-3" /> Cita agendada exitosamente
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
