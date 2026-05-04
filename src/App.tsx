import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Agenda from './components/agenda/Agenda';
import Odontogram from './components/odontogram/Odontogram';
import PacientesList from './components/pacientes/PacientesList';
import RegistroPaciente from './components/pacientes/RegistroPaciente';
import ExpedientePaciente from './components/pacientes/ExpedientePaciente';
import CotizacionPresupuesto from './components/cotizacion/CotizacionPresupuesto';
import DashboardFinanciero from './components/finanzas/DashboardFinanciero';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Agenda />} />
          <Route path="/pacientes" element={<PacientesList />} />
          <Route path="/pacientes/nuevo" element={<RegistroPaciente />} />
          <Route path="/pacientes/:id" element={<ExpedientePaciente />} />
          <Route path="/pacientes/:id/odontograma" element={<Odontogram />} />
          <Route path="/pacientes/:id/cotizacion" element={<CotizacionPresupuesto />} />
          <Route path="/finanzas" element={<DashboardFinanciero />} />
          <Route path="/configuracion" element={<div className="p-4 bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex items-center justify-center text-slate-400">Configuración en construcción...</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
