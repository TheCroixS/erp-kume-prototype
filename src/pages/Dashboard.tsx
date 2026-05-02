import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, FileText, Activity, AlertTriangle, Heart,
  Shield, Database, LogOut, TrendingUp, Clock,
  CheckCircle2, Plus, Bell
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAlerts } from '../hooks/useAlerts';

const COMPLIANCE_MODULES = [
  { name: 'Residentes', href: '/residents', key: 'residents', art: 'Art. 2, 23' },
  { name: 'Fichas Clínicas', href: '/medical-records', key: 'medicalRecords', art: 'Art. 12 b' },
  { name: 'Planes de Atención', href: '/care-plans', key: 'carePlans', art: 'Art. 12 f, 25' },
  { name: 'Monitoreo Diario', href: '/daily-monitoring', key: 'dailyMonitoring', art: 'Art. 12 j' },
  { name: 'Protocolos', href: '/protocols', key: 'protocols', art: 'Art. 25' },
  { name: 'Personal', href: '/staff', key: 'staff', art: 'Art. 11-21' },
  { name: 'Reclamos', href: '/complaints', key: 'complaints', art: 'Art. 29 b' },
  { name: 'Contratos', href: '/contracts', key: 'contracts', art: 'Art. 28' },
  { name: 'Permisos', href: '/permits', key: 'permits', art: 'Art. 5-7' },
  { name: 'Reporte SENAMA', href: '/senama-report', key: 'senama', art: 'Art. 12 t' },
  { name: 'Medicamentos', href: '/medications', key: 'medications', art: 'Art. 12 b' },
  { name: 'Egresos', href: '/egress', key: 'egress', art: 'Art. 23-24' },
];

