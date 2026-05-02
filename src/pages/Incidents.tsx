import React, { useState, useEffect, useMemo } from 'react';
import { AlertOctagon, Plus, X, CheckCircle, Clock, ChevronDown, ChevronUp, Bell, Printer } from 'lucide-react';
import { db } from '../services/database';
import { IncidentReport, IncidentReportType, IncidentSeverity, IncidentStatus, Resident } from '../types';

const INPUT = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

const TYPES: { value: IncidentReportType; label: string }[] = [
  { value: 'caida', label: 'Caída' },
  { value: 'lesion_grave', label: 'Lesión Grave' },
  { value: 'emergencia_medica', label: 'Emergencia Médica' },
  { value: 'fuga', label: 'Fuga o intento de fuga' },
  { value: 'fallecimiento', label: 'Fallecimiento' },
  { value: 'maltrato', label: 'Maltrato (físico o psicológico)' },
  { value: 'accidente_laboral', label: 'Accidente Laboral' },
  { value: 'otro', label: 'Otro' },
];

const SEVERITIES: { value: IncidentSeverity; label: string; color: string }[] = [
  { value: 'leve', label: 'Leve', color: 'yellow' },
  { value: 'grave', label: 'Grave', color: 'orange' },
  { value: 'muy_grave', label: 'Muy grave', color: 'red' },
  { value: 'fatal', label: 'Fatal', color: 'red' },
];

const STATUSES: { value: IncidentStatus; label: string }[] = [
  { value: 'abierto', label: 'Abierto' },
  { value: 'en_seguimiento', label: 'En seguimiento' },
  { value: 'cerrado', label: 'Cerrado' },
];

const severityBadge = (s: IncidentSeverity) => {
  const map: Record<IncidentSeverity, string> = {
    leve: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    grave: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    muy_grave: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    fatal: 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200 font-bold',
  };
  return map[s];
};

const statusBadge = (s: IncidentStatus) => {
  const map: Record<IncidentStatus, string> = {
    abierto: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    en_seguimiento: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    cerrado: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
  };
  return map[s];
};

const emptyForm: Omit<IncidentReport, 'id' | 'createdAt' | 'updatedAt'> = {
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  residentId: '',
  residentName: '',
  type: 'caida',
  severity: 'leve',
  description: '',
  location: '',
  witnesses: [],
  actionsTaken: [],
  familyNotifiedAt: '',
  familyNotifiedBy: '',
  doctorNotifiedAt: '',
  doctorNotifiedBy: '',
  seremiNotifiedAt: '',
  seremiNotifiedBy: '',
  followUp: '',
  reportedBy: '',
  status: 'abierto',
  closedAt: '',
  closedBy: '',
};

