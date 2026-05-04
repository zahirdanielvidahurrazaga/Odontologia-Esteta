import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Save, Printer, FileSignature, Plus, Trash2, 
  CheckCircle, Calculator, ClipboardCheck, DollarSign, User, Calendar, CalendarDays, Loader2
} from 'lucide-react';
import { useCatalogo, usePaciente, createPresupuesto } from '../../lib/useSupabase';

interface LineItem {
  id: string;
  pieza: string;
  tratamiento: string;
  descripcion: string;
  precioUnitario: number;
  cantidad: number;
}

interface ToothState {
  generalPre: string | null;
  generalLesion: string | null;
  generalTx: string | null;
  surfacesPre: Record<string, string>;
  surfacesLesion: Record<string, string>;
  surfacesTx: Record<string, string>;
}

export default function CotizacionPresupuesto() {
  const { id: pacienteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sigCanvas = useRef<SignatureCanvas>(null);
  
  const { catalogo, loading: loadingCat } = useCatalogo();
  const { paciente, loading: loadingPac } = usePaciente(pacienteId);
  
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [descuento, setDescuento] = useState(0);
  const [notas, setNotas] = useState('');
  const [doctorNombre, setDoctorNombre] = useState('Dr. Carlos E.');

  // Mapear catálogo para búsqueda rápida
  const catalogoMap = useMemo(() => {
    const map: Record<string, { nombre: string; precio: number }> = {};
    catalogo.forEach(item => {
      map[item.codigo] = { nombre: item.nombre, precio: Number(item.precio) };
    });
    return map;
  }, [catalogo]);

  // On mount or catalog load, parse the teeth data from the odontogram
  useEffect(() => {
    if (loadingCat) return;

    const teethData: Record<number, ToothState> = location.state?.teethData || {};
    const generatedItems: LineItem[] = [];
    let counter = 0;

    const surfaceLabel = (s: string) => {
      const map: Record<string, string> = {
        top: 'Vestibular', bottom: 'Palatino/Lingual',
        left: 'Mesial', right: 'Distal', center: 'Oclusal'
      };
      return map[s] || s;
    };

    Object.entries(teethData).forEach(([toothNum, state]) => {
      // General TX
      if (state.generalTx && catalogoMap[state.generalTx]) {
        const cat = catalogoMap[state.generalTx];
        counter++;
        generatedItems.push({
          id: `item-${counter}`,
          pieza: `Pieza ${toothNum}`,
          tratamiento: state.generalTx,
          descripcion: cat.nombre,
          precioUnitario: cat.precio,
          cantidad: 1,
        });
      }

      // Surface TX
      Object.entries(state.surfacesTx || {}).forEach(([surface, txId]) => {
        if (catalogoMap[txId]) {
          const cat = catalogoMap[txId];
          counter++;
          generatedItems.push({
            id: `item-${counter}`,
            pieza: `Pieza ${toothNum} (${surfaceLabel(surface)})`,
            tratamiento: txId,
            descripcion: cat.nombre,
            precioUnitario: cat.precio,
            cantidad: 1,
          });
        }
      });

      // Surface Lesions (caries -> treatment)
      Object.entries(state.surfacesLesion || {}).forEach(([surface, lesionId]) => {
        if (catalogoMap[lesionId]) {
          const cat = catalogoMap[lesionId];
          counter++;
          generatedItems.push({
            id: `item-${counter}`,
            pieza: `Pieza ${toothNum} (${surfaceLabel(surface)})`,
            tratamiento: lesionId,
            descripcion: cat.nombre,
            precioUnitario: cat.precio,
            cantidad: 1,
          });
        }
      });
    });

    if (generatedItems.length > 0) {
      setItems(generatedItems);
    }
  }, [location.state, loadingCat, catalogoMap]);

  const addItem = () => {
    setItems(prev => [...prev, {
      id: `item-${Date.now()}`,
      pieza: '',
      tratamiento: '',
      descripcion: '',
      precioUnitario: 0,
      cantidad: 1,
    }]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.precioUnitario * item.cantidad), 0);
  const descuentoMonto = subtotal * (descuento / 100);
  const total = subtotal - descuentoMonto;

  const handleSave = async (redirectAgenda = false) => {
    if (!pacienteId) return;
    setSaving(true);
    
    const firmaData = sigCanvas.current?.toDataURL() || null;
    
    const { error } = await createPresupuesto({
      paciente_id: pacienteId,
      odontograma_id: location.state?.odontogramaId,
      doctor_nombre: doctorNombre,
      subtotal,
      descuento_pct: descuento,
      total,
      notas,
      firma_url: firmaData || undefined,
      items: items.map(i => ({
        pieza: i.pieza,
        descripcion: i.descripcion,
        precio_unitario: i.precioUnitario,
        cantidad: i.cantidad
      }))
    });

    setSaving(false);

    if (error) {
      alert('Error al guardar presupuesto: ' + error.message);
      return;
    }

    setSaved(true);
    
    if (redirectAgenda) {
      const tratamientoResumen = items.map(i => i.descripcion).filter(Boolean).slice(0, 2).join(', ');
      setTimeout(() => {
        navigate('/', { state: { pacienteId, pacienteNombre: paciente?.nombre, tratamiento: tratamientoResumen || 'Consulta dental' } });
      }, 1000);
    } else {
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const todayStr = new Date().toLocaleDateString('es-MX', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });

  if (loadingPac || loadingCat) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9] mb-4" />
        <p className="text-slate-500 font-medium">Cargando catálogo y datos...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col h-full px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-[#0EA5E9]" />
              Presupuesto / Cotización
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Generado desde el diagnóstico del odontograma • {todayStr}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${items.length > 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'}`}>
            {items.length > 0 ? `${items.length} Tratamientos` : 'Sin tratamientos'}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-6 md:p-8 space-y-8">

            {/* Datos Generales */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Paciente
                </label>
                <div className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-100 text-slate-500 font-medium">
                  {paciente?.nombre || 'Paciente desconocido'}
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                  <ClipboardCheck className="w-3 h-3" /> Doctor
                </label>
                <input 
                  type="text" value={doctorNombre} onChange={(e) => setDoctorNombre(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/50 hover:bg-slate-50" 
                />
              </div>
              <div className="flex flex-col">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Fecha
                </label>
                <input 
                  type="date" defaultValue={new Date().toISOString().split('T')[0]}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-400" 
                />
              </div>
            </section>

            {/* Tabla de Tratamientos */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#0EA5E9]" />
                  Desglose de Tratamientos
                </h2>
                <button 
                  onClick={addItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors text-sky-700 text-xs font-bold uppercase tracking-wider"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar Línea
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800 text-white">
                    <tr>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider w-10">#</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Pieza</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider">Tratamiento</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-right w-32">Precio Unit.</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-center w-20">Cant.</th>
                      <th className="p-3 font-semibold text-xs uppercase tracking-wider text-right w-32">Subtotal</th>
                      <th className="p-3 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 text-sm">
                          No hay tratamientos. Regresa al odontograma para agregar Planes de TX, o agrega líneas manualmente.
                        </td>
                      </tr>
                    )}
                    {items.map((item, idx) => (
                      <motion.tr 
                        key={item.id} 
                        initial={{ opacity: 0, y: 10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="border-t border-slate-100 hover:bg-slate-50/50 transition-colors group"
                      >
                        <td className="p-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                        <td className="p-3">
                          <input 
                            type="text" value={item.pieza} onChange={(e) => updateItem(item.id, 'pieza', e.target.value)}
                            placeholder="Ej: Pieza 16"
                            className="w-full bg-transparent focus:outline-none focus:bg-sky-50 px-2 py-1 rounded-lg transition-colors text-sm font-medium text-slate-700" 
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text" value={item.descripcion} onChange={(e) => updateItem(item.id, 'descripcion', e.target.value)}
                            placeholder="Ej: Corona de porcelana"
                            className="w-full bg-transparent focus:outline-none focus:bg-sky-50 px-2 py-1 rounded-lg transition-colors text-sm" 
                          />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-slate-400 text-xs">$</span>
                            <input 
                              type="number" value={item.precioUnitario} onChange={(e) => updateItem(item.id, 'precioUnitario', parseFloat(e.target.value) || 0)}
                              className="w-24 text-right bg-transparent focus:outline-none focus:bg-sky-50 px-2 py-1 rounded-lg transition-colors text-sm font-medium" 
                            />
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <input 
                            type="number" min="1" value={item.cantidad} onChange={(e) => updateItem(item.id, 'cantidad', parseInt(e.target.value) || 1)}
                            className="w-14 text-center bg-transparent focus:outline-none focus:bg-sky-50 px-2 py-1 rounded-lg transition-colors text-sm font-medium" 
                          />
                        </td>
                        <td className="p-3 text-right font-bold text-slate-800">
                          ${(item.precioUnitario * item.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="p-3">
                          <button 
                            onClick={() => removeItem(item.id)} 
                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-slate-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Totales y Descuento */}
            <section className="flex flex-col md:flex-row gap-6 justify-between">
              {/* Notas */}
              <div className="flex-1 max-w-md">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Notas / Observaciones</label>
                <textarea 
                  rows={3} value={notas} onChange={(e) => setNotas(e.target.value)}
                  placeholder="Notas adicionales para el paciente..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/50 resize-none" 
                />
              </div>
              
              {/* Resumen financiero */}
              <div className="w-full md:w-80 bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-medium">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-slate-600">
                  <span>Descuento</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" min="0" max="100" value={descuento} onChange={(e) => setDescuento(parseFloat(e.target.value) || 0)}
                      className="w-16 text-right px-2 py-1 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9]" 
                    />
                    <span className="text-xs text-slate-400">%</span>
                    <span className="text-red-500 font-medium ml-2">-${descuentoMonto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
                <div className="border-t-2 border-slate-300 pt-3 flex justify-between items-center">
                  <span className="text-base font-bold text-slate-800 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-black text-[#0EA5E9]">${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </section>

            {/* Firma */}
            <section className="flex flex-col items-center pt-4 border-t border-slate-100">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center text-sm">
                <FileSignature className="w-4 h-4 mr-2 text-[#0EA5E9]" /> Firma de Aceptación del Paciente
              </h3>
              <div className="w-full max-w-sm bg-white border-2 border-dashed border-slate-300 rounded-2xl relative overflow-hidden">
                <SignatureCanvas 
                  ref={sigCanvas} 
                  penColor="#0F172A" 
                  canvasProps={{ 
                    className: 'w-full h-40 cursor-crosshair touch-none', 
                    style: { backgroundColor: '#F8FAFC' } 
                  }} 
                />
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                  <span className="text-slate-400 text-xs font-medium px-4 text-center">Firme aquí con el dedo o mouse</span>
                </div>
              </div>
              <button 
                onClick={() => sigCanvas.current?.clear()} 
                className="mt-2 px-4 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Limpiar Firma
              </button>
            </section>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <button 
            onClick={() => navigate(-1)} 
            className="px-6 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors"
          >
            ← Regresar al Odontograma
          </button>
          <div className="flex items-center gap-3">
            <button className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-white border border-slate-200 rounded-xl transition-colors flex items-center gap-2">
              <Printer className="w-4 h-4" /> Imprimir / PDF
            </button>
            <button 
              onClick={() => handleSave(false)} 
              disabled={saving}
              className="bg-slate-800 hover:bg-slate-900 disabled:bg-slate-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center transition-colors shadow-sm gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button 
              onClick={() => handleSave(true)} 
              disabled={saving}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center transition-colors shadow-sm gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarDays className="w-4 h-4" />}
              {saving ? 'Agendando...' : 'Guardar y Agendar Cita'}
            </button>
          </div>
        </div>

        {/* Success Toast */}
        <AnimatePresence>
          {saved && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-20 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center font-medium text-sm"
            >
              <CheckCircle className="w-5 h-5 mr-3" /> Presupuesto Guardado Exitosamente
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
