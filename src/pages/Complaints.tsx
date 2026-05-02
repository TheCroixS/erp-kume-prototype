import React, { useState, useEffect } from 'react';
import {
  MessageSquare, Plus, Search, Filter, CheckCircle,
  Clock, AlertTriangle, X, Save, ChevronDown, ThumbsUp,
  ThumbsDown, Lightbulb
} from 'lucide-react';
import { db } from '../services/database';
import { ComplaintRecord, ComplaintType, ComplaintStatus, ComplaintCategory } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TYPE_CONFIG: Record<ComplaintType, { label: string; icon: React.ElementType; color: string }> = {
  reclamo: { label: 'Reclamo', icon: ThumbsDown, color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
  sugerencia: { label: 'Sugerencia', icon: Lightbulb, color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  felicitacion: { label: 'Felicitación', icon: ThumbsUp, color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
};

const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string }> = {
  pendiente: { label: 'Pendiente', color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' },
  en_proceso: { label: 'En Proceso', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  resuelto: { label: 'Resuelto', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  cerrado: { label: 'Cerrado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
};

const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  atencion_personal: 'Atención del Personal',
  alimentacion: 'Alimentación',
  infraestructura: 'Infraestructura',
  medicacion: 'Medicación',
  higiene: 'Higiene y Aseo',
  actividades: 'Actividades',
  administracion: 'Administración',
  otro: 'Otro',
};

const EMPTY_FORM: Omit<ComplaintRecord, 'id' | 'folio' | 'createdAt' | 'updatedAt'> = {
  type: 'reclamo',
  submittedBy: 'familiar',
  submitterName: '',
  submitterRelationship: '',
  residentId: '',
  date: new Date().toISOString().split('T')[0],
  category: 'atencion_personal',
  description: '',
  status: 'pendiente',
  response: '',
  respondedBy: '',
  respondedAt: '',
};

export default function Complaints() {
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [respondMode, setRespondMode] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [respondedBy, setRespondedBy] = useState('');

  useEffect(() => { loadComplaints(); }, []);

  async function loadComplaints() {
    try {
      const data = await db.getComplaints();
      setComplaints(data);
    } finally {
      setLoading(false);
    }
  }

  const filtered = complaints.filter(c => {
    const matchSearch = c.submitterName.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      String(c.folio).includes(search);
    const matchType = filterType === 'all' || c.type === filterType;
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const selected = complaints.find(c => c.id === selectedId) || null;

  async function handleSave() {
    if (!form.submitterName || !form.description) {
      alert('El nombre del solicitante y la descripción son obligatorios');
      return;
    }
    setSaving(true);
    try {
      await db.createComplaint(form);
      await loadComplaints();
      setShowForm(false);
      setForm({ ...EMPTY_FORM });
    } finally {
      setSaving(false);
    }
  }

  async function handleRespond(id: string) {
    if (!responseText) return;
    await db.updateComplaint(id, {
      status: 'resuelto',
      response: responseText,
      respondedBy,
      respondedAt: new Date().toISOString(),
    });
    await loadComplaints();
    setRespondMode(null);
    setResponseText('');
    setRespondedBy('');
    if (selectedId === id) {
      const updated = await db.getComplaints();
      setComplaints(updated);
    }
  }

  async function updateStatus(id: string, status: ComplaintStatus) {
    await db.updateComplaint(id, { status });
    await loadComplaints();
  }

  const counts = {
    pendiente: complaints.filter(c => c.status === 'pendiente').length,
    en_proceso: complaints.filter(c => c.status === 'en_proceso').length,
    resuelto: complaints.filter(c => c.status === 'resuelto').length,
    total: complaints.length,
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reclamos y Sugerencias</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Libro de registro según Art. 29 b Decreto N°20
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Registro
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registros', value: counts.total, color: 'text-gray-900 dark:text-white' },
          { label: 'Pendientes', value: counts.pendiente, color: 'text-orange-600' },
          { label: 'En Proceso', value: counts.en_proceso, color: 'text-blue-600' },
          { label: 'Resueltos', value: counts.resuelto, color: 'text-green-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, descripción o folio..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">Todos los tipos</option>
          {Object.entries(TYPE_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>

      {/* Main content: list + detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                {complaints.length === 0 ? 'No hay registros.' : 'Sin resultados.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map(c => {
                const TypeIcon = TYPE_CONFIG[c.type].icon;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${
                      selectedId === c.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${TYPE_CONFIG[c.type].color}`}>
                          <TypeIcon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">#{String(c.folio).padStart(4, '0')}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_CONFIG[c.type].color}`}>
                              {TYPE_CONFIG[c.type].label}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_CONFIG[c.status].color}`}>
                              {STATUS_CONFIG[c.status].label}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            {c.submitterName}
                            {c.submitterRelationship && <span className="text-gray-500 font-normal"> ({c.submitterRelationship})</span>}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {CATEGORY_LABELS[c.category]} · {format(new Date(c.date), 'dd/MM/yyyy', { locale: es })}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-2">{c.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          {!selected ? (
            <div className="text-center py-8">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Selecciona un registro para ver el detalle</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-gray-500">#{String(selected.folio).padStart(4, '0')}</span>
                <select
                  value={selected.status}
                  onChange={e => updateStatus(selected.id, e.target.value as ComplaintStatus)}
                  className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
                <span className={`text-sm px-2 py-0.5 rounded-full font-medium ${TYPE_CONFIG[selected.type].color}`}>
                  {TYPE_CONFIG[selected.type].label}
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Presentado por</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{selected.submitterName}</p>
                {selected.submitterRelationship && (
                  <p className="text-xs text-gray-500">{selected.submitterRelationship}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Categoría</p>
                <p className="text-sm text-gray-900 dark:text-white">{CATEGORY_LABELS[selected.category]}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
                <p className="text-sm text-gray-900 dark:text-white">
                  {format(new Date(selected.date), 'dd MMMM yyyy', { locale: es })}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Descripción</p>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{selected.description}</p>
              </div>

              {selected.response ? (
                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                  <p className="text-xs text-green-700 dark:text-green-300 font-medium mb-1">Respuesta registrada</p>
                  <p className="text-sm text-gray-900 dark:text-white">{selected.response}</p>
                  {selected.respondedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      Por: {selected.respondedBy} — {selected.respondedAt ? format(new Date(selected.respondedAt), 'dd/MM/yyyy', { locale: es }) : ''}
                    </p>
                  )}
                </div>
              ) : (
                respondMode === selected.id ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      placeholder="Escribir respuesta..."
                      value={responseText}
                      onChange={e => setResponseText(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <input
                      placeholder="Respondido por..."
                      value={respondedBy}
                      onChange={e => setRespondedBy(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(selected.id)}
                        className="flex-1 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
                      >
                        Guardar Respuesta
                      </button>
                      <button
                        onClick={() => setRespondMode(null)}
                        className="px-3 py-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRespondMode(selected.id)}
                    className="w-full py-2 border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 dark:text-gray-400 rounded-lg hover:border-blue-400 hover:text-blue-500 transition-colors"
                  >
                    + Agregar Respuesta
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* New Complaint Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Nuevo Registro</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo *</label>
                  <select
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as ComplaintType }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría *</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value as ComplaintCategory }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Presentado por</label>
                  <select
                    value={form.submittedBy}
                    onChange={e => setForm(f => ({ ...f, submittedBy: e.target.value as any }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="residente">Residente</option>
                    <option value="familiar">Familiar</option>
                    <option value="visita">Visita</option>
                    <option value="anonimo">Anónimo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Solicitante *</label>
                <input
                  value={form.submitterName}
                  onChange={e => setForm(f => ({ ...f, submitterName: e.target.value }))}
                  placeholder={form.submittedBy === 'anonimo' ? 'Anónimo' : 'Nombre completo'}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relación con el Residente</label>
                <input
                  value={form.submitterRelationship}
                  onChange={e => setForm(f => ({ ...f, submitterRelationship: e.target.value }))}
                  placeholder="Ej: Hijo/a, Cónyuge"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción *</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describa el reclamo, sugerencia o felicitación en detalle..."
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Registrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