export default function Dashboard() {
  const { state, checkInactiveResidents } = useApp();
  const { alerts, criticalCount, warningCount } = useAlerts();

  useEffect(() => { checkInactiveResidents(); }, [checkInactiveResidents]);

  const activeResidents = state.residents.filter(r => r.status === 'activo');
  const egressedResidents = state.residents.filter(r => r.status === 'egresado');
  const residentsWithMedicalRecord = state.residents.filter(r => r.medicalRecord);
  const residentsWithCarePlan = state.residents.filter(r => r.carePlan);

  const totalAlerts = criticalCount + warningCount + state.inactiveResidents.length;

  const stats = [
    { name: 'Residentes Activos', value: activeResidents.length, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', link: '/residents', desc: 'Total en el establecimiento' },
    { name: 'Fichas Clínicas', value: residentsWithMedicalRecord.length, total: state.residents.length, icon: Heart, color: 'bg-red-500', bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-600 dark:text-red-400', link: '/medical-records', desc: 'Fichas completadas' },
    { name: 'Planes de Atención', value: residentsWithCarePlan.length, total: state.residents.length, icon: FileText, color: 'bg-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400', link: '/care-plans', desc: 'PAI activos' },
    { name: 'Alertas del Sistema', value: totalAlerts, icon: AlertTriangle, color: totalAlerts > 0 ? 'bg-yellow-500' : 'bg-green-500', bg: totalAlerts > 0 ? 'bg-yellow-50 dark:bg-yellow-900/20' : 'bg-green-50 dark:bg-green-900/20', text: totalAlerts > 0 ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400', link: '/permits', desc: 'Requieren atención' },
  ];

  const quickActions = [
    { name: 'Nuevo Residente', desc: 'Registrar un nuevo residente', icon: Users, link: '/residents/new', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' },
    { name: 'Registro Diario', desc: 'Completar monitoreo del día', icon: Activity, link: '/daily-monitoring', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' },
    { name: 'Ficha Clínica', desc: 'Actualizar información médica', icon: Heart, link: '/medical-records', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800' },
    { name: 'Plan de Atención', desc: 'Crear o actualizar PAI', icon: FileText, link: '/care-plans', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' },
    { name: 'Protocolos', desc: 'Gestionar protocolos institucionales', icon: Shield, link: '/protocols', color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800' },
    { name: 'Exportar Datos', desc: 'Generar respaldo completo', icon: Database, link: '/export', color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-6">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg overflow-hidden bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50">
            <img src="/Gemini_Generated_Image_mif83mmif83mmif8.png" alt="Küme" className="w-20 h-20 object-contain"
              onError={e => { e.currentTarget.style.display='none'; (e.currentTarget.nextElementSibling as HTMLElement)?.classList.remove('hidden'); }} />
            <Heart className="w-10 h-10 text-green-600 dark:text-green-400 hidden" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Küme</h1>
        <p className="text-lg text-green-600 dark:text-green-400 font-medium">ERP social para el bienestar en ELEAM</p>
        <div className="mt-3 flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />Sistema Offline</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{new Date().toLocaleDateString('es-CL')}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(s => (
          <Link key={s.name} to={s.link} className={`${s.bg} border border-gray-200 dark:border-gray-700 p-6 rounded-2xl hover:shadow-lg transition-all hover:scale-105 group`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className={`${s.color} p-3 rounded-xl w-fit mb-3 group-hover:shadow-md transition-shadow`}>
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{s.name}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  {'total' in s && <p className="text-lg text-gray-500">/ {s.total}</p>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.desc}</p>
              </div>
              {'total' in s && s.total! > 0 && (
                <div className="ml-4 w-16 h-16 relative shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray={`${Math.round((s.value/s.total!)*100)},100`} className={s.text} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-xs font-semibold ${s.text}`}>{Math.round((s.value/s.total!)*100)}%</span>
                  </div>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* System Alerts Panel */}
      {(alerts.length > 0 || state.inactiveResidents.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Alertas del Sistema</h2>
            </div>
            <div className="flex gap-2">
              {criticalCount > 0 && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">{criticalCount} crítica{criticalCount>1?'s':''}</span>}
              {warningCount > 0 && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300">{warningCount} advertencia{warningCount>1?'s':''}</span>}
            </div>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-64 overflow-y-auto">
            {state.inactiveResidents.length > 0 && (
              <Link to="/daily-monitoring" className="flex items-start gap-3 px-6 py-3 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{state.inactiveResidents.length} residente(s) sin monitoreo reciente</p>
                  <p className="text-xs text-gray-500">{state.inactiveResidents.slice(0,3).map(r=>r.name).join(', ')}{state.inactiveResidents.length>3 ? ` +${state.inactiveResidents.length-3} más` : ''}</p>
                </div>
              </Link>
            )}
            {alerts.map(a => (
              <Link key={a.id} to={a.href} className={`flex items-start gap-3 px-6 py-3 transition-colors ${a.level==='critical' ? 'hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-yellow-50 dark:hover:bg-yellow-900/10'}`}>
                <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${a.level==='critical' ? 'text-red-500' : a.level==='warning' ? 'text-yellow-500' : 'text-blue-500'}`} />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{a.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{a.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Inactive residents alert */}
      {state.inactiveResidents.length > 0 && alerts.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">Atención Requerida</h3>
              <p className="mt-1 text-yellow-700 dark:text-yellow-300">{state.inactiveResidents.length} residente(s) sin registros en las últimas 48 horas.</p>
              <Link to="/daily-monitoring" className="mt-4 inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors">
                <Activity className="w-4 h-4 mr-2" />Revisar Monitoreo
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Acciones Rápidas</h2>
          <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400"><TrendingUp className="w-4 h-4" />Funciones principales</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quickActions.map(a => (
            <Link key={a.name} to={a.link} className={`${a.bg} border ${a.border} p-6 rounded-2xl hover:shadow-lg transition-all hover:scale-105 group`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${a.bg} border ${a.border} group-hover:shadow-md transition-shadow shrink-0`}>
                  <a.icon className={`w-6 h-6 ${a.color}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{a.name}</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{a.desc}</p>
                  <span className={`mt-2 inline-flex items-center text-sm font-medium ${a.color}`}>
                    Acceder <Plus className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Compliance Widget */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cumplimiento Decreto N°20</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {COMPLIANCE_MODULES.map(m => (
            <Link key={m.key} to={m.href} className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{m.name}</p>
                <p className="text-xs text-gray-400">{m.art}</p>
              </div>
            </Link>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">Todos los módulos implementados según el Decreto N°20 del Minsal (vigente 01/10/2025)</p>
      </div>

      {/* System Status */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-xl flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Sistema Operativo — Modo Offline</h3>
            <p className="text-green-700 dark:text-green-300 text-sm">Datos almacenados localmente. Sin dependencia de internet.</p>
          </div>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400 shrink-0">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Activo</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      {state.residents.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { label: 'Residentes Activos', value: activeResidents.length, icon: Users, color: 'text-blue-500' },
            { label: 'Residentes Egresados', value: egressedResidents.length, icon: LogOut, color: 'text-gray-500' },
            { label: 'Total Registrados', value: state.residents.length, icon: Database, color: 'text-purple-500' },
          ].map(c => (
            <div key={c.label} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{c.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{c.value}</p>
              </div>
              <c.icon className={`w-8 h-8 ${c.color}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
