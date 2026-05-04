import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Stethoscope, Trash2, Save, FileText, Loader2 } from 'lucide-react';
import { useOdontograma } from '../../lib/useSupabase';

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const SEXTANTS = {
  S1: [18, 17, 16, 15, 14],
  S2: [13, 12, 11, 21, 22, 23],
  S3: [24, 25, 26, 27, 28],
  S4: [48, 47, 46, 45, 44],
  S5: [43, 42, 41, 31, 32, 33],
  S6: [34, 35, 36, 37, 38],
  UPPER: upperTeeth,
  LOWER: lowerTeeth
};

const COLOR_PRE = '#0EA5E9';      // Blue
const COLOR_LESION = '#0F172A';   // Black/Dark Slate
const COLOR_TX = '#EF4444';       // Red
const COLOR_BASE = '#CBD5E1';

const preexistencias = [
  { id: 'ausente', label: 'Ausente', type: 'general' },
  { id: 'corona_pre', label: 'Corona', type: 'general' },
  { id: 'corona_mal_pre', label: 'Corona (mal estado)', type: 'general' },
  { id: 'implante_pre', label: 'Implante', type: 'general' },
  { id: 'implante_mal_pre', label: 'Implante (mal estado)', type: 'general' },
  { id: 'endodoncia_pre', label: 'Endodoncia', type: 'general' },
  { id: 'endodoncia_mal_pre', label: 'Endo (mal estado)', type: 'general' },
  { id: 'amalgama_pre', label: 'Amalgama', type: 'surface' },
  { id: 'amalgama_mal_pre', label: 'Amalgama (mal estado)', type: 'surface' },
  { id: 'restauracion_pre', label: 'Restauración', type: 'surface' },
  { id: 'sellante_pre', label: 'Sellante', type: 'surface' },
];

const lesiones = [
  { id: 'caries', label: 'Caries', type: 'surface' },
  { id: 'fractura', label: 'Fractura', type: 'general' },
  { id: 'infeccion_pulpar', label: 'Infección Pulpar', type: 'general' },
];

const planesTratamiento = [
  { id: 'extraccion_tx', label: 'Extracción', type: 'general' },
  { id: 'corona_tx', label: 'Corona a realizar', type: 'general' },
  { id: 'implante_tx', label: 'Implante a realizar', type: 'general' },
  { id: 'endodoncia_tx', label: 'Endodoncia', type: 'general' },
  { id: 'amalgama_tx', label: 'Amalgama', type: 'surface' },
  { id: 'restauracion_tx', label: 'Restauración', type: 'surface' },
  { id: 'sellante_tx', label: 'Sellante', type: 'surface' },
];

type Surface = 'top' | 'bottom' | 'left' | 'right' | 'center' | 'tooth';

interface ToothState {
  generalPre: string | null;
  generalLesion: string | null;
  generalTx: string | null;
  surfacesPre: Record<string, string>;
  surfacesLesion: Record<string, string>;
  surfacesTx: Record<string, string>;
}