export default function Incidents() {
  const [reports, setReports] = useState<IncidentReport[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [filterStatus, setFilterStatus] = useState<IncidentStatus | 'todos'>('todos');
  const [witnessInput, setWitnessInput] = useState('');
  const [actionInput, setActionInput] = useState('');

  const load = () => db.getIncidentReports().then(setReports);
  useEffect(() => {
    load();
    db.getResidents().then(setResidents);
  }, []);

  const filtered = useMemo(() =>
    filterStatus === 'todos' ? reports : reports.filter(r => r.status === filterStatus),
    [reports, filterStatus]);

  const open = reports.filter(r => r.status === 'abierto').length;
  const following = reports.filter(r => r.status === 'en_seguimiento').length;
  const grave = reports.filter(r => r.severity === 'grave' || r.severity === 'muy_grave' || r.severity === 'fatal').length;

  const set = <K extends keyof typeof emptyForm>(field: K, value: (typeof emptyForm)[K]) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleResidentChange = (id: string) => {
    const r = residents.find(res => res.id === id);
    setForm(f => ({ ...f, residentId: id, residentName: r?.name || '' }));
  };

  const addWitness = () => {
    if (!witnessInput.trim()) return;
    setForm(f => ({ ...f, witnesses: [...f.witnesses, witnessInput.trim()] }));
    setWitnessInput('');
  };

  const addAction = () => {
    if (!actionInput.trim()) return;
    setForm(f => ({ ...f, actionsTaken: [...f.actionsTaken, actionInput.trim()] }));
    setActionInput('');
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (r: IncidentReport) => {
    setEditingId(r.id);
    setForm({ ...r });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await db.updateIncidentReport(editingId, form);
    } else {
      await db.createIncidentReport(form);
    }
    setShowForm(false);
    load();
  };

  const toggleExpand = (id: string) => {
    setExpanded(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const close = async (id: string) => {
    await db.updateIncidentReport(id, {
      status: 'cerrado',
      closedAt: new Date().toISOString(),
    });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertOctagon className="w-7 h-7 text-red-600 dark:text-red-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Registro de Incidentes</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Art. 12 k Decreto N°20 — Incidentes graves</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
            <Printer className="w-4 h-4" />Imprimir
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">
            <Plus className="w-4 h-4" />Registrar Incidente
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total registros', value: reports.length, color: 'text-gray-700 dark:text-gray-200' },
          { label: 'Abiertos', value: open, color: 'text-red-600' },
          { label: 'En seguimiento', value: following, color: 'text-blue-600' },
          { label: 'Graves o más', value: grave, color: 'text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['todos', 'abierto', 'en_seguimiento', 'cerrado'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === s
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}>
            {s === 'todos' ? 'Todos' : STATUSES.find(st => st.value === s)?.label}
          </button>
        ))}
      </div>

      {/* Incidents list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl text-gray-400">
            <AlertOctagon className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No hay incidentes registrados</p>
          </div>
        ) : filtered.map(report => {
          const exp = expanded.has(report.id);
          return (
            <div key={report.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${severityBadge(report.severity)}`}>
                      {SEVERITIES.find(s => s.value === report.severity)?.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(report.status)}`}>
                      {STATUSES.find(s => s.value === report.status)?.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(report.date).toLocaleDateString('es-CL')} a las {report.time}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {TYPES.find(t => t.value === report.type)?.label}
                    {report.residentName && <span className="font-normal text-gray-500 dark:text-gray-400"> — {report.residentName}</span>}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5 truncate">{report.description}</p>
                  <p className="text-xs text-gray-400 mt-1">Ubicación: {report.location} | Reportado por: {report.reportedBy}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {report.status !== 'cerrado' && (
                    <button onClick={() => openEdit(report)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">Editar</button>
                  )}
                  {report.status === 'abierto' && (
                    <button onClick={() => close(report.id)} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 px-2 py-0.5 rounded">
                      Cerrar
                    </button>
                  )}
                  <button onClick={() => toggleExpand(report.id)} className="p-1 text-gray-400 hover:text-gray-600">
                    {exp ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {exp && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Notifications */}
                    <div>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                        <Bell className="w-3.5 h-3.5" />Notificaciones requeridas (Art. 12 k)
                      </p>
                      <div className="space-y-1">
                        {[
                          { label: 'Familia', at: report.familyNotifiedAt, by: report.familyNotifiedBy },
                          { label: 'Médico', at: report.doctorNotifiedAt, by: report.doctorNotifiedBy },
                          { label: 'SEREMI Salud', at: report.seremiNotifiedAt, by: report.seremiNotifiedBy },
                        ].map(n => (
                          <div key={n.label} className="flex items-center gap-2">
                            {n.at ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
                            )}
                            <span className="text-gray-600 dark:text-gray-400">{n.label}:</span>
                            {n.at ? (
                              <span className="text-gray-700 dark:text-gray-300">
                                {new Date(n.at).toLocaleString('es-CL')} por {n.by}
                              </span>
                            ) : (
                              <span className="text-yellow-600 dark:text-yellow-400">Pendiente</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {report.witnesses.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Testigos</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {report.witnesses.map((w, i) => <li key={i} className="text-gray-700 dark:text-gray-300 text-sm">{w}</li>)}
                          </ul>
                        </div>
                      )}
                      {report.actionsTaken.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Acciones tomadas</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {report.actionsTaken.map((a, i) => <li key={i} className="text-gray-700 dark:text-gray-300 text-sm">{a}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  {report.followUp && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase mb-1">Seguimiento</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{report.followUp}</p>
                    </div>
                  )}
                  {report.closedAt && (
                    <p className="text-xs text-gray-400">
                      Cerrado el {new Date(report.closedAt).toLocaleDateString('es-CL')}{report.closedBy ? ` por ${report.closedBy}` : ''}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingId ? 'Editar Incidente' : 'Registrar Incidente'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Fecha *</label>
                  <input type="date" required className={INPUT} value={form.date} onChange={e => set('date', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Hora *</label>
                  <input type="time" required className={INPUT} value={form.time} onChange={e => set('time', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Tipo de incidente *</label>
                  <select required className={INPUT} value={form.type} onChange={e => set('type', e.target.value as IncidentReportType)}>
                    {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Gravedad *</label>
                  <select required className={INPUT} value={form.severity} onChange={e => set('severity', e.target.value as IncidentSeverity)}>
                    {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Residente involucrado</label>
                  <select className={INPUT} value={form.residentId} onChange={e => handleResidentChange(e.target.value)}>
                    <option value="">No aplica / Sin identificar</option>
                    {residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Ubicación del incidente *</label>
                  <input required className={INPUT} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ej. Dormitorio 3, Comedor" />
                </div>
              </div>

              <div>
                <label className={LABEL}>Descripción detallada *</label>
                <textarea required rows={3} className={INPUT} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describa con detalle lo ocurrido..." />
              </div>

              <div>
                <label className={LABEL}>Reportado por *</label>
                <input required className={INPUT} value={form.reportedBy} onChange={e => set('reportedBy', e.target.value)} placeholder="Nombre del funcionario que reporta" />
              </div>

              {/* Witnesses */}
              <div>
                <label className={LABEL}>Testigos</label>
                <div className="flex gap-2">
                  <input className={INPUT} value={witnessInput} onChange={e => setWitnessInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addWitness(); } }}
                    placeholder="Nombre del testigo + Enter" />
                  <button type="button" onClick={addWitness} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">+</button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.witnesses.map((w, i) => (
                    <span key={i} className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full">
                      {w}
                      <button type="button" onClick={() => setForm(f => ({ ...f, witnesses: f.witnesses.filter((_, idx) => idx !== i) }))} className="text-gray-400 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions taken */}
              <div>
                <label className={LABEL}>Acciones tomadas</label>
                <div className="flex gap-2">
                  <input className={INPUT} value={actionInput} onChange={e => setActionInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAction(); } }}
                    placeholder="Acción realizada + Enter" />
                  <button type="button" onClick={addAction} className="px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">+</button>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {form.actionsTaken.map((a, i) => (
                    <span key={i} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full">
                      {a}
                      <button type="button" onClick={() => setForm(f => ({ ...f, actionsTaken: f.actionsTaken.filter((_, idx) => idx !== i) }))} className="text-blue-400 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Notifications */}
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4" />Registro de Notificaciones (Art. 12 k)
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { label: 'Familia notificada', atField: 'familyNotifiedAt' as const, byField: 'familyNotifiedBy' as const },
                    { label: 'Médico notificado', atField: 'doctorNotifiedAt' as const, byField: 'doctorNotifiedBy' as const },
                    { label: 'SEREMI Salud notificado', atField: 'seremiNotifiedAt' as const, byField: 'seremiNotifiedBy' as const },
                  ].map(n => (
                    <div key={n.label} className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">{n.label} — fecha/hora</label>
                        <input type="datetime-local" className={INPUT} value={form[n.atField] || ''} onChange={e => set(n.atField, e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Notificado por</label>
                        <input className={INPUT} value={form[n.byField] || ''} onChange={e => set(n.byField, e.target.value)} placeholder="Nombre funcionario" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className={LABEL}>Plan de seguimiento</label>
                <textarea rows={2} className={INPUT} value={form.followUp} onChange={e => set('followUp', e.target.value)} placeholder="Medidas a tomar, próximas acciones..." />
              </div>

              <div>
                <label className={LABEL}>Estado</label>
                <select className={INPUT} value={form.status} onChange={e => set('status', e.target.value as IncidentStatus)}>
                  {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                  Cancelar
                </button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {editingId ? 'Guardar cambios' : 'Registrar incidente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
