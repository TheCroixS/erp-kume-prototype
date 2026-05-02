import React, { useState, useEffect, useCallback } from 'react';
import { Pill, Plus, Trash2, CheckCircle2, XCircle, AlertTriangle, Package, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { db } from '../services/database';
import { useApp } from '../contexts/AppContext';
import { MedicationScheduleRecord, MedicationStockItem, Resident, MedicalRecord } from '../types';

interface ResidentMeds {
  resident: Resident;
  record: MedicalRecord | null;
}

const SHIFT_HOURS: Record<string, [number, number]> = {
  mañana: [6, 13],
  tarde: [13, 20],
  noche: [20, 6],
};

function classifyShift(time: string): 'mañana' | 'tarde' | 'noche' {
  const h = parseInt(time.split(':')[0], 10);
  if (h >= 6 && h < 13) return 'mañana';
  if (h >= 13 && h < 20) return 'tarde';
  return 'noche';
}

export default function Medications() {
  const { state } = useApp();
  const [view, setView] = useState<'schedule' | 'stock'>('schedule');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState<MedicationScheduleRecord[]>([]);
  const [stock, setStock] = useState<MedicationStockItem[]>([]);
  const [residentMeds, setResidentMeds] = useState<ResidentMeds[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedResident, setExpandedResident] = useState<string | null>(null);

  // Stock form
  const [showStockForm, setShowStockForm] = useState(false);
  const [stockForm, setStockForm] = useState({ residentId: '', residentName: '', medicationName: '', currentStock: 0, minStock: 5, unit: 'comprimido' });

  const activeResidents = state.residents.filter(r => r.status === 'activo');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sched, stockData] = await Promise.all([
        db.getMedicationSchedules(selectedDate),
        db.getMedicationStock(),
      ]);
      setSchedules(sched);
      setStock(stockData);

      // Load medications from medical records
      const pairs: ResidentMeds[] = await Promise.all(
        activeResidents.map(async r => ({
          resident: r,
          record: await db.getMedicalRecord(r.id),
        }))
      );
      setResidentMeds(pairs.filter(p => p.record && p.record.medications.length > 0));
    } finally {
      setLoading(false);
    }
  }, [selectedDate, state.residents]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleAdminister = async (sched: MedicationScheduleRecord) => {
    const now = new Date().toISOString();
    await db.updateMedicationSchedule(sched.id, {
      administered: !sched.administered,
      administeredAt: !sched.administered ? now : undefined,
      administeredBy: !sched.administered ? 'Enfermería' : undefined,
      skipped: false,
    });
    await loadData();
  };

  const toggleSkip = async (sched: MedicationScheduleRecord) => {
    await db.updateMedicationSchedule(sched.id, {
      skipped: !sched.skipped,
      administered: false,
    });
    await loadData();
  };

  const generateSchedulesFromRecords = async () => {
    let created = 0;
    for (const { resident, record } of residentMeds) {
      if (!record) continue;
      for (const med of record.medications.filter(m => m.active)) {
        const schedTime = med.schedule?.match(/\d{1,2}:\d{2}/)?.[0] || '08:00';
        const exists = schedules.find(s => s.residentId === resident.id && s.medicationName === med.name && s.date === selectedDate);
        if (!exists) {
          await db.createMedicationSchedule({
            residentId: resident.id,
            residentName: resident.name,
            medicationName: med.name,
            dose: med.dose,
            route: 'oral',
            scheduledTime: schedTime,
            date: selectedDate,
            administered: false,
            skipped: false,
          });
          created++;
        }
      }
    }
    if (created > 0) await loadData();
    else alert('No hay nuevos medicamentos para agregar al calendario de hoy');
  };

  const saveStock = async () => {
    const res = activeResidents.find(r => r.id === stockForm.residentId);
    if (!res || !stockForm.medicationName) return;
    await db.upsertMedicationStock({ ...stockForm, residentName: res.name });
    setShowStockForm(false);
    setStockForm({ residentId: '', residentName: '', medicationName: '', currentStock: 0, minStock: 5, unit: 'comprimido' });
    await loadData();
  };

  const deleteStock = async (id: string) => {
    await db.deleteMedicationStock(id);
    await loadData();
  };

  const filteredSchedules = schedules.filter(s =>
    s.residentName.toLowerCase().includes(search.toLowerCase()) ||
    s.medicationName.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = stock.filter(s => s.currentStock <= s.minStock);
  const administered = schedules.filter(s => s.administered).length;
  const total = schedules.length;
  const pending = total - administered - schedules.filter(s => s.skipped).length;

  const byShift = (shift: string) =>
    filteredSchedules.filter(s => classifyShift(s.scheduledTime) === shift);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Medicamentos</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Administración y stock por residente — Art. 12 b</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('schedule')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view==='schedule' ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            Agenda del Día
          </button>
          <button onClick={() => setView('stock')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${view==='stock' ? 'bg-blue-600 text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
            Stock
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total hoy', value: total, color: 'text-gray-900 dark:text-white', bg: 'bg-gray-50 dark:bg-gray-700/50' },
          { label: 'Administrados', value: administered, color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Pendientes', value: pending, color: 'text-yellow-700 dark:text-yellow-300', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
          { label: 'Stock bajo', value: lowStock.length, color: lowStock.length > 0 ? 'text-red-700 dark:text-red-300' : 'text-gray-500', bg: lowStock.length > 0 ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-700/50' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Low stock alert */}
      {lowStock.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-red-800 dark:text-red-200">Stock crítico en {lowStock.length} medicamento(s)</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {lowStock.map(s => (
                  <span key={s.id} className="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 rounded-full">
                    {s.residentName}: {s.medicationName} ({s.currentStock} {s.unit}s)
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE VIEW */}
      {view === 'schedule' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar residente o medicamento..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button onClick={generateSchedulesFromRecords}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4 mr-1" />Generar desde Fichas
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
          ) : filteredSchedules.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Pill className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">No hay medicamentos agendados para esta fecha</p>
              <p className="text-sm mt-1">Usa "Generar desde Fichas" para crear la agenda automáticamente</p>
            </div>
          ) : (
            ['mañana', 'tarde', 'noche'].map(shift => {
              const items = byShift(shift);
              if (items.length === 0) return null;
              return (
                <div key={shift}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 capitalize">{shift}</h3>
                  <div className="space-y-2">
                    {items.sort((a,b) => a.scheduledTime.localeCompare(b.scheduledTime)).map(s => (
                      <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${s.administered ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : s.skipped ? 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600 opacity-60' : 'bg-white dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}>
                        <span className="text-xs font-mono text-gray-500 w-12 shrink-0">{s.scheduledTime}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{s.medicationName} <span className="text-gray-500 font-normal">{s.dose}</span></p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{s.residentName} · {s.route}</p>
                        </div>
                        {s.administered && s.administeredAt && (
                          <span className="text-xs text-green-600 dark:text-green-400 shrink-0">{new Date(s.administeredAt).toLocaleTimeString('es-CL', {hour:'2-digit',minute:'2-digit'})}</span>
                        )}
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => toggleAdminister(s)} title={s.administered ? 'Desmarcar' : 'Administrado'}
                            className={`p-1.5 rounded-lg transition-colors ${s.administered ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30' : 'text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                            <CheckCircle2 className="w-5 h-5" />
                          </button>
                          <button onClick={() => toggleSkip(s)} title="Omitir"
                            className={`p-1.5 rounded-lg transition-colors ${s.skipped ? 'text-red-600' : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'}`}>
                            <XCircle className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* STOCK VIEW */}
      {view === 'stock' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Inventario de Medicamentos</h2>
            <button onClick={() => setShowStockForm(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4 mr-1" />Agregar Medicamento
            </button>
          </div>

          {showStockForm && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">Nuevo Registro de Stock</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Residente</label>
                  <select value={stockForm.residentId} onChange={e => setStockForm({...stockForm, residentId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Seleccionar...</option>
                    {activeResidents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Medicamento</label>
                  <input value={stockForm.medicationName} onChange={e => setStockForm({...stockForm, medicationName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Stock actual</label>
                  <input type="number" value={stockForm.currentStock} onChange={e => setStockForm({...stockForm, currentStock: +e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Alerta cuando ≤</label>
                  <input type="number" value={stockForm.minStock} onChange={e => setStockForm({...stockForm, minStock: +e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Unidad</label>
                  <select value={stockForm.unit} onChange={e => setStockForm({...stockForm, unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['comprimido','cápsula','ml','parche','sobre','ampolla','frasco'].map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowStockForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">Cancelar</button>
                <button onClick={saveStock} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">Guardar</button>
              </div>
            </div>
          )}

          {stock.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3" />
              <p>No hay medicamentos en inventario</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                  <th className="pb-2 pr-4">Residente</th>
                  <th className="pb-2 pr-4">Medicamento</th>
                  <th className="pb-2 pr-4">Stock</th>
                  <th className="pb-2 pr-4">Unidad</th>
                  <th className="pb-2 pr-4">Estado</th>
                  <th></th>
                </tr></thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {stock.map(s => (
                    <tr key={s.id} className={s.currentStock <= s.minStock ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                      <td className="py-2 pr-4 text-gray-900 dark:text-white">{s.residentName}</td>
                      <td className="py-2 pr-4 font-medium text-gray-900 dark:text-white">{s.medicationName}</td>
                      <td className="py-2 pr-4">
                        <input type="number" value={s.currentStock}
                          onChange={async e => { await db.upsertMedicationStock({...s, currentStock: +e.target.value}); loadData(); }}
                          className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                      </td>
                      <td className="py-2 pr-4 text-gray-600 dark:text-gray-400">{s.unit}</td>
                      <td className="py-2 pr-4">
                        {s.currentStock <= s.minStock
                          ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"><AlertTriangle className="w-3 h-3" />Crítico</span>
                          : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"><CheckCircle2 className="w-3 h-3" />OK</span>}
                      </td>
                      <td className="py-2"><button onClick={() => deleteStock(s.id)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Medications by resident from records */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Medicamentos por Residente (Fichas Clínicas)</h2>
        {residentMeds.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">No hay residentes con medicamentos en su ficha clínica.</p>
        ) : (
          <div className="space-y-2">
            {residentMeds.map(({ resident, record }) => (
              <div key={resident.id} className="border border-gray-200 dark:border-gray-600 rounded-lg">
                <button onClick={() => setExpandedResident(expandedResident === resident.id ? null : resident.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{resident.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{record?.medications.filter(m => m.active).length} activo(s) de {record?.medications.length} total</p>
                  </div>
                  {expandedResident === resident.id ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                </button>
                {expandedResident === resident.id && record && (
                  <div className="border-t border-gray-200 dark:border-gray-600 p-4">
                    <div className="space-y-2">
                      {record.medications.map(med => (
                        <div key={med.id} className={`flex items-start justify-between p-3 rounded-lg ${med.active ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-700/30 opacity-60'}`}>
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-white">{med.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{med.dose} · {med.frequency} · {med.schedule}</p>
                            <p className="text-xs text-gray-400">{med.indication} · Dr/a. {med.prescribedBy}</p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${med.active ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                            {med.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