export default function Odontogram() {
  const navigate = useNavigate();
  const { id: pacienteId } = useParams();
  const { odontograma, loading: loadingOdo, saveOdontograma } = useOdontograma(pacienteId);
  
  const [selectedTeeth, setSelectedTeeth] = useState<number[]>([]);
  const [activeSurface, setActiveSurface] = useState<Surface>('tooth');
  const [teethData, setTeethData] = useState<Record<number, ToothState>>({});
  const [sidebarTab, setSidebarTab] = useState<'pre' | 'lesiones' | 'tx'>('pre');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (odontograma?.teeth_data) {
      setTeethData(odontograma.teeth_data as any);
    }
  }, [odontograma]);

  const hasTreatments = Object.values(teethData).some(d => d.generalTx || Object.keys(d.surfacesTx).length > 0 || Object.keys(d.surfacesLesion).length > 0);

  const handleSave = async (redirect = false) => {
    setSaving(true);
    const { data, error } = await saveOdontograma(teethData, 'Dr. Carlos E.'); // Future: get doctor from auth
    setSaving(false);

    if (error) {
      alert('Error al guardar el odontograma: ' + error.message);
      return null;
    }

    if (redirect && data) {
      navigate(`/pacientes/${pacienteId}/cotizacion`, { state: { teethData, odontogramaId: data.id } });
    }
    return data;
  };

  const toggleToothSelection = (num: number, surface: Surface) => {
    setActiveSurface(surface);
    if (!isSidebarOpen) setIsSidebarOpen(true);
    
    if (selectedTeeth.includes(num)) {
      if (surface === 'tooth' && selectedTeeth.length === 1) {
        setSelectedTeeth([]);
        setIsSidebarOpen(false);
      } else if (surface !== 'tooth') {
        setSelectedTeeth([num]); 
      }
    } else {
      if (surface !== 'tooth') {
        setSelectedTeeth([num]);
      } else {
        setSelectedTeeth(prev => [...prev, num]);
      }
    }
  };

  const selectZone = (teethGroup: number[]) => {
    setSelectedTeeth(teethGroup);
    setActiveSurface('tooth');
    if (!isSidebarOpen) setIsSidebarOpen(true);
  };

  const applyDiagnosis = (conditionId: string, conditionType: string) => {
    if (selectedTeeth.length === 0) return;

    setTeethData(prev => {
      const newState = { ...prev };
      selectedTeeth.forEach(num => {
        const current = newState[num] || { generalPre: null, generalLesion: null, generalTx: null, surfacesPre: {}, surfacesLesion: {}, surfacesTx: {} };
        if (conditionType === 'general') {
          if (sidebarTab === 'pre') current.generalPre = conditionId;
          if (sidebarTab === 'lesiones') current.generalLesion = conditionId;
          if (sidebarTab === 'tx') current.generalTx = conditionId;
        } else {
          if (sidebarTab === 'pre') current.surfacesPre = { ...current.surfacesPre, [activeSurface]: conditionId };
          if (sidebarTab === 'lesiones') current.surfacesLesion = { ...current.surfacesLesion, [activeSurface]: conditionId };
          if (sidebarTab === 'tx') current.surfacesTx = { ...current.surfacesTx, [activeSurface]: conditionId };
        }
        newState[num] = current;
      });
      return newState;
    });
  };

  const clearSelectionDiagnosis = () => {
    setTeethData(prev => {
      const newState = { ...prev };
      selectedTeeth.forEach(num => {
         newState[num] = { generalPre: null, generalLesion: null, generalTx: null, surfacesPre: {}, surfacesLesion: {}, surfacesTx: {} };
      });
      return newState;
    });
    setSelectedTeeth([]);
    setIsSidebarOpen(false);
  };

  const getSurfaceFill = (num: number, surface: string) => {
    const data = teethData[num];
    if (!data) return '#FFFFFF';
    if (data.surfacesTx[surface]) return COLOR_TX;
    if (data.surfacesLesion[surface]) return COLOR_LESION;
    if (data.surfacesPre[surface]) return COLOR_PRE;
    return '#FFFFFF';
  };

  const ToothSurfaceGraph = ({ num }: { num: number }) => (
    <svg viewBox="0 0 100 100" className="w-8 h-8 md:w-9 md:h-9 mt-1 mb-1 filter drop-shadow-sm z-10 relative">
      <motion.path whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); toggleToothSelection(num, 'top'); }} d="M 33 33 L 16 16 A 48 48 0 0 1 84 16 L 67 33 A 24 24 0 0 0 33 33 Z" stroke={COLOR_BASE} strokeWidth="3" fill={getSurfaceFill(num, 'top')} className="cursor-pointer transition-colors" />
      <motion.path whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); toggleToothSelection(num, 'right'); }} d="M 67 33 L 84 16 A 48 48 0 0 1 84 84 L 67 67 A 24 24 0 0 0 67 33 Z" stroke={COLOR_BASE} strokeWidth="3" fill={getSurfaceFill(num, 'right')} className="cursor-pointer transition-colors" />
      <motion.path whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); toggleToothSelection(num, 'bottom'); }} d="M 67 67 L 84 84 A 48 48 0 0 1 16 84 L 33 67 A 24 24 0 0 0 67 67 Z" stroke={COLOR_BASE} strokeWidth="3" fill={getSurfaceFill(num, 'bottom')} className="cursor-pointer transition-colors" />
      <motion.path whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); toggleToothSelection(num, 'left'); }} d="M 33 67 L 16 84 A 48 48 0 0 1 16 16 L 33 33 A 24 24 0 0 0 33 67 Z" stroke={COLOR_BASE} strokeWidth="3" fill={getSurfaceFill(num, 'left')} className="cursor-pointer transition-colors" />
      <motion.circle whileHover={{ scale: 1.05 }} onClick={(e) => { e.stopPropagation(); toggleToothSelection(num, 'center'); }} cx="50" cy="50" r="24" stroke={COLOR_BASE} strokeWidth="3" fill={getSurfaceFill(num, 'center')} className="cursor-pointer transition-colors" />
    </svg>
  );

  const getToothAnatomy = (num: number) => {
    const digit = num % 10;
    if (digit === 1 || digit === 2) return "M7 6C6 8 6 12 7 14C8 16 9 18 9 20C9 21.5 10 22 12 22C14 22 15 21.5 15 20C15 18 16 16 17 14C18 12 18 8 17 6C16 3 14 2 12 2C10 2 8 3 7 6Z";
    if (digit === 3) return "M8 5C7 8 7 12 8 14C9 16 10 18 11 20C11.5 21.5 12 22 12 22C12 22 12.5 21.5 13 20C14 18 15 16 16 14C17 12 17 8 16 5C15 2.5 13 2 12 2C11 2 9 2.5 8 5Z";
    if (digit === 4 || digit === 5) return "M6 6C6 8 7 10 8 12C9 14 9 16 9.5 18C10 20 10.5 22 12 22C13.5 22 14 20 14.5 18C15 16 15 14 16 12C17 10 18 8 18 6C18 3 15 2 12 2C9 2 6 3 6 6Z";
    return "M4 6C4 8 5 10 6 12C7 14 7 16 7.5 18C8 20 8.5 22 10 22C11 22 11.5 20 12 18C12.5 20 13 22 14 22C15.5 22 16 20 16.5 18C17 16 17 14 18 12C19 10 20 8 20 6C20 3 17 2 12 2C7 2 4 3 4 6Z";
  };

  const renderOverlays = (data: ToothState, num: number) => {
    if (!data) return null;

    const overlays = [];
    const colorTx = COLOR_TX;
    const colorPre = COLOR_PRE;
    const colorLesion = COLOR_LESION;

    // Ausente / Extraccion
    const isAbsent = data.generalPre === 'ausente' || data.generalTx === 'extraccion_tx';
    if (isAbsent) {
      const color = data.generalTx === 'extraccion_tx' ? colorTx : colorPre;
      overlays.push(<path key="absent" d="M4 4 L20 20 M20 4 L4 20" stroke={color} strokeWidth="2" strokeLinecap="round" />);
    }

    // Fractura
    if (data.generalLesion === 'fractura') {
      overlays.push(<path key="fracture" d="M12 4 L14 12 L10 14 L12 22" fill="none" stroke={colorLesion} strokeWidth="1.5" strokeLinejoin="miter" />);
    }

    // Infección Pulpar
    if (data.generalLesion === 'infeccion_pulpar') {
      overlays.push(<path key="infeccion" d="M10 2 Q12 6 14 2" fill="none" stroke={colorLesion} strokeWidth="2" strokeLinecap="round" />);
    }

    // Implante
    const implanteTx = data.generalTx === 'implante_tx';
    const implantePre = data.generalPre?.includes('implante_');
    if (implantePre || implanteTx) {
      const color = implanteTx ? colorTx : colorPre;
      const isBad = data.generalPre === 'implante_mal_pre';
      overlays.push(
        <g key="implant" stroke={color} strokeWidth="1.5" strokeDasharray={isBad ? "2,1" : "none"}>
          <path d="M9 3 L15 3 M10 6 L14 6 M11 9 L13 9 M12 3 L12 12" />
        </g>
      );
    }

    // Endodoncia
    const endoTx = data.generalTx === 'endodoncia_tx';
    const endoPre = data.generalPre?.includes('endodoncia_');
    if (endoPre || endoTx) {
      const color = endoTx ? colorTx : colorPre;
      const isBad = data.generalPre === 'endodoncia_mal_pre';
      overlays.push(
        <g key="endo" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray={isBad ? "2,2" : "none"}>
          <path d="M12 3 L12 10" />
          {[1,2,3,6,7,8].includes(num%10) && <path d="M9 4 L11 9" />}
          {[1,2,3,6,7,8].includes(num%10) && <path d="M15 4 L13 9" />}
        </g>
      );
    }

    // Corona
    const coronaTx = data.generalTx === 'corona_tx';
    const coronaPre = data.generalPre?.includes('corona_');
    if (coronaPre || coronaTx) {
      const color = coronaTx ? colorTx : colorPre;
      const isBad = data.generalPre === 'corona_mal_pre';
      overlays.push(
        <circle key="corona" cx="12" cy="18" r="5" stroke={color} strokeWidth="1.5" fill="none" strokeDasharray={isBad ? "2,2" : "none"} />
      );
    }

    return overlays;
  };

  const ToothIcon = ({ num, isUpper }: { num: number, isUpper: boolean }) => {
    const isSelected = selectedTeeth.includes(num);
    const data = teethData[num];
    const isAbsent = data?.generalPre === 'ausente' || data?.generalTx === 'extraccion_tx';

    return (
      <div className={`flex flex-col items-center relative transition-opacity ${isAbsent ? 'opacity-40' : 'opacity-100'}`}>
        {isUpper && <div className={`text-[10px] font-bold mb-1 ${isSelected ? 'text-[#0EA5E9]' : 'text-slate-500'}`}>{num}</div>}
        {!isUpper && <ToothSurfaceGraph num={num} />}

        <div className="relative cursor-pointer flex flex-col items-center" onClick={() => toggleToothSelection(num, 'tooth')}>
          {isSelected && <div className="absolute inset-[-4px] bg-sky-100/50 rounded-xl border border-sky-200 -z-10" />}
          
          <svg viewBox="0 0 24 24" fill="#FFFFFF" stroke={COLOR_BASE} strokeWidth="1" className={`w-8 h-10 md:w-9 md:h-12 transition-transform ${isUpper ? '' : 'rotate-180'}`}>
            <path d={getToothAnatomy(num)} />
            {renderOverlays(data, num)}
          </svg>
        </div>
        
        {isUpper && <ToothSurfaceGraph num={num} />}
        {!isUpper && <div className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-[#0EA5E9]' : 'text-slate-500'}`}>{num}</div>}
      </div>
    );
  };

  const MiniToothSVG = ({ id, tab }: { id: string, tab: string }) => {
    const color = tab === 'pre' ? COLOR_PRE : tab === 'lesiones' ? COLOR_LESION : COLOR_TX;
    const isBad = id.includes('mal');
    const dash = isBad ? "2,2" : "none";

    return (
      <svg viewBox="0 0 24 24" className="w-6 h-6 mb-1" fill="transparent" stroke="#94A3B8" strokeWidth="1">
        <path d="M7 6C6 8 6 12 7 14C8 16 9 18 9 20C9 21.5 10 22 12 22C14 22 15 21.5 15 20C15 18 16 16 17 14C18 12 18 8 17 6C16 3 14 2 12 2C10 2 8 3 7 6Z" />
        {id.includes('ausente') || id.includes('extraccion') ? <path d="M4 4 L20 20 M20 4 L4 20" stroke={color} strokeWidth="2" /> : null}
        {id.includes('fractura') ? <path d="M12 4 L14 12 L10 14 L12 22" stroke={color} strokeWidth="1.5" /> : null}
        {id.includes('infeccion') ? <path d="M10 2 Q12 6 14 2" stroke={color} strokeWidth="2" /> : null}
        {id.includes('corona') ? <circle cx="12" cy="18" r="5" stroke={color} strokeWidth="1.5" strokeDasharray={dash} /> : null}
        {id.includes('implante') ? <path d="M9 3 L15 3 M10 6 L14 6 M11 9 L13 9 M12 3 L12 12" stroke={color} strokeWidth="1.5" strokeDasharray={dash} /> : null}
        {id.includes('endodoncia') ? <path d="M12 3 L12 10" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeDasharray={dash} /> : null}
        {id.includes('restauracion') || id.includes('caries') || id.includes('amalgama') || id.includes('sellante') ? <circle cx="12" cy="18" r="3" fill={color} stroke="none" /> : null}
      </svg>
    );
  };

  const tabsConfig = [
    { id: 'pre', label: 'Preexistencias', color: 'text-[#0EA5E9]', bg: 'bg-[#0EA5E9]', list: preexistencias },
    { id: 'lesiones', label: 'Lesiones', color: 'text-slate-800', bg: 'bg-slate-800', list: lesiones },
    { id: 'tx', label: 'Planes de TX', color: 'text-[#EF4444]', bg: 'bg-[#EF4444]', list: planesTratamiento }
  ] as const;

  return (
    <div className="w-full flex flex-col relative h-[calc(100vh-6rem)] bg-[#F8FAFC] overflow-hidden rounded-xl border border-slate-200">
      
      {/* Main Container */}
      <div className={`flex-1 flex flex-col items-center bg-white m-2 mb-0 rounded-t-xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'mr-[320px]' : ''}`}>
        
        {/* Header with Save Button */}
        <div className="w-full flex items-center justify-between px-6 py-3 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-sm font-bold text-slate-600 uppercase tracking-wider">Odontograma Inicial</h2>
          <div className="flex items-center gap-3">
            {hasTreatments && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] disabled:bg-sky-300 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                {saving ? 'Guardando...' : 'Generar Presupuesto'}
              </motion.button>
            )}
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 rounded-xl text-sm font-medium transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar
            </button>
          </div>
        </div>

        <div className="w-full flex-1 overflow-auto custom-scrollbar flex items-center justify-center p-8">
          {loadingOdo ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9] mb-4" />
              <p className="text-slate-500 font-medium">Cargando datos del odontograma...</p>
            </div>
          ) : (
            <div className="min-w-[850px] flex flex-col gap-6 items-center justify-center relative">
              
              <div className="flex gap-1.5 items-end">
                {upperTeeth.map(num => <ToothIcon key={num} num={num} isUpper={true} />)}
              </div>
              
              <div className="w-full flex items-center justify-center my-4 opacity-50">
                <div className="h-px bg-slate-300 flex-1"></div>
                <span className="px-4 text-[9px] font-bold tracking-[0.2em] text-slate-400 uppercase">Línea Media</span>
                <div className="h-px bg-slate-300 flex-1"></div>
              </div>

              <div className="flex gap-1.5 items-start">
                {lowerTeeth.map(num => <ToothIcon key={num} num={num} isUpper={false} />)}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* Zonal Selection Bar (Sextants & Arches) */}
      <div className={`bg-white border-t border-slate-200 p-3 mx-2 mb-2 rounded-b-xl flex flex-wrap items-center justify-center gap-2 shadow-sm transition-all duration-300 ${isSidebarOpen ? 'mr-[320px]' : ''}`}>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-2 w-full text-center md:w-auto md:text-left mb-2 md:mb-0">Zonas Rápidas:</span>
        <button onClick={() => selectZone(SEXTANTS.S1)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 20 L20 20 L5 5" /></svg>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Sextante 1</span>
        </button>
        <button onClick={() => selectZone(SEXTANTS.S2)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 5 L12 20 L20 5" /></svg>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Sextante 2</span>
        </button>
        <button onClick={() => selectZone(SEXTANTS.S3)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5 L20 20 L20 5" /></svg>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Sextante 3</span>
        </button>
        <button onClick={() => selectZone(SEXTANTS.S4)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5 L20 5 L5 20" /></svg>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Sextante 4</span>
        </button>
        <button onClick={() => selectZone(SEXTANTS.S5)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 20 L12 5 L20 20" /></svg>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Sextante 5</span>
        </button>
        <button onClick={() => selectZone(SEXTANTS.S6)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 20 L20 5 L20 20" /></svg>
          <span className="text-[10px] font-bold text-slate-600 uppercase">Sextante 6</span>
        </button>
        <div className="hidden md:block w-px h-6 bg-slate-200 mx-1"></div>
        <button onClick={() => selectZone(SEXTANTS.UPPER)} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors text-sky-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 20 C4 4, 20 4, 20 20" /></svg>
          <span className="text-[10px] font-bold uppercase">Arcada Sup.</span>
        </button>
        <button onClick={() => selectZone(SEXTANTS.LOWER)} className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors text-sky-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 4 C4 20, 20 20, 20 4" /></svg>
          <span className="text-[10px] font-bold uppercase">Arcada Inf.</span>
        </button>
      </div>

      <AnimatePresence>
        {selectedTeeth.length > 0 && (
          <motion.div initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }} className={`absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 transition-all duration-300 ${isSidebarOpen ? 'ml-[-160px]' : ''}`}>
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-full bg-[#0EA5E9] flex items-center justify-center text-sm font-bold shadow-inner">{selectedTeeth.length}</span>
              <span className="text-sm font-medium tracking-wide">Piezas seleccionadas</span>
            </div>
            <div className="h-5 w-px bg-slate-700" />
            <button onClick={() => { setSelectedTeeth([]); setIsSidebarOpen(false); }} className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center">
              <X className="w-4 h-4 mr-1.5" /> Descartar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: 320, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 320, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 250 }}
            className="absolute top-2 right-2 bottom-2 w-[300px] bg-white rounded-xl shadow-xl border border-slate-200 flex flex-col z-20 overflow-hidden"
          >
            <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
              <h3 className="font-semibold text-sm flex items-center gap-2 tracking-wide"><Stethoscope className="w-4 h-4" /> DIAGNÓSTICO</h3>
              <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex border-b border-slate-100 bg-slate-50/50">
              {tabsConfig.map(tab => (
                 <button 
                  key={tab.id}
                  onClick={() => setSidebarTab(tab.id as any)} 
                  className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${sidebarTab === tab.id ? `border-current ${tab.color} bg-white` : 'border-transparent text-slate-400 hover:text-slate-800'}`}
                 >
                   {tab.label}
                 </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[#F8FAFC]">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">
                Opciones ({activeSurface === 'tooth' ? 'Diente Completo' : `Cara: ${activeSurface}`})
              </p>
              
              <div className="grid grid-cols-2 gap-2.5">
                {tabsConfig.find(t => t.id === sidebarTab)?.list.filter(p => activeSurface === 'tooth' ? p.type === 'general' : p.type === 'surface').map(item => (
                  <button 
                    key={item.id} onClick={() => applyDiagnosis(item.id, item.type)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:shadow-sm bg-white hover:border-slate-300`}
                  >
                    <MiniToothSVG id={item.id} tab={sidebarTab} />
                    <span className="text-[10px] font-semibold text-slate-600 text-center leading-tight mt-1">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white">
              <button onClick={clearSelectionDiagnosis} className="w-full py-2.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors flex items-center justify-center gap-2">
                <Trash2 className="w-4 h-4" /> Anular Diagnóstico
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
