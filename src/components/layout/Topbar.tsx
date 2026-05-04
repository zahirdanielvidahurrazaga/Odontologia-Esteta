import { Bell, Search, User, Menu } from 'lucide-react';

interface TopbarProps {
  onMenuClick: () => void;
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 md:px-6 z-10 shrink-0">
      <div className="flex items-center flex-1 gap-2">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 rounded-lg md:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#0EA5E9] focus:ring-1 focus:ring-[#0EA5E9] transition-colors bg-slate-50"
            placeholder="Buscar paciente..."
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-2 md:space-x-4">
        <div className="hidden md:flex items-center px-3 py-1.5 bg-slate-100 rounded-full">
          <span className="text-xs font-medium text-slate-600">Sucursal: <strong className="text-slate-800">Alto Flujo</strong></span>
        </div>
        
        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
        
        <div className="flex items-center space-x-2 border-l border-slate-200 pl-2 md:pl-4 ml-1 md:ml-2">
          <div className="h-8 w-8 rounded-full bg-sky-100 flex items-center justify-center text-[#0EA5E9] shrink-0">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden md:block text-sm">
            <p className="font-medium text-slate-700 leading-none">Dr. Carlos E.</p>
            <p className="text-xs text-slate-500 mt-1">Endodoncia</p>
          </div>
        </div>
      </div>
    </header>
  );
}
