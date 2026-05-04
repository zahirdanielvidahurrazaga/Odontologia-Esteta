import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Save, FileSignature, CheckCircle, 
  ClipboardList, FileText, User, Heart, Loader2
} from 'lucide-react';
import { createPaciente, createHistoriaClinica, createConsentimiento } from '../../lib/useSupabase';

// Step indicator data
const steps = [
  { id: 1, label: 'Ficha Médica', icon: ClipboardList },
  { id: 2, label: 'Consentimiento', icon: FileText },
];

function Input({ label, type = "text", placeholder, className = "", textarea = false, value, onChange }: any) {
  return (
    <div className={`flex flex-col ${className}`}>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
      {textarea ? (
        <textarea 
          rows={3} placeholder={placeholder} value={value} onChange={onChange}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/50 hover:bg-slate-50 resize-none" 
        />
      ) : (
        <input 
          type={type} placeholder={placeholder} value={value} onChange={onChange}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-sky-100 transition-all bg-slate-50/50 hover:bg-slate-50" 
        />
      )}
    </div>
  );
}

export default function RegistroPaciente() {
  const navigate = useNavigate();
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      // 1. Create patient
      const { data: paciente, error: pacError } = await createPaciente({
        nombre: formData.nombre || 'Sin nombre',
        apodo: formData.apodo,
        edad: formData.edad ? parseInt(formData.edad) : undefined,
        telefono: formData.telefono,
        email: formData.email,
        direccion: formData.direccion,
        ocupacion: formData.ocupacion,
      });

      if (pacError || !paciente) {
        console.error('Error creating patient:', pacError);
        setSaving(false);
        return;
      }

      // 2. Create historia clínica
      const medQuestions: Record<string, boolean | string> = {};
      medicalQuestions.forEach((q, idx) => {
        if (formData[`q_${idx}`] !== undefined) medQuestions[q] = formData[`q_${idx}`];
      });
      if (formData.q_especificar) medQuestions['especificar'] = formData.q_especificar;
      if (formData.q_otro_padecimiento) medQuestions['otro_padecimiento'] = formData.q_otro_padecimiento;

      const dentalData: Record<string, any> = {};
      dentalQuestions.forEach((q, idx) => {
        if (formData[`d_${idx}`] !== undefined) dentalData[q] = formData[`d_${idx}`];
      });
      if (formData.ultima_visita_dentista) dentalData['ultima_visita'] = formData.ultima_visita_dentista;
      if (formData.ultimo_tratamiento) dentalData['ultimo_tratamiento'] = formData.ultimo_tratamiento;
      if (formData.cambiar_sonrisa) dentalData['cambiar_sonrisa'] = formData.cambiar_sonrisa;
      if (formData.motivo_consulta) dentalData['motivo_consulta'] = formData.motivo_consulta;

      await createHistoriaClinica({
        paciente_id: paciente.id,
        signos_vitales: {
          ta: formData.ta || '',
          pulso: formData.pulso || '',
          fr: formData.fr || '',
          peso: formData.peso || '',
          talla: formData.talla || '',
        },
        cuestionario_medico: medQuestions,
        historia_dental: dentalData,
        alergias: formData.alergias || 'Ninguna',
      });

      // 3. Create consentimiento
      const firmaData = sigCanvas.current?.toDataURL() || null;
      await createConsentimiento({
        paciente_id: paciente.id,
        doctor_nombre: formData.doctor_consentimiento,
        tratamiento: formData.tratamiento_consentimiento,
        riesgos: formData.riesgos_consentimiento,
        firma_url: firmaData || undefined,
      });

      setSaved(true);
      setTimeout(() => {
        navigate(`/pacientes/${paciente.id}/odontograma`);
      }, 1500);
    } catch (err) {
      console.error('Registration error:', err);
      setSaving(false);
    }
  };

  const medicalQuestions = [
    "¿Está bajo tratamiento médico actualmente?",
    "¿Ha estado hospitalizado alguna vez?",
    "¿Ha recibido alguna transfusión sanguínea?",
    "¿Está tomando algún tipo de medicamento o droga?",
    "¿Tiene o ha tenido algún trastorno alimenticio?",
    "¿Tiene alguna alergia a medicamentos o alimentos?",
    "¿Tiene o ha tenido alguna enfermedad respiratoria?",
    "¿Tiene o ha tenido alguna enfermedad cardiaca?",
    "¿Tiene usted hipertensión o diabetes? ¿Alguno de sus familiares cercanos?",
    "¿Ha tenido tuberculosis o hepatitis?",
    "¿Ha presentado alteraciones en el sangrado?",
    "¿Tuvo, tiene sospecha de algún tipo de enfermedad venérea o SIDA?",
    "¿Hay posibilidad de que esté embarazada?",
    "¿Tiene perforaciones y/o tatuajes?",
    "¿Toma alcohol y/o fuma?",
    "¿Tiene o ha tenido alguna vez ataques de pánico, ansiedad o depresión?",
  ];

  const dentalQuestions = [
    "¿Tuviste tratamiento de ortodoncia?",
    "¿Padeces de sensibilidad dental?",
    "¿Padeces de sangrado de encías?",
    "¿Te gusta tu sonrisa?",
  ];

  return (
    <div className="max-w-4xl mx-auto py-6 flex flex-col h-full px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/pacientes')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Registro de Nuevo Paciente</h1>
          <p className="text-sm text-slate-500">Complete los datos para crear el expediente digital</p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          return (
            <div key={step.id} className="flex items-center gap-3">
              {idx > 0 && (
                <div className={`w-16 h-0.5 rounded-full transition-colors ${isCompleted ? 'bg-[#0EA5E9]' : 'bg-slate-200'}`} />
              )}
              <div 
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer ${
                  isActive ? 'bg-[#0EA5E9] text-white shadow-md' : 
                  isCompleted ? 'bg-sky-50 text-[#0EA5E9] border border-sky-200' : 
                  'bg-slate-100 text-slate-400'
                }`}
                onClick={() => { if (isCompleted) setCurrentStep(step.id); }}
              >
                {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span className="text-sm font-semibold hidden sm:inline">{step.label}</span>
                <span className="text-sm font-semibold sm:hidden">{step.id}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col relative">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div 
              key="ficha" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 space-y-8">
                {/* Datos de Identificación */}
                <section>
                  <h2 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#0EA5E9]" /> Datos de Identificación
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Input label="Nombre completo" placeholder="Nombre y apellidos" value={formData.nombre || ''} onChange={(e: any) => handleChange('nombre', e.target.value)} />
                    <Input label="Me gusta que me digan" placeholder="Apodo o nombre preferido" value={formData.apodo || ''} onChange={(e: any) => handleChange('apodo', e.target.value)} />
                    <Input label="Edad" type="number" placeholder="Años" value={formData.edad || ''} onChange={(e: any) => handleChange('edad', e.target.value)} />
                    <Input label="Teléfono de contacto" type="tel" placeholder="+52 ..." value={formData.telefono || ''} onChange={(e: any) => handleChange('telefono', e.target.value)} />
                    <Input label="Correo electrónico" type="email" placeholder="correo@email.com" value={formData.email || ''} onChange={(e: any) => handleChange('email', e.target.value)} />
                    <Input label="Ocupación" placeholder="Profesión" value={formData.ocupacion || ''} onChange={(e: any) => handleChange('ocupacion', e.target.value)} />
                    <Input label="Dirección" className="md:col-span-2 lg:col-span-3" placeholder="Calle, número, colonia, ciudad" value={formData.direccion || ''} onChange={(e: any) => handleChange('direccion', e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <Input label="T.A." placeholder="120/80" value={formData.ta || ''} onChange={(e: any) => handleChange('ta', e.target.value)} />
                    <Input label="Pulso" placeholder="lpm" value={formData.pulso || ''} onChange={(e: any) => handleChange('pulso', e.target.value)} />
                    <Input label="F.R." placeholder="rpm" value={formData.fr || ''} onChange={(e: any) => handleChange('fr', e.target.value)} />
                    <Input label="Peso" placeholder="kg" value={formData.peso || ''} onChange={(e: any) => handleChange('peso', e.target.value)} />
                    <Input label="Talla" placeholder="cm" value={formData.talla || ''} onChange={(e: any) => handleChange('talla', e.target.value)} />
                  </div>
                </section>

                {/* Cuestionario Médico */}
                <section>
                  <h2 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" /> Cuestionario Médico
                  </h2>
                  <div className="space-y-2">
                    {medicalQuestions.map((q, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="text-sm font-medium text-slate-700 mb-2 sm:mb-0 pr-4">{q}</span>
                        <div className="flex gap-2 shrink-0">
                          <button 
                            onClick={() => handleChange(`q_${idx}`, true)} 
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData[`q_${idx}`] === true ? 'bg-[#0EA5E9] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >Sí</button>
                          <button 
                            onClick={() => handleChange(`q_${idx}`, false)} 
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData[`q_${idx}`] === false ? 'bg-slate-800 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                          >No</button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 space-y-3">
                      <Input label="En caso afirmativo (Especifique y diga si está controlado):" textarea />
                      <Input label="¿Tiene o ha tenido algún otro padecimiento importante?" textarea />
                    </div>
                  </div>
                </section>

                {/* Historia Dental */}
                <section>
                  <h2 className="text-base font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                    🦷 Historia Dental
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Input label="¿Cuánto tiempo tiene tu última visita al dentista?" />
                    <Input label="¿Qué tratamiento te hicieron?" />
                  </div>
                  <div className="space-y-2">
                    {dentalQuestions.map((q, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <span className="text-sm font-medium text-slate-700">{q}</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleChange(`d_${idx}`, true)} 
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData[`d_${idx}`] === true ? 'bg-sky-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                          >Sí</button>
                          <button 
                            onClick={() => handleChange(`d_${idx}`, false)} 
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData[`d_${idx}`] === false ? 'bg-slate-700 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
                          >No</button>
                        </div>
                      </div>
                    ))}
                    <Input label="¿Qué cambiarías de tu sonrisa: Tamaño, Forma, Posición o color?" className="mt-4" />
                    <Input label="Redacta el motivo de tu consulta" textarea />
                  </div>
                </section>
              </div>

              {/* Footer Step 1 */}
              <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                <button onClick={() => navigate('/pacientes')} className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center transition-colors shadow-sm gap-2"
                >
                  Continuar al Consentimiento <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div 
              key="consentimiento" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                <div className="max-w-2xl mx-auto space-y-8">
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Consentimiento Informado</h2>
                    <p className="text-sm text-slate-500">Autorización para procedimientos odontológicos</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Nombre del paciente" placeholder={formData.nombre || "Nombre completo"} value={formData.nombre} onChange={(e: any) => handleChange('nombre', e.target.value)} />
                    <Input label="Fecha" type="date" value={new Date().toISOString().split('T')[0]} onChange={() => {}} />
                    <Input label="Médico al que se otorga el consentimiento" placeholder="Dr. Carlos E." value={formData.doctor_consentimiento || ''} onChange={(e: any) => handleChange('doctor_consentimiento', e.target.value)} />
                    <Input label="Tratamiento específico a practicar" placeholder="Valoración integral" value={formData.tratamiento_consentimiento || ''} onChange={(e: any) => handleChange('tratamiento_consentimiento', e.target.value)} />
                  </div>

                  {/* Legal Text */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-sm text-slate-600 leading-relaxed space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                    <p>Por medio de la presente, yo <strong>{formData.nombre || '_______________'}</strong>, por voluntad propia, autorizo al profesional de salud dental arriba mencionado a realizar la evaluación, diagnóstico y plan de tratamiento de mi estado de salud bucal.</p>
                    <p>He sido informado(a) de los riesgos generales y específicos del tratamiento, incluyendo pero no limitándose a: dolor, inflamación, sangrado, infección, reacciones adversas a medicamentos o anestésicos, y la posibilidad de que el resultado no sea exactamente el esperado.</p>
                    <p>Declaro que la información médica proporcionada en la ficha de interrogatorio es verdadera y completa. Entiendo que ocultar información relevante puede afectar mi tratamiento y salud.</p>
                    <p>Autorizo el uso de mis datos con fines clínicos y la toma de fotografías intraorales y extraorales con propósitos de seguimiento del tratamiento.</p>
                  </div>

                  <Input label="Riesgos o complicaciones advertidas" textarea placeholder="Describa los riesgos explicados al paciente..." />

                  {/* Signature */}
                  <div className="flex flex-col items-center pt-4">
                    <h3 className="font-semibold text-slate-800 mb-3 flex items-center text-sm">
                      <FileSignature className="w-4 h-4 mr-2 text-[#0EA5E9]" /> Firma del Paciente
                    </h3>
                    <div className="w-full max-w-sm bg-white border-2 border-dashed border-slate-300 rounded-2xl relative overflow-hidden mx-auto">
                      <SignatureCanvas 
                        ref={sigCanvas} 
                        penColor="#0F172A" 
                        canvasProps={{ 
                          className: 'w-full h-40 cursor-crosshair touch-none', 
                          style: { backgroundColor: '#F8FAFC', width: '100%' } 
                        }} 
                      />
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-30">
                        <span className="text-slate-400 text-[10px] md:text-xs font-medium px-4 text-center">Firme aquí con el dedo o mouse</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => sigCanvas.current?.clear()} 
                      className="mt-2 px-4 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      Limpiar Firma
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Step 2 */}
              <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
                <button 
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-xl transition-colors flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Regresar a Ficha
                </button>
                <button 
                  onClick={handleFinish}
                  disabled={saving}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white px-8 py-2.5 rounded-xl font-semibold text-sm flex items-center transition-colors shadow-sm gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Guardando...' : 'Registrar y Pasar al Odontograma'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Toast */}
        <AnimatePresence>
          {saved && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-50"
            >
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: 'spring' }}
                className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-4"
              >
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </motion.div>
              <h3 className="text-xl font-bold text-slate-800 mb-1">¡Paciente Registrado!</h3>
              <p className="text-sm text-slate-500">Redirigiendo al odontograma...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
