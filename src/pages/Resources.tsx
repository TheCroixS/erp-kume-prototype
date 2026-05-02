import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Edit2, Trash2, AlertTriangle, CheckCircle, X, Search, Printer } from 'lucide-react';
import { db } from '../services/database';
import { ResourceItem, ResourceCategory, ResourceCondition } from '../types';

const INPUT = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

const CATEGORIES: { value: ResourceCategory; label: string; color: string }[] = [
  { value: 'infraestructura', label: 'Infraestructura', color: 'blue' },
  { value: 'equipamiento_medico', label: 'Equipamiento Médico', color: 'red' },
  { value: 'mobiliario', label: 'Mobiliario', color: 'purple' },
  { value: 'insumos', label: 'Insumos', color: 'orange' },
  { value: 'vehiculo', label: 'Vehículo', color: 'green' },
  { value: 'otro', label: 'Otro', color: 'gray' },
];

const CONDITIONS: { value: ResourceCondition; label: string }[] = [
  { value: 'bueno', label: 'Bueno' },
  { value: 'regular', label: 'Regular' },
  { value: 'malo', label: 'Malo' },
  { value: 'en_reparacion', label: 'En reparación' },
  { value: 'dado_de_baja', label: 'Dado de baja' },
];

const conditionBadge = (c: ResourceCondition) => {
  const map: Record<ResourceCondition, string> = {
    bueno: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
    regular: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
    malo: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
    en_reparacion: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    dado_de_baja: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
  };
  return map[c];
};

const catColor = (cat: ResourceCategory) =>
  CATEGORIES.find(c => c.value === cat)?.color || 'gray';

const emptyForm: Omit<ResourceItem, 'id' | 'createdAt' | 'updatedAt'> = {
  category: 'infraestructura',
  name: '',
  description: '',
  quantity: 1,
  unit: 'unidad',
  condition: 'bueno',
  location: '',
  acquisitionDate: '',
  lastMaintenanceDate: '',
  nextMaintenanceDate: '',
  supplier: '',
  serialNumber: '',
  notes: '',
};

