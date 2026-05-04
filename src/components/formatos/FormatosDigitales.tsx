import { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, Printer, Save, CheckCircle, FileText, ClipboardList, Calculator } from 'lucide-react';

export default function FormatosDigitales() {
  const [activeTab, setActiveTab] = useState<'ficha' | 'consentimiento' | 'presupuesto'>('ficha');
  const [saved, setSaved] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Formatos Digitales (Modo iPad)</h1>
          <p className="text-sm text-slate-500">Paciente: Nuevo Registro</p>
        </div>
        
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button 
            onClick={() => setActiveTab('ficha')}
            className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ficha' ? 'bg-white text-[#0EA5E9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <ClipboardList className="w-4 h-4 mr-2" /> Ficha Rápida
          </button>
          <button 
            onClick={() => setActiveTab('consentimiento')}
            className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'consentimiento' ? 'bg-white text-[#0EA5E9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText className="w-4 h-4 mr-2" /> Consentimiento
          </button>
          <button 
            onClick={() => setActiveTab('presupuesto')}
            className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'presupuesto' ? 'bg-white text-[#0EA5E9] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Calculator className="w-4 h-4 mr-2" /> Presupuesto
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {activeTab === 'ficha' && <FichaRapida key="ficha" onSave={handleSave} />}
          {activeTab === 'consentimiento' && <Consentimiento key="cons" sigCanvas={sigCanvas} onSave={handleSave} />}
          {activeTab === 'presupuesto' && <Presupuesto key="pres" sigCanvas={sigCanvas} onSave={handleSave} />}
        </AnimatePresence>

        {saved && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg flex items-center font-medium"
          >
            <CheckCircle className="w-5 h-5 mr-3" /> Documento Guardado en Nube
          </motion.div>
        )}
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function FichaRapida({ onSave }: { onSave: () => void }) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const handleChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const questions = [
    "¿Está bajo tratamiento médico actualmente?", "¿Ha estado hospitalizado alguna vez?",
    "¿Ha recibido alguna transfusión sanguínea?", "¿Está tomando algún tipo de medicamento o droga?",
    "¿Tiene o ha tenido algún trastorno alimenticio?", "¿Tiene alguna alergia a medicamentos o alimentos?",
    "¿Tiene o ha tenido alguna enfermedad respiratoria?", "¿Tiene o ha tenido alguna enfermedad cardiaca?",
    "¿Tiene usted hipertensión o diabetes? ¿Alguno de sus familiares cercanos?",
    "¿Ha tenido tuberculosis o hepatitis?", "¿Ha presentado alteraciones en el sangrado?",
    "¿Tuvo, tiene sospecha de algún tipo de enfermedad venérea o SIDA?", "¿Hay posibilidad de que esté embarazada?",
    "¿Tiene perforaciones y/o tatuajes?", "¿Toma alcohol y/o fuma?",
    "¿Tiene o ha tenido alguna vez ataques de pánico, ansiedad o depresión?"
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 md:p-8 space-y-8">
        
        {/* Datos Identificación */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Datos de Identificación</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="Nombre completo" />
            <Input label="Me gusta que me digan" />
            <Input label="Edad" type="number" />
            <Input label="Teléfono de contacto" type="tel" />
            <Input label="Correo electrónico" type="email" />
            <Input label="Ocupación" />
            <Input label="Dirección" className="md:col-span-2 lg:col-span-3" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <Input label="T.A." placeholder="120/80" />
            <Input label="Pulso" placeholder="lpm" />
            <Input label="F.R." placeholder="rpm" />
            <Input label="Peso" placeholder="kg" />
            <Input label="Talla" placeholder="cm" />
          </div>
        </section>

        {/* Cuestionario Médico */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Cuestionario Médico</h2>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                <span className="text-sm font-medium text-slate-700 mb-2 sm:mb-0 pr-4">{q}</span>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => handleChange(`q_${idx}`, true)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${formData[`q_${idx}`] === true ? 'bg-[#0EA5E9] text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Sí</button>
                  <button onClick={() => handleChange(`q_${idx}`, false)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${formData[`q_${idx}`] === false ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>No</button>
                </div>
              </div>
            ))}
            <div className="pt-2">
              <Input label="En caso afirmativo en alguna de las anteriores (Especifique y diga si está controlado):" textarea />
              <Input label="¿Tiene o ha tenido algún otro padecimiento importante?" textarea className="mt-3" />
            </div>
          </div>
        </section>

        {/* Historia Dental */}
        <section>
          <h2 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Historia Dental</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input label="¿Cuánto tiempo tiene tu última visita al dentista?" />
            <Input label="¿Qué tratamiento te hicieron?" />
          </div>
          <div className="space-y-3">
            {["¿Tuviste tratamiento de ortodoncia?", "¿Padeces de sensibilidad dental?", "¿Padeces de sangrado de encías?", "¿Te gusta tu sonrisa?"].map((q, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium text-slate-700">{q}</span>
                <div className="flex gap-2">
                  <button onClick={() => handleChange(`d_${idx}`, true)} className={`px-4 py-1 rounded-md text-sm transition-colors ${formData[`d_${idx}`] === true ? 'bg-sky-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Sí</button>
                  <button onClick={() => handleChange(`d_${idx}`, false)} className={`px-4 py-1 rounded-md text-sm transition-colors ${formData[`d_${idx}`] === false ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>No</button>
                </div>
              </div>
            ))}
            <Input label="¿Qué cambiarías de tu sonrisa: Tamaño, Forma, Posición o color?" className="mt-4" />
            <Input label="Redacta el motivo de tu consulta" textarea />
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
        <button onClick={onSave} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-8 py-3 rounded-xl font-medium flex items-center transition-colors shadow-sm">
          <Save className="w-5 h-5 mr-2" /> Guardar Ficha
        </button>
      </div>
    </motion.div>
  );
}

function Input({ label, type = "text", placeholder, className = "", textarea = false }: any) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
      {textarea ? (
        <textarea rows={3} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/50 hover:bg-slate-50 resize-none" />
      ) : (
        <input type={type} placeholder={placeholder} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/50 hover:bg-slate-50" />
      )}
    </div>
  );
}

function Consentimiento({ sigCanvas, onSave }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 md:p-10 flex-1">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input label="Nombre del paciente" placeholder="Juan Pérez Silva" />
            <Input label="Fecha" type="date" />
            <Input label="Médico al que se otorga el consentimiento" placeholder="Dr. Carlos E." />
            <Input label="Tratamiento específico a practicar" placeholder="Endodoncia pieza 16" />
         </div>
         <Input label="Riesgos o complicaciones advertidas" textarea placeholder="Describa los riesgos explicados..." className="mb-8" />
         
         <SignatureBox sigCanvas={sigCanvas} label="Firma del Paciente" />
      </div>
      <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
        <button onClick={() => sigCanvas.current?.clear()} className="px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">Limpiar Firma</button>
        <button onClick={onSave} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-8 py-3 rounded-xl font-medium flex items-center transition-colors shadow-sm">
          <Printer className="w-5 h-5 mr-2" /> Generar PDF Legal
        </button>
      </div>
    </motion.div>
  );
}

function Presupuesto({ sigCanvas, onSave }: any) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col h-full overflow-y-auto">
      <div className="p-6 md:p-8 flex-1">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <Input label="Nombre" />
            <Input label="Edad" />
            <Input label="Teléfono" />
            <Input label="E-mail" />
            <Input label="Fecha" type="date" />
            <Input label="Doctor/a" />
        </div>

        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Tabla de Cotización</h3>
        <div className="overflow-x-auto border border-slate-200 rounded-xl mb-8">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="p-3 font-semibold">Tratamiento (TX)</th>
                <th className="p-3 font-semibold text-right">Precio Unitario</th>
                <th className="p-3 font-semibold text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="p-3"><input type="text" placeholder="Endodoncia multirradicular" className="w-full bg-transparent focus:outline-none" /></td>
                <td className="p-3 text-right"><input type="number" placeholder="$250.00" className="w-24 text-right bg-transparent focus:outline-none" /></td>
                <td className="p-3 text-right"><input type="number" placeholder="$250.00" className="w-24 text-right bg-transparent focus:outline-none font-medium" /></td>
              </tr>
              <tr className="border-t border-slate-100 bg-slate-50">
                <td colSpan={2} className="p-3 text-right font-bold text-slate-700">TOTAL ESTIMADO</td>
                <td className="p-3 text-right font-bold text-[#0EA5E9] text-lg">$250.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        <SignatureBox sigCanvas={sigCanvas} label="Firma de Aceptación del Paciente" />
      </div>
      <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
        <button onClick={onSave} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-8 py-3 rounded-xl font-medium flex items-center transition-colors shadow-sm">
          <Save className="w-5 h-5 mr-2" /> Guardar Presupuesto
        </button>
      </div>
    </motion.div>
  );
}

function SignatureBox({ sigCanvas, label }: { sigCanvas: any, label: string }) {
  return (
    <div className="flex flex-col items-center mt-4">
      <h3 className="font-semibold text-slate-800 mb-3 flex items-center text-sm">
        <FileSignature className="w-4 h-4 mr-2 text-[#0EA5E9]" /> {label}
      </h3>
      <div className="w-full max-w-sm bg-white border-2 border-dashed border-slate-300 rounded-2xl relative overflow-hidden">
        <SignatureCanvas ref={sigCanvas} penColor="#0F172A" canvasProps={{ className: 'w-full h-40 cursor-crosshair touch-none', style: { backgroundColor: '#F8FAFC' } }} />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-50">
          <span className="text-slate-400 text-xs font-medium px-4 text-center">Firme aquí con el dedo</span>
        </div>
      </div>
    </div>
  );
}
