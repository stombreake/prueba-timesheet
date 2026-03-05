import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import {
    Users,
    LayoutDashboard,
    FileSpreadsheet,
    TrendingUp,
    LogOut,
    Settings,
    Briefcase,
    History,
    Map
} from 'lucide-react';

import DashboardPage from './pages/DashboardPage';
import UserPage from './pages/UserPage';
import TimesheetPage from './pages/TimesheetPage';
import CrewPage from './pages/CrewPage';
import RecordsPage from './pages/RecordsPage';
import CircuitsPage from './pages/CircuitsPage';

const SidebarItem = ({ icon: Icon, label, path, active }) => (
    <Link
        to={path}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${active
            ? 'bg-blue-600/10 text-blue-400 border-r-4 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] translate-x-1'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
            }`}
    >
        <div className={`${active ? 'text-blue-400' : 'text-slate-500'} transition-colors`}>
            <Icon size={20} />
        </div>
        <span className="font-semibold text-[10px] tracking-[0.15em] uppercase">{label}</span>
    </Link>
);

function AppContent() {
    const location = useLocation();

    return (
        <div className="flex min-h-screen bg-[#020617] text-slate-200 selection:bg-blue-500/30 overflow-hidden">
            {/* Sidebar - Enhanced Glassmorphism */}
            <aside className="w-72 border-r border-white/5 bg-[#020617]/40 backdrop-blur-3xl p-6 flex flex-col gap-10 fixed h-full z-50">
                <div className="flex items-center gap-3 px-2 py-2 group cursor-pointer">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:rotate-6 transition-transform duration-500">
                        <TrendingUp size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black tracking-tighter text-white leading-none">PROSHEETS</h2>
                        <p className="text-[10px] font-bold text-blue-400 tracking-[0.25em] uppercase mt-1.5 opacity-80">Management AI</p>
                    </div>
                </div>

                <nav className="flex flex-col gap-2 flex-grow overflow-y-auto pr-2">
                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] px-4 mb-2">Principal</p>
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        path="/"
                        active={location.pathname === '/'}
                    />

                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] px-4 mt-6 mb-2">Personal</p>
                    <SidebarItem
                        icon={Users}
                        label="Usuarios"
                        path="/users"
                        active={location.pathname === '/users'}
                    />
                    <SidebarItem
                        icon={Briefcase}
                        label="Cuadrillas"
                        path="/crews"
                        active={location.pathname === '/crews'}
                    />
                    <SidebarItem
                        icon={Map}
                        label="Circuitos"
                        path="/circuits"
                        active={location.pathname === '/circuits'}
                    />

                    <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] px-4 mt-6 mb-2">Operaciones</p>
                    <SidebarItem
                        icon={FileSpreadsheet}
                        label="Nueva Hoja"
                        path="/timesheets"
                        active={location.pathname === '/timesheets'}
                    />
                    <SidebarItem
                        icon={History}
                        label="Registros"
                        path="/records"
                        active={location.pathname === '/records'}
                    />
                </nav>

                <div className="mt-auto flex flex-col gap-3">
                    <div className="p-5 rounded-[2rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div>
                            <span className="text-xs font-bold text-slate-100 italic tracking-wider">Sistema Activo</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1">
                        <SidebarItem icon={Settings} label="Ajustes" path="/settings" active={location.pathname === '/settings'} />
                        <button className="flex items-center gap-3 px-5 py-4 text-slate-600 hover:text-red-400 transition-all duration-300 font-bold uppercase text-[9px] tracking-[0.3em] group">
                            <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-72 flex-grow relative overflow-y-auto">
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[160px] animate-float" style={{ animationDelay: '0s' }}></div>
                    <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[140px] animate-float" style={{ animationDelay: '-3s' }}></div>
                </div>

                <div className="relative z-10 p-12 max-w-[1500px] mx-auto min-h-screen">
                    <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/users" element={<UserPage />} />
                        <Route path="/crews" element={<CrewPage />} />
                        <Route path="/timesheets" element={<TimesheetPage />} />
                        <Route path="/records" element={<RecordsPage />} />
                        <Route path="/circuits" element={<CircuitsPage />} />
                        <Route path="/settings" element={<div className="p-8"><h1>Configuración Próximamente</h1></div>} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;
