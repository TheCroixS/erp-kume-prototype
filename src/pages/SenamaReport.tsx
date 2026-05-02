import React, { useState, useEffect } from 'react';
import {
  BarChart2, Download, Calendar, Users, Briefcase,
  FileText, CheckCircle, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { db } from '../services/database';
import { Resident, StaffMember } from '../types';
import { format, startOfQuarter, endOfQuarter, subQuarters, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

type Quarter = { label: string; start: Date; end: Date };

function getQuarters(): Quarter[] {
  const now = new Date();
  const quarters: Quarter[] = [];
  for (let i = 0; i < 4; i++) {
    const d = subQuarters(now, i);
    const start = startOfQuarter(d);
    const end = endOfQuarter(d);
    const q = Math.floor(d.getMonth() / 3) + 1;
    quarters.push({
      label: `T${q} ${d.getFullYear()} (${format(start, 'dd/MM', { locale: es })} – ${format(end, 'dd/MM/yyyy', { locale: es })})`,
      start,
      end,
    });
  }
  return quarters;
}

function dependencyLabel(evaluations: any) {
  const bart = evaluations?.barthel?.interpretation;
  const katz = evaluations?.katz?.interpretation;
  if (!bart && !katz) return 'No evaluado';
  const lvl = bart || katz;
  const map: Record<string, string> = {
    independiente: 'Autovalente/Independiente',
    dependencia_leve: 'Dependencia Leve',
    dependencia_moderada: 'Dependencia Moderada',
    dependencia_severa: 'Dependencia Severa',
    dependencia_total: 'Dependencia Total',
  };
  return map[lvl] || lvl;
}

export default function SenamaReport() {
  const [residents, setResidents] = useState<Resident[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [quarters] = useState<Quarter[]>(getQuarters());
  const [selectedQIdx, setSelectedQIdx] = useState(0);
  const [expandedSection, setExpandedSection] = useState<string | null>('residents');
  const [estName, setEstName] = useState('');
  const [estRut, setEstRut] = useState('');
  const [estAddress, setEstAddress] = useState('');
  const [authNumber, setAuthNumber] = useState('');
  const [directorName, setDirectorName] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [r, s] = await Promise.all([
        db.getResidents(true),
        db.getStaff(),
      ]);
      setResidents(r);
      setStaff(s);
    } finally {
      setLoading(false);
    }
  }

  const quarter = quarters[selectedQIdx];
  const qStart = quarter.start.toISOString().split('T')[0];
  const qEnd = quarter.end.toISOString().split('T')[0];

  const activeInPeriod = residents.filter(r => {
    const admDate = r.admissionDate;
    const egrDate = r.egressDate;
    const wasActive = admDate <= qEnd && (!egrDate || egrDate >= qStart);
    return wasActive;
  });

  const admittedInPeriod = residents.filter(r =>
    r.admissionDate >= qStart && r.admissionDate <= qEnd
  );

  const egressedInPeriod = residents.filter(r =>
    r.egressDate && r.egressDate >= qStart && r.egressDate <= qEnd
  );

  const currentActive = residents.filter(r => r.status === 'activo');
  const activeStaff = staff.filter(s => s.active);

  function Section({ id, title, count, children }: { id: string; title: string; count?: number; children: React.ReactNode }) {
    const open = expandedSection === id;
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <button
          onClick={() => setExpandedSection(open ? null : id)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900 dark:text-white">{title}</span>
            {count !== undefined && (
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
          {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {open && <div className="border-t border-gray-200 dark:border-gray-700 p-4">{children}</div>}
      </div>
    );
  }

  function exportJSON() {
    const report = {
      generatedAt: new Date().toISOString(),
      quarter: quarter.label,
      period: { start: qStart, end: qEnd },
      establishment: {
        name: estName,
        rut: estRut,
        address: estAddress,
        sanitaryAuthorizationNumber: authNumber,
        technicalDirector: directorName,
      },
      summary: {
        activeResidents: currentActive.length,
        admittedInPeriod: admittedInPeriod.length,
        egressedInPeriod: egressedInPeriod.length,
        totalStaff: activeStaff.length,
      },
      residents: activeInPeriod.map(r => ({
        run: r.run,
        name: r.name,
        age: r.age,
        gender: r.gender,
        admissionDate: r.admissionDate,
        status: r.status,
        dependencyLevel: dependencyLabel(r.admissionEvaluations),
        guardian: r.guardian,
      })),
      staff: activeStaff.map(s => ({
        run: s.run,
        name: s.name,
        role: s.role,
        contractType: s.contractType,
        startDate: s.startDate,
        trainingHours: s.training.reduce((sum, t) => sum + t.hours, 0),
      })),
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-senama-${quarter.label.replace(/[\s\/]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportText() {
    const lines: string[] = [];
    lines.push('=' .repeat(60));
    lines.push('REPORTE TRIMESTRAL SENAMA — Art. 12 t Decreto N°20');
    lines.push('=' .repeat(60));
    lines.push(`Período: ${quarter.label}`);
    lines.push(`Generado: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: es })}`);
    lines.push('');
    lines.push('DATOS DEL ESTABLECIMIENTO');
    lines.push(`Nombre: ${estName || '________________'}`);
    lines.push(`RUT: ${estRut || '________________'}`);
    lines.push(`Dirección: ${estAddress || '________________'}`);
    lines.push(`N° Autorización Sanitaria: ${authNumber || '________________'}`);
    lines.push(`Director Técnico: ${directorName || '________________'}`);
    lines.push('');
    lines.push('RESUMEN DEL PERÍODO');
    lines.push(`Residentes activos al cierre: ${currentActive.length}`);
    lines.push(`Ingresos en el período: ${admittedInPeriod.length}`);
    lines.push(`Egresos en el período: ${egressedInPeriod.length}`);
    lines.push(`Personal activo: ${activeStaff.length}`);
    lines.push('');
    lines.push('IDENTIFICACIÓN DE RESIDENTES ACTIVOS');
    lines.push('-'.repeat(60));
    activeInPeriod.forEach((r, i) => {
      lines.push(`${i + 1}. ${r.name} — RUN: ${r.run} — Ingreso: ${r.admissionDate} — Dependencia: ${dependencyLabel(r.admissionEvaluations)}`);
    });
    lines.push('');
    lines.push('IDENTIFICACIÓN DE TRABAJADORES ACTIVOS');
    lines.push('-'.repeat(60));
    activeStaff.forEach((s, i) => {
      lines.push(`${i + 1}. ${s.name} — RUN: ${s.run} — Cargo: ${s.role} — Contrato: ${s.contractType}`);
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-senama-${quarter.label.replace(/[\s\/]/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reportes SENAMA</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Reporte trimestral obligatorio — Art. 12 t Decreto N°20
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportText}
            className="flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            .txt
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Download className="w-4 h-4 mr-2" />
            JSON
          </button>
        </div>
      </div>

      {/* Quarter selector */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Período del Reporte
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {quarters.map((q, i) => (
            <button
              key={i}
              onClick={() => setSelectedQIdx(i)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedQIdx === i
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      {/* Establishment info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Datos del Establecimiento</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { label: 'Nombre del Establecimiento', value: estName, set: setEstName },
            { label: 'RUT Titular', value: estRut, set: setEstRut },
            { label: 'Dirección', value: estAddress, set: setEstAddress },
            { label: 'N° Autorización Sanitaria', value: authNumber, set: setAuthNumber },
            { label: 'Director/a Técnico/a', value: directorName, set: setDirectorName },
          ].map(field => (
            <div key={field.label}>
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">{field.label}</label>
              <input
                value={field.value}
                onChange={e => field.set(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Residentes Activos', value: currentActive.length, icon: Users, color: 'text-blue-600' },
          { label: 'Ingresos en Período', value: admittedInPeriod.length, icon: CheckCircle, color: 'text-green-600' },
          { label: 'Egresos en Período', value: egressedInPeriod.length, icon: AlertTriangle, color: 'text-orange-600' },
          { label: 'Personal Activo', value: activeStaff.length, icon: Briefcase, color: 'text-purple-600' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          );
        })}
      </div>

      {/* Detailed sections */}
      <div className="space-y-3">
        <Section id="residents" title="Identificación de Residentes" count={activeInPeriod.length}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-4">N°</th>
                  <th className="pb-2 pr-4">Nombre</th>
                  <th className="pb-2 pr-4">RUN</th>
                  <th className="pb-2 pr-4">Edad</th>
                  <th className="pb-2 pr-4">Género</th>
                  <th className="pb-2 pr-4">F. Ingreso</th>
                  <th className="pb-2 pr-4">Dependencia</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {activeInPeriod.map((r, i) => (
                  <tr key={r.id} className="text-gray-700 dark:text-gray-300">
                    <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium">{r.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{r.run}</td>
                    <td className="py-2 pr-4">{r.age}</td>
                    <td className="py-2 pr-4 capitalize">{r.gender}</td>
                    <td className="py-2 pr-4 text-xs">{r.admissionDate}</td>
                    <td className="py-2 pr-4 text-xs">{dependencyLabel(r.admissionEvaluations)}</td>
                    <td className="py-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        r.status === 'activo'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {r.status === 'activo' ? 'Activo' : 'Egresado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activeInPeriod.length === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">Sin residentes en este período</p>
            )}
          </div>
        </Section>

        <Section id="staff" title="Identificación de Trabajadores" count={activeStaff.length}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 pr-4">N°</th>
                  <th className="pb-2 pr-4">Nombre</th>
                  <th className="pb-2 pr-4">RUN</th>
                  <th className="pb-2 pr-4">Cargo</th>
                  <th className="pb-2 pr-4">Contrato</th>
                  <th className="pb-2 pr-4">F. Inicio</th>
                  <th className="pb-2">Hrs. Capacit.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {activeStaff.map((s, i) => (
                  <tr key={s.id} className="text-gray-700 dark:text-gray-300">
                    <td className="py-2 pr-4 text-gray-500">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium">{s.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{s.run}</td>
                    <td className="py-2 pr-4 text-xs capitalize">{s.role.replace('_', ' ')}</td>
                    <td className="py-2 pr-4 text-xs capitalize">{s.contractType}</td>
                    <td className="py-2 pr-4 text-xs">{s.startDate}</td>
                    <td className="py-2 text-xs">
                      {s.training.reduce((sum, t) => sum + t.hours, 0)}h
                      {s.training.reduce((sum, t) => sum + t.hours, 0) < 22 && (
                        <span className="ml-1 text-yellow-600">⚠</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activeStaff.length === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">Sin personal registrado</p>
            )}
          </div>
        </Section>

        <Section id="movements" title="Movimientos del Período">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ingresos ({admittedInPeriod.length})
              </p>
              {admittedInPeriod.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Sin ingresos en el período</p>
              ) : (
                <div className="space-y-1">
                  {admittedInPeriod.map(r => (
                    <div key={r.id} className="flex justify-between text-sm text-gray-700 dark:text-gray-300 py-1 border-b border-gray-100 dark:border-gray-700">
                      <span>{r.name}</span>
                      <span className="text-gray-500 text-xs">{r.admissionDate}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Egresos ({egressedInPeriod.length})
              </p>
              {egressedInPeriod.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Sin egresos en el período</p>
              ) : (
                <div className="space-y-1">
                  {egressedInPeriod.map(r => (
                    <div key={r.id} className="text-sm text-gray-700 dark:text-gray-300 py-1 border-b border-gray-100 dark:border-gray-700">
                      <div className="flex justify-between">
                        <span>{r.name}</span>
                        <span className="text-gray-500 text-xs">{r.egressDate}</span>
                      </div>
                      {r.egressReason && <p className="text-xs text-gray-500 mt-0.5">{r.egressReason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Instrucciones de Envío</p>
        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
          Enviar al SENAMA en el medio dispuesto por ellos (portal web o formulario oficial).
          Consultar: <strong>www.senama.gob.cl</strong>. Plazos: T1 → 15/04, T2 → 15/07, T3 → 15/10, T4 → 15/01.
        </p>
      </div>
    </div>
  );
}