export default function Resources() {
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [filter, setFilter] = useState<ResourceCategory | 'todas'>('todas');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ResourceItem | null>(null);
  const [form, setForm] = useState(emptyForm);

  const load = () => db.getResources().then(setItems);
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter(item => {
    if (filter !== 'todas' && item.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return item.name.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q);
    }
    return true;
  }), [items, filter, search]);

  const needsMaintenance = useMemo(() =>
    items.filter(i => i.nextMaintenanceDate && new Date(i.nextMaintenanceDate) <= new Date(Date.now() + 30 * 86400000)),
    [items]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (item: ResourceItem) => {
    setEditing(item);
    setForm({ ...item });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await db.updateResource(editing.id, form);
    } else {
      await db.createResource(form);
    }
    setShowForm(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este recurso?')) return;
    await db.deleteResource(id);
    load();
  };

  const set = (field: keyof typeof emptyForm, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const counts = useMemo(() => {
    const c: Record<string, number> = { todas: items.length };
    CATEGORIES.forEach(cat => {
      c[cat.value] = items.filter(i => i.category === cat.value).length;
    });
    return c;
  }, [items]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recursos e Infraestructura</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Art. 9-10 Decreto N°20</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
            <Printer className="w-4 h-4" />Imprimir
          </button>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
            <Plus className="w-4 h-4" />Agregar Recurso
          </button>
        </div>
      </div>

      {/* Maintenance alerts */}
      {needsMaintenance.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{needsMaintenance.length} recurso(s) con mantención próxima</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {needsMaintenance.map(i => (
              <span key={i.id} className="text-xs bg-yellow-100 dark:bg-yellow-800/50 text-yellow-800 dark:text-yellow-300 px-2 py-0.5 rounded-full">
                {i.name} — {i.nextMaintenanceDate ? new Date(i.nextMaintenanceDate).toLocaleDateString('es-CL') : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilter('todas')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === 'todas' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
          Todas ({counts.todas})
        </button>
        {CATEGORIES.map(cat => (
          <button key={cat.value} onClick={() => setFilter(cat.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === cat.value ? `bg-${cat.color}-600 text-white` : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
            {cat.label} ({counts[cat.value] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <input className={`${INPUT} pl-9`} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, ubicación..." />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total ítems', value: items.length, color: 'text-blue-600' },
          { label: 'En buen estado', value: items.filter(i => i.condition === 'bueno').length, color: 'text-green-600' },
          { label: 'En reparación', value: items.filter(i => i.condition === 'en_reparacion').length, color: 'text-orange-600' },
          { label: 'Dados de baja', value: items.filter(i => i.condition === 'dado_de_baja').length, color: 'text-gray-500' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Items table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No hay recursos registrados</p>
            <p className="text-sm mt-1">Haz clic en "Agregar Recurso" para comenzar</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['Nombre', 'Categoría', 'Cantidad', 'Ubicación', 'Estado', 'Próx. Mantención', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                    {item.serialNumber && <p className="text-xs text-gray-400">S/N: {item.serialNumber}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${catColor(item.category)}-100 dark:bg-${catColor(item.category)}-900/30 text-${catColor(item.category)}-700 dark:text-${catColor(item.category)}-300`}>
                      {CATEGORIES.find(c => c.value === item.category)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.quantity} {item.unit}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{item.location}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${conditionBadge(item.condition)}`}>
                      {CONDITIONS.find(c => c.value === item.condition)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-xs">
                    {item.nextMaintenanceDate ? new Date(item.nextMaintenanceDate).toLocaleDateString('es-CL') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(item)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Editar Recurso' : 'Nuevo Recurso'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className={LABEL}>Nombre *</label>
                  <input required className={INPUT} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ej. Cama clínica eléctrica" />
                </div>
                <div>
                  <label className={LABEL}>Categoría *</label>
                  <select required className={INPUT} value={form.category} onChange={e => set('category', e.target.value as ResourceCategory)}>
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Estado *</label>
                  <select required className={INPUT} value={form.condition} onChange={e => set('condition', e.target.value as ResourceCondition)}>
                    {CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Cantidad *</label>
                  <input type="number" required min={0} className={INPUT} value={form.quantity} onChange={e => set('quantity', Number(e.target.value))} />
                </div>
                <div>
                  <label className={LABEL}>Unidad de medida *</label>
                  <input required className={INPUT} value={form.unit} onChange={e => set('unit', e.target.value)} placeholder="unidad, m², litro..." />
                </div>
                <div>
                  <label className={LABEL}>Ubicación *</label>
                  <input required className={INPUT} value={form.location} onChange={e => set('location', e.target.value)} placeholder="Ej. Habitación 1, Cocina" />
                </div>
                <div>
                  <label className={LABEL}>N° de Serie</label>
                  <input className={INPUT} value={form.serialNumber || ''} onChange={e => set('serialNumber', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Proveedor</label>
                  <input className={INPUT} value={form.supplier || ''} onChange={e => set('supplier', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Fecha de adquisición</label>
                  <input type="date" className={INPUT} value={form.acquisitionDate || ''} onChange={e => set('acquisitionDate', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Última mantención</label>
                  <input type="date" className={INPUT} value={form.lastMaintenanceDate || ''} onChange={e => set('lastMaintenanceDate', e.target.value)} />
                </div>
                <div>
                  <label className={LABEL}>Próxima mantención</label>
                  <input type="date" className={INPUT} value={form.nextMaintenanceDate || ''} onChange={e => set('nextMaintenanceDate', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL}>Descripción</label>
                  <textarea rows={2} className={INPUT} value={form.description || ''} onChange={e => set('description', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL}>Notas</label>
                  <textarea rows={2} className={INPUT} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                  Cancelar
                </button>
                <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                  <CheckCircle className="w-4 h-4" />
                  {editing ? 'Guardar cambios' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
