import React, { useState, useEffect } from 'react';
import { Printer, RefreshCw, Users, ChevronDown, ChevronRight } from 'lucide-react';
import { db } from '../services/database';
import { StaffMember, StaffRole } from '../types';

const ROLE_LABELS: Record<StaffRole, string> = {
  director_tecnico: 'Director/a Técnico/a',
  director_administrativo: 'Director/a Administrativo/a',
  auxiliar_enfermeria: 'Auxiliar de Enfermería',
  tecnico_enfermeria: 'Técnico/a de Enfermería',
  cuidador: 'Cuidador/a',
  manipulador_alimentos: 'Manipulador/a de Alimentos',
  auxiliar_aseo: 'Auxiliar de Aseo',
  otro: 'Otro Cargo',
};

const ROLE_COLORS: Record<StaffRole, string> = {
  director_tecnico: 'bg-blue-600 text-white',
  director_administrativo: 'bg-indigo-600 text-white',
  auxiliar_enfermeria: 'bg-teal-500 text-white',
  tecnico_enfermeria: 'bg-cyan-500 text-white',
  cuidador: 'bg-green-500 text-white',
  manipulador_alimentos: 'bg-orange-500 text-white',
  auxiliar_aseo: 'bg-yellow-500 text-white',
  otro: 'bg-gray-500 text-white',
};

const HIERARCHY: StaffRole[][] = [
  ['director_tecnico'],
  ['director_administrativo'],
  ['auxiliar_enfermeria', 'tecnico_enfermeria'],
  ['cuidador'],
  ['manipulador_alimentos', 'auxiliar_aseo', 'otro'],
];

interface OrgNode {
  role: StaffRole;
  members: StaffMember[];
  expanded: boolean;
}

export default function OrgChart() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState<Map<StaffRole, boolean>>(new Map());

  const load = async () => {
    setLoading(true);
    const s = await db.getStaff(true);
    setStaff(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = (role: StaffRole) =>
    setNodes(n => new Map(n).set(role, !n.get(role)));

  const byRole = (role: StaffRole) => staff.filter(s => s.role === role);

  const totalActive = staff.filter(s => s.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organigrama</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Art. 11-14 Decreto N°20 — {totalActive} persona(s) activa(s)</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
            <RefreshCw className="w-4 h-4" />Actualizar
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
            <Printer className="w-4 h-4" />Imprimir
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : staff.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg">No hay personal registrado</p>
          <p className="text-sm mt-1">Registre personal en el módulo de Personal para ver el organigrama.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 print:shadow-none">
          {/* Org chart header */}
          <div className="text-center mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Estructura Organizacional</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">ELEAM — Personal Activo</p>
          </div>

          {/* Tree structure */}
          <div className="flex flex-col items-center gap-0">
            {HIERARCHY.map((levelRoles, levelIdx) => {
              const levelMembers = levelRoles.flatMap(r => byRole(r));
              if (levelMembers.length === 0 && levelRoles.every(r => byRole(r).length === 0)) return null;

              return (
                <React.Fragment key={levelIdx}>
                  {/* Connector line */}
                  {levelIdx > 0 && (
                    <div className="w-0.5 h-8 bg-gray-300 dark:bg-gray-600" />
                  )}

                  {/* Level row */}
                  <div className="flex flex-wrap justify-center gap-4">
                    {levelRoles.map(role => {
                      const members = byRole(role);
                      if (members.length === 0) return null;
                      const isExpanded = nodes.get(role) !== false;

                      return (
                        <div key={role} className="flex flex-col items-center">
                          {/* Role card */}
                          <button
                            onClick={() => toggle(role)}
                            className={`rounded-xl px-4 py-3 min-w-[160px] max-w-[220px] shadow-md transition-transform hover:scale-105 ${ROLE_COLORS[role]}`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-left">
                                <p className="text-xs font-semibold opacity-80 uppercase tracking-wide">{ROLE_LABELS[role]}</p>
                                <p className="text-lg font-bold">{members.length}</p>
                                <p className="text-xs opacity-75">{members.length === 1 ? 'persona' : 'personas'}</p>
                              </div>
                              {isExpanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                            </div>
                          </button>

                          {/* Members list */}
                          {isExpanded && (
                            <div className="mt-2 space-y-1 w-full">
                              {members.map(m => (
                                <div key={m.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-center border border-gray-200 dark:border-gray-600">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.name}</p>
                                  {m.professionalTitle && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{m.professionalTitle}</p>
                                  )}
                                  <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${
                                    m.contractType === 'planta' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                    m.contractType === 'contrata' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' :
                                    'bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                                  }`}>
                                    {m.contractType}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </React.Fragment>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Resumen de Personal por Rol</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(ROLE_LABELS).map(([role, label]) => {
                const count = byRole(role as StaffRole).length;
                if (count === 0) return null;
                return (
                  <div key={role} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${ROLE_COLORS[role as StaffRole].split(' ')[0]}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-300 truncate">{label}</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white ml-auto">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legal requirements note */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-xs text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">Proporciones mínimas exigidas (Art. 15-17 Decreto N°20)</p>
            <ul className="space-y-0.5">
              <li>• Turno diurno: 1 cuidador por cada 8 residentes con dependencia</li>
              <li>• Turno nocturno: 1 cuidador por cada 12 residentes (mínimo 2)</li>
              <li>• Autovalentes: 1 cuidador por cada 20 residentes</li>
              <li>• Auxiliar/técnico enfermería: 12 horas diurnas + 1 hora de llamada nocturna</li>
            </ul>
          </div>
        </div>
      )}

      {/* Role summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(ROLE_LABELS).map(([role, label]) => {
          const members = byRole(role as StaffRole);
          if (members.length === 0) return null;
          return (
            <div key={role} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
              <div className={`w-8 h-8 rounded-lg ${ROLE_COLORS[role as StaffRole].split(' ')[0]} flex items-center justify-center mb-2`}>
                <Users className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{members.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
