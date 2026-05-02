import React, { useState, useEffect, useMemo } from 'react';
import { UserCheck, Plus, LogOut, Search, Calendar, X, Clock } from 'lucide-react';
import { db } from '../services/database';
import { VisitorEntry, Resident } from '../types';

const INPUT = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

const emptyForm = {
  residentId: '',
  residentName: '',
  visitorName: '',
  visitorRun: '',
  visitorPhone: '',
  relationship: '',
  date: new Date().toISOString().split('T')[0],
  entryTime: new Date().toTimeString().slice(0, 5),
  exitTime: '',
  purpose: '',
  authorizedBy: '',
  observations: '',
};

export default function VisitorLog() {
  const [entries, setEntries] = useState<VisitorEntry[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [registeringExit, setRegisteringExit] = useState<string | null>(null);
  const [exitTime, setExitTime] = useState('');

  const load = () => db.getVisitorLog(date).then(setEntries);

  useEffect(() => {
    db.getResidents().then(setResidents);
  }, []);

  useEffect(() => { load(); }, [date]);

  const filtered = useMemo(() => {
    if (!search) return entries;
    const q = search.toLowerCase();
    return entries.filter(e =>
      e.visitorName.toLowerCase().includes(q) ||
      e.residentName.toLowerCase().includes(q) ||
      e.relationship.toLowerCase().includes(q)
    );
  }, [entries, search]);

  const activeVisits = useMemo(() => entries.filter(e => !e.exitTime), [entries]);

  const set = (field: keyof typeof emptyForm, value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleResidentChange = (id: string) => {
    const r = residents.find(res => res.id === id);
    setForm(f => ({ ...f, residentId: id, residentName: r?.name || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.createVisitorEntry({ ...form, exitTime: form.exitTime || undefined });
    setShowForm(false);
    setForm(emptyForm);
    load();
  };

  const registerExit = async (id: string) => {
    if (!exitTime) return;
    await db.updateVisitorEntry(id, { exitTime });
    setRegisteringExit(null);
    setExitTime('');
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UserCheck className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Libro de Visitas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Art. 23 Decreto N°20</p>
          </div>
        </div>
        <button onClick={() => { setForm({ ...emptyForm, date }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm">
          <Plus className="w-4 h-4" />Registrar Visita
        </button>
      </div>

      {/* Active visits alert */}
      {activeVisits.length > 0 && (
        <div className="bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <p className="text-sm font-medium text-teal-800 dark:text-teal-200">{activeVisits.length} visita(s) activa(s) actualmente</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeVisits.map(v => (
              <div key={v.id} className="flex items-center gap-2 bg-white dark:bg-gray-700 rounded-lg px-3 py-1.5 border border-teal-200 dark:border-teal-700">
                <span className="text-xs text-gray-700 dark:text-gray-300">
                  <span className="font-medium">{v.visitorName}</span> visita a {v.residentName} (desde {v.entryTime})
                </span>
                {registeringExit === v.id ? (
                  <div className="flex items-center gap-1">
                    <input type="time" value={exitTime} onChange={e => setExitTime(e.target.value)}
                      className="px-2 py-0.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                    <button onClick={() => registerExit(v.id)} className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded">OK</button>
                    <button onClick={() => setRegisteringExit(null)} className="text-xs text-gray-400 hover:text-gray-600">×</button>
                  </div>
                ) : (
                  <button onClick={() => { setRegisteringExit(v.id); setExitTime(new Date().toTimeString().slice(0, 5)); }}
                    className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline">
                    <LogOut className="w-3 h-3" />Registrar salida
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className={`${INPUT} pl-9`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar visitante, residente..." />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Visitas del día', value: entries.length, color: 'text-teal-600' },
          { label: 'Activas ahora', value: activeVisits.length, color: 'text-orange-500' },
          { label: 'Completadas', value: entries.filter(e => e.exitTime).length, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Entries list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <UserCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No hay visitas registradas para este día</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['Visitante', 'Residente', 'Parentesco', 'Entrada', 'Salida', 'Motivo', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(entry => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{entry.visitorName}</p>
                    {entry.visitorRun && <p className="text-xs text-gray-400">{entry.visitorRun}</p>}
                    {entry.visitorPhone && <p className="text-xs text-gray-400">{entry.visitorPhone}</p>}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{entry.residentName}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{entry.relationship}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                      <Clock className="w-3.5 h-3.5 text-green-500" />{entry.entryTime}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {entry.exitTime ? (
                      <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
                        <Clock className="w-3.5 h-3.5 text-red-400" />{entry.exitTime}
                      </span>
                    ) : (
                      <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">En visita</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400 max-w-[160px] truncate">{entry.purpose}</td>
                  <td className="px-4 py-3">
                    {!entry.exitTime && (
                      <button onClick={() => { setRegisteringExit(entry.id); setExitTime(new Date().toTimeString().slice(0, 5)); }}
                        className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap">
                        <LogOut className="w-3 h-3" />Registrar salida
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Registrar Visita</h2>
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
                  <label className={LABEL}>Hora de entrada *</label>
                  <input type="time" required className={INPUT} value={form.entryTime} onChange={e => set('entryTime', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Residente visitado *</label>
                <select required className={INPUT} value={form.residentId} onChange={e => handleResidentChange(e.target.value)}>
                  <option value="">Seleccionar residente...</option>
                  {residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Nombre del visitante *</label>
                  <input required className={INPUT} value={form.visitorName} onChange={e => set('visitorName', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Parentesco *</label>
                  <input required className={INPUT} value={form.relationship} onChange={e => set('relationship', e.target.value)} placeholder="Ej. Hijo/a, Amigo/a" />
                </div>
                <div>
                  <label className={LABEL}>RUN del visitante</label>
                  <input className={INPUT} value={form.visitorRun} onChange={e => set('visitorRun', e.target.value)} placeholder="12.345.678-9" />
                </div>
                <div>
                  <label className={LABEL}>Teléfono</label>
                  <input className={INPUT} value={form.visitorPhone} onChange={e => set('visitorPhone', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Motivo de la visita *</label>
                <input required className={INPUT} value={form.purpose} onChange={e => set('purpose', e.target.value)} placeholder="Visita familiar, entrega de artículos..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Hora de salida</label>
                  <input type="time" className={INPUT} value={form.exitTime} onChange={e => set('exitTime', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Autorizado por</label>
                  <input className={INPUT} value={form.authorizedBy} onChange={e => set('authorizedBy', e.target.value)} />
                </div>
              </div>
              <div>
                <label className={LABEL}>Observaciones</label>
                <textarea rows={2} className={INPUT} value={form.observations} onChange={e => set('observations', e.target.value)} />
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm">
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
