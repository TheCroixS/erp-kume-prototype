import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  Users, FileText, Activity, CheckSquare, Download,
  Moon, Sun, AlertTriangle, Home, Heart, LogOut,
  Briefcase, MessageSquare, ScrollText, ShieldCheck,
  BarChart3, Pill, Building2, Package, GitBranch,
  UserCheck, AlertOctagon
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import GlobalSearch from './GlobalSearch';
import { useAlerts } from '../hooks/useAlerts';

export default function Layout() {
  const location = useLocation();
  const { state, dispatch } = useApp();
  const { criticalCount, warningCount } = useAlerts();
  const alertCount = criticalCount + warningCount + state.inactiveResidents.length;

  const navigation = [
    { name: 'Inicio', href: '/', icon: Home },
    { name: 'Residentes', href: '/residents', icon: Users },
    { name: 'Fichas Clínicas', href: '/medical-records', icon: Heart },
    { name: 'Planes de Atención', href: '/care-plans', icon: FileText },
    { name: 'Monitoreo Diario', href: '/daily-monitoring', icon: Activity },
    { name: 'Medicamentos', href: '/medications', icon: Pill },
    { name: 'Protocolos', href: '/protocols', icon: CheckSquare },
    { name: 'Personal', href: '/staff', icon: Briefcase },
    { name: 'Reclamos', href: '/complaints', icon: MessageSquare },
    { name: 'Contratos', href: '/contracts', icon: ScrollText },
    { name: 'Permisos', href: '/permits', icon: ShieldCheck },
    { name: 'Reporte SENAMA', href: '/senama-report', icon: BarChart3 },
    { name: 'Egresos', href: '/egress', icon: LogOut },
    { name: 'Exportar Datos', href: '/export', icon: Download },
    { name: 'Perfil Institucional', href: '/institutional-profile', icon: Building2 },
    { name: 'Recursos', href: '/resources', icon: Package },
    { name: 'Organigrama', href: '/org-chart', icon: GitBranch },
    { name: 'Libro de Visitas', href: '/visitor-log', icon: UserCheck },
    { name: 'Incidentes', href: '/incidents', icon: AlertOctagon },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg flex flex-col">
        {/* Logo */}
        <div className="flex items-center px-5 py-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 shrink-0">
            <img src="/Gemini_Generated_Image_mif83mmif83mmif8.png" alt="Küme" className="w-9 h-9 object-contain"
              onError={e => { e.currentTarget.style.display='none'; (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden'); }} />
            <Heart className="w-5 h-5 text-green-600 dark:text-green-400 hidden" />
          </div>
          <div className="ml-3">
            <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">Küme</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">ERP ELEAM</p>
          </div>
          {alertCount > 0 && (
            <span className="ml-auto flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-red-500 text-white shrink-0">
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="px-3 py-3 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <GlobalSearch />
        </div>

        {/* Inactive Residents Alert */}
        {state.inactiveResidents.length > 0 && (
          <div className="mx-3 mt-2 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg shrink-0">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                {state.inactiveResidents.length} residente(s) sin actividad
              </p>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navigation.map(item => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/' && location.pathname.startsWith(item.href));
            return (
              <Link key={item.name} to={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}>
                <item.icon className="w-4 h-4 mr-3 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Dark mode toggle */}
        <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700 shrink-0">
          <button onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            {state.darkMode ? <Sun className="w-4 h-4 mr-3" /> : <Moon className="w-4 h-4 mr-3" />}
            {state.darkMode ? 'Modo Claro' : 'Modo Oscuro'}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        <main className="p-8 print:p-0 print:pl-0">
          <Outlet />
        </main>
      </div>

      {/* Loading */}
      {state.loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
            <span className="text-gray-900 dark:text-white">Cargando...</span>
          </div>
        </div>
      )}

      {/* Error toast */}
      {state.error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{state.error}</span>
          <button onClick={() => dispatch({ type: 'SET_ERROR', payload: null })} className="ml-2 text-white hover:text-red-200 text-lg leading-none">×</button>
        </div>
      )}
    </div>
  );
}
