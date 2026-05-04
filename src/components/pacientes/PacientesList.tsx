import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, UserPlus, Phone, FileText, Activity, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePacientes } from '../../lib/useSupabase';

export default function PacientesList() {
  const navigate = useNavigate();
  const { pacientes, loading, refetch } = usePacientes();
  const [search, setSearch] = useState('');

  const handleSearch = (value: string) => {
    setSearch(value);
    refetch(value || undefined);
  };

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Pacientes</h1>
          <p className="text-sm text-slate-500">Directorio y expedientes clínicos</p>
        </div>
        <button 
          onClick={() => navigate('/pacientes/nuevo')}
          className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-4 py-2 rounded-lg font-medium flex items-center transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Nuevo Paciente
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Buscar por nombre..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9]"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#0EA5E9]" />
            <span className="ml-3 text-sm text-slate-500">Cargando pacientes...</span>
          </div>
        ) : pacientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <UserPlus className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm font-medium">No hay pacientes registrados</p>
            <button onClick={() => navigate('/pacientes/nuevo')} className="mt-3 text-sm text-[#0EA5E9] hover:underline font-medium">
              Registrar el primero →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 bg-white">
                  <th className="px-6 py-4 font-semibold">Paciente</th>
                  <th className="px-6 py-4 font-semibold">Contacto</th>
                  <th className="px-6 py-4 font-semibold">Sucursal</th>
                  <th className="px-6 py-4 font-semibold">Registro</th>
                  <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((patient) => (
                  <motion.tr 
                    key={patient.id} 
                    whileHover={{ backgroundColor: '#F8FAFC' }}
                    className="border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link to={`/pacientes/${patient.id}`} className="flex flex-col group">
                        <span className="font-semibold text-slate-800 group-hover:text-[#0EA5E9] transition-colors">{patient.nombre}</span>
                        {patient.apodo && <span className="text-xs text-slate-500 mt-0.5">"{patient.apodo}" • {patient.edad} años</span>}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <Phone className="w-3.5 h-3.5 mr-2 text-slate-400" />
                        {patient.telefono || 'Sin teléfono'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${patient.sucursal_id === 'alto_flujo' ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'bg-purple-50 text-purple-600 border border-purple-200'}`}>
                        {patient.sucursal_id === 'alto_flujo' ? 'Alto Flujo' : 'Regular'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-700">
                        {new Date(patient.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/pacientes/${patient.id}`}
                          className="p-2 text-slate-400 hover:text-[#0EA5E9] hover:bg-sky-50 rounded-lg transition-colors flex items-center justify-center group"
                          title="Ver Expediente"
                        >
                          <FileText className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </Link>
                        <Link 
                          to={`/pacientes/${patient.id}/odontograma`}
                          className="p-2 text-slate-400 hover:text-[#0EA5E9] hover:bg-sky-50 rounded-lg transition-colors flex items-center justify-center group"
                          title="Ver Odontograma"
                        >
                          <Activity className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </Link>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
