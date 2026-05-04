import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, PieChart, Settings, Activity, X } from 'lucide-react';

const navItems = [
  { name: 'Agenda', path: '/', icon: Calendar },
  { name: 'Pacientes', path: '/pacientes', icon: Users },
  { name: 'Finanzas', path: '/finanzas', icon: PieChart },
  { name: 'Configuración', path: '/configuracion', icon: Settings },
];

interface SidebarProps {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }: SidebarProps) {
  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center">
          <Activity className="h-6 w-6 text-[#0EA5E9] mr-2" />
          <span className="text-lg font-semibold text-slate-800 tracking-tight">Odontología Esteta</span>
        </div>
        <button 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden p-2 -mr-2 text-slate-400 hover:text-slate-600 rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-3 md:py-2.5 rounded-lg transition-colors relative group ${
                      isActive 
                        ? 'text-[#0EA5E9] font-medium bg-sky-50' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-[#0EA5E9]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                      <span>{item.name}</span>
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active-indicator"
                          className="absolute left-0 w-1 h-6 bg-[#0EA5E9] rounded-r-full"
                          initial={false}
                          transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        />
                      )}
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col z-10 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-[280px] bg-white border-r border-slate-200 flex flex-col z-50 md:hidden shadow-2xl"
          >
            <SidebarContent />
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
