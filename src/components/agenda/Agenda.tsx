import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Plus, Clock, User, X, 
  Save, MapPin, Stethoscope, CalendarDays, Loader2
} from 'lucide-react';
import { useCitas, createCita } from '../../lib/useSupabase';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00
const DAYS_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const toLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fromLocalDateString = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const SUCURSALES = [
  { id: 'alto_flujo', label: 'Alto Flujo', color: '#0EA5E9' },
  { id: 'regular', label: 'Flujo Regular', color: '#8B5CF6' },
];

const DOCTORES = [
  { id: 'dr_carlos', label: 'Dr. Carlos E.' },
  { id: 'dra_maria', label: 'Dra. María G.' },
];

const getWeekDates = (offset: number) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0); // Normalize to midnight local time
  const day = d.getDay();
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day + (offset * 7));
  
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + i);
    return date;
  });
};

export default function Agenda() {
  const location = useLocation();
  const navigate = useNavigate();
  const [weekOffset, setWeekOffset] = useState(0);
  // Persistent selected date (initialized to today)
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem('agenda_selected_date');
    return saved || toLocalDateString(new Date());
  });
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>(() => {
    return (localStorage.getItem('agenda_view_mode') as any) || 'day';
  });
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state to localStorage
  useMemo(() => {
    localStorage.setItem('agenda_selected_date', selectedDate);
    localStorage.setItem('agenda_view_mode', viewMode);
  }, [selectedDate, viewMode]);
  
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const startDate = toLocalDateString(weekDates[0]);
  const endDate = toLocalDateString(weekDates[6]);
  
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
    fecha: toLocalDateString(weekDates[0]),
    hora: '09:00',
    duracion_min: 60,
  });

  // Open modal from cotización redirect
  useState(() => {
    if (prefilledPatientName) {
      setShowModal(true);
    }
  });


  const openNewAppointment = (dayIndex?: number, hour?: number) => {
    const dateStr = dayIndex !== undefined ? weekDates[dayIndex].toISOString().split('T')[0] : toLocalDateString(weekDates[0]);
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
    refetch();
  };


  return (
    <div className="w-full flex flex-col h-[calc(100vh-6rem)] bg-[#F8FAFC] overflow-hidden">
      
      {/* Header (iPhone Style) */}
      <div className="bg-white px-6 pt-6 shrink-0 border-b border-slate-100">
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <button 
              onClick={() => setViewMode('month')}
              className="text-[#0EA5E9] text-sm font-semibold flex items-center gap-1 -ml-1 hover:opacity-70 transition-opacity"
            >
              <ChevronLeft className="w-4 h-4" /> {fromLocalDateString(selectedDate).getFullYear()}
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mt-1 capitalize">
              {fromLocalDateString(selectedDate).toLocaleDateString('es-MX', { month: 'long' })}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 rounded-xl p-1">
              <button 
                onClick={() => setViewMode('day')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'day' ? 'bg-white shadow-sm text-[#0EA5E9]' : 'text-slate-500'}`}
              >
                <Clock className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('month')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'month' ? 'bg-white shadow-sm text-[#0EA5E9]' : 'text-slate-500'}`}
              >
                <CalendarDays className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => openNewAppointment()}
              className="text-[#0EA5E9] hover:opacity-70 transition-opacity"
            >
              <Plus className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Unified Calendar Header (Initials + Numbers) */}
        <div className={`mb-2 ${viewMode === 'day' ? 'block' : 'hidden'}`}>
          <div className="grid grid-cols-7 text-center mb-2 max-w-4xl mx-auto">
            {['D','L','M','M','J','V','S'].map((d, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 max-w-4xl mx-auto">
            {weekDates.map((date, idx) => {
              const dateStr = toLocalDateString(date);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === toLocalDateString(new Date());
              
              return (
                <div key={idx} className="flex justify-center">
                  <button
                    onClick={() => setSelectedDate(dateStr)}
                    className={`flex flex-col items-center justify-center w-10 h-10 rounded-full transition-all ${isSelected ? 'bg-[#0EA5E9] text-white shadow-lg shadow-sky-100' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`text-lg font-semibold ${isSelected ? 'text-white' : isToday ? 'text-[#0EA5E9]' : 'text-slate-900'}`}>
                      {date.getDate()}
                    </span>
                    {isToday && !isSelected && <div className="w-1 h-1 bg-[#0EA5E9] rounded-full mt-0.5" />}
                  </button>
                </div>
              );
            })}
          </div>
          <div className="text-center mt-4 pb-2 border-t border-slate-50">
            <p className="text-xs font-bold text-slate-900 capitalize pt-2 tracking-wide">
              {fromLocalDateString(selectedDate).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-auto custom-scrollbar relative bg-white">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
          </div>
        )}

        {/* Month View Grid */}
        {viewMode === 'month' && (
          <div className="grid grid-cols-7 auto-rows-fr h-full">
            {/* Generate month days logic */}
            {(() => {
              const d = fromLocalDateString(selectedDate);
              const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).getDay();
              const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
              const prevMonthDays = new Date(d.getFullYear(), d.getMonth(), 0).getDate();
              
              const cells = [];
              // Prev month filler
              for (let i = firstDay - 1; i >= 0; i--) {
                cells.push(<div key={`prev-${i}`} className="p-4 border-b border-r border-slate-50 text-slate-300 text-lg font-medium">{prevMonthDays - i}</div>);
              }
              // Current month
              for (let i = 1; i <= daysInMonth; i++) {
                const dateStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2,'0')}-${i.toString().padStart(2,'0')}`;
                const isToday = dateStr === toLocalDateString(new Date());
                const isSelected = selectedDate === dateStr;
                const hasEvents = citas.some(c => c.fecha === dateStr);

                cells.push(
                  <div 
                    key={i} 
                    onClick={() => { setSelectedDate(dateStr); setViewMode('day'); }}
                    className="p-4 border-b border-r border-slate-50 relative cursor-pointer hover:bg-slate-50 transition-colors flex flex-col items-center"
                  >
                    <span className={`text-lg font-medium w-8 h-8 flex items-center justify-center rounded-full ${isSelected ? 'bg-[#0EA5E9] text-white' : isToday ? 'text-[#0EA5E9]' : 'text-slate-900'}`}>
                      {i}
                    </span>
                    {hasEvents && <div className="mt-1 w-1.5 h-1.5 bg-slate-300 rounded-full" />}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        )}

        {/* Day View (iPhone Style) */}
        {viewMode === 'day' && (
          <div className="flex flex-col relative">
            {/* Current Time Line */}
            {selectedDate === toLocalDateString(new Date()) && (
              <div 
                className="absolute left-0 right-0 border-t-2 border-[#0EA5E9] z-10 flex items-center"
                style={{ 
                  top: `${(new Date().getHours() - 8 + new Date().getMinutes()/60) * 80 + 12}px` 
                }}
              >
                <div className="w-2.5 h-2.5 bg-[#0EA5E9] rounded-full -ml-1.5 shadow-sm" />
                <span className="ml-2 bg-[#0EA5E9] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
                  {new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            )}

            {HOURS.map(hour => {
              const hourStr = `${hour.toString().padStart(2, '0')}:00:00`;
              const hourCitas = citas.filter(c => c.fecha === selectedDate && c.hora === hourStr);
              
              return (
                <div key={hour} className="flex border-b border-slate-100 min-h-[80px] relative">
                  {/* Time Column */}
                  <div className="w-16 flex flex-col items-end pr-3 pt-2 shrink-0">
                    <span className="text-[11px] font-medium text-slate-400">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>

                  {/* Content Area */}
                  <div 
                    className="flex-1 p-2 relative cursor-pointer"
                    onClick={() => {
                      const dayIdx = weekDates.findIndex(d => d.toISOString().split('T')[0] === selectedDate);
                      openNewAppointment(dayIdx, hour);
                    }}
                  >
                    {hourCitas.map(appt => (
                      <motion.div
                        key={appt.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (appt.paciente_id) navigate(`/pacientes/${appt.paciente_id}`);
                        }}
                        className="bg-[#0EA5E9]/5 border-l-4 border-l-[#0EA5E9] rounded-r-lg p-3 flex flex-col gap-1 hover:bg-[#0EA5E9]/10 transition-all mb-2"
                      >
                        <h4 className="text-sm font-bold text-slate-900">{appt.paciente?.nombre}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1 text-[#0EA5E9]">{appt.hora.substring(0, 5)}</span>
                          <span>•</span>
                          <span>{appt.tratamiento}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Weekly Grid (Compatible with PC/iPad) */}
        {viewMode === 'week' && (
          <div className="w-full h-full">
            <div className="min-w-[800px]">
              {/* Day Headers */}
              <div className="grid grid-cols-[80px_repeat(7,1fr)] sticky top-0 z-10 bg-white border-b border-slate-200">
                <div className="p-3 border-r border-slate-100" />
                {weekDates.map((date, idx) => {
                  const isToday = toLocalDateString(date) === toLocalDateString(new Date());
                  return (
                    <div key={idx} className={`p-3 text-center border-r border-slate-100 last:border-0 ${isToday ? 'bg-red-50/30' : ''}`}>
                      <div className={`text-[10px] font-bold uppercase tracking-widest ${isToday ? 'text-[#0EA5E9]' : 'text-slate-400'}`}>
                        {DAYS_LABELS[idx]}
                      </div>
                      <div className={`text-lg font-bold mt-0.5 ${isToday ? 'text-white bg-[#0EA5E9] w-8 h-8 rounded-full flex items-center justify-center mx-auto' : 'text-slate-900'}`}>
                        {date.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Time Rows */}
              {HOURS.map(hour => (
                <div key={hour} className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-slate-100 min-h-[60px]">
                  <div className="p-2 text-right pr-4 border-r border-slate-100">
                    <span className="text-[11px] font-semibold text-slate-400">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>

                  {Array.from({ length: 7 }, (_, dayIdx) => {
                    const dayDateStr = toLocalDateString(weekDates[dayIdx]);
                    const hourStr = `${hour.toString().padStart(2, '0')}:00:00`;
                    const cellAppointments = citas.filter(a => a.fecha === dayDateStr && a.hora === hourStr);
                    const isToday = dayDateStr === toLocalDateString(new Date());

                    return (
                      <div 
                        key={dayIdx} 
                        className={`relative border-r border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors ${isToday ? 'bg-red-50/10' : ''}`}
                        onClick={() => openNewAppointment(dayIdx, hour)}
                      >
                        {cellAppointments.map(appt => (
                          <motion.div
                            key={appt.id}
                            className="absolute inset-x-1 top-1 rounded-lg px-2 py-1.5 bg-[#0EA5E9] text-white text-[10px] font-bold cursor-pointer hover:brightness-110 transition-all z-[5] shadow-sm"
                            style={{ height: `${(appt.duracion_min / 60) * 60 - 8}px` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (appt.paciente_id) navigate(`/pacientes/${appt.paciente_id}`);
                            }}
                          >
                            <div className="truncate">{appt.paciente?.nombre}</div>
                            <div className="opacity-80 truncate">{appt.hora.substring(0, 5)}</div>
                          </motion.div>
                        ))}
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

      {/* Bottom Floating Bar (iPhone style) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-xl border border-slate-200 rounded-full shadow-2xl px-6 py-3 flex items-center gap-8 z-40">
        <button 
          onClick={() => { setWeekOffset(0); setSelectedDate(new Date().toISOString().split('T')[0]); }}
          className="text-slate-900 font-bold text-sm hover:opacity-70 transition-opacity"
        >
          Hoy
        </button>
        <div className="w-px h-4 bg-slate-200" />
        <button onClick={() => setViewMode('month')} className={`p-1 ${viewMode === 'month' ? 'text-[#0EA5E9]' : 'text-slate-400'}`}>
          <CalendarDays className="w-6 h-6" />
        </button>
        <button onClick={() => setViewMode('day')} className={`p-1 ${viewMode === 'day' ? 'text-[#0EA5E9]' : 'text-slate-400'}`}>
          <Clock className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
