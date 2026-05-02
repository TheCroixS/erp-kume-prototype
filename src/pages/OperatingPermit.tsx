import React, { useState, useEffect } from 'react';
import {
  Shield, Plus, AlertTriangle, CheckCircle, Clock,
  X, Save, Calendar, FileText, Trash2, Bell, ExternalLink
} from 'lucide-react';
import { db } from '../services/database';
import { OperatingPermit, PermitType, PermitStatus } from '../types';
import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const PERMIT_TYPES: Record<PermitType, { label: string; article: string }> = {
  autorizacion_sanitaria: { label: 'Autorización Sanitaria (Seremi)', article: 'Art. 5-7' },
  patente_comercial: { label: 'Patente Comercial', article: 'Municipal' },
  certificado_incendios: { label: 'Certificado Prevención Incendios', article: 'Art. 5 g' },
  certificado_instalaciones_electricas: { label: 'Certificado Instalaciones Eléctricas', article: 'Art. 5 h' },
  certificado_gas: { label: 'Certificado Instalaciones Gas', article: 'Art. 5 h' },
  certificado_agua_potable: { label: 'Certificado Agua Potable', article: 'Art. 5 f' },
  certificado_recepcion_final: { label: 'Certificado Recepción Final (DOM)', article: 'Art. 5 e' },
  autorizacion_cocina: { label: 'Autorización Funcionamiento Cocina', article: 'Art. 10 o' },
  otro: { label: 'Otro Permiso', article: '—' },
};

const STATUS_CONFIG: Record<PermitStatus, { label: string; color: string; icon: React.ElementType }> = {
  vigente: { label: 'Vigente', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle },
  por_vencer: { label: 'Por Vencer', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: AlertTriangle },
  vencido: { label: 'Vencido', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: AlertTriangle },
  en_tramite: { label: 'En Trámite', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Clock },
  no_aplica: { label: 'No Aplica', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', icon: X },
};

function computeStatus(permit: OperatingPermit): PermitStatus {
  if (permit.status === 'no_aplica' || permit.status === 'en_tramite') return permit.status;
  if (!permit.expiresAt) return 'vigente';
  const days = differenceInDays(parseISO(permit.expiresAt), new Date());
  if (days < 0) return 'vencido';
  if (days <= permit.alertDaysBefore) return 'por_vencer';
  return 'vigente';
}

const EMPTY_PERMIT: Omit<OperatingPermit, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'autorizacion_sanitaria',
  name: '',
  permitNumber: '',
  issuedBy: '',
  issuedAt: new Date().toISOString().split('T')[0],
  expiresAt: '',
  status: 'vigente',
  autoRenew: false,
  alertDaysBefore: 60,
  notes: '',
};

const REQUIRED_PERMITS: PermitType[] = [
  'autorizacion_sanitaria',
  'patente_comercial',
  'certificado_incendios',
  'certificado_instalaciones_electricas',
  'certificado_gas',
  'certificado_agua_potable',
  'certificado_recepcion_final',
];

export default function OperatingPermitPage() {
  const [permits, setPermits] = useState<OperatingPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_PERMIT });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPermits(); }, []);

  async function loadPermits() {
    try {
      const data = await db.getPermits();
      setPermits(data);
    } finally {
      setLoading(false);
    }
  }

  function openNew() {
    setForm({ ...EMPTY_PERMIT });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(p: OperatingPermit) {
    setForm({
      type: p.type, name: p.name, permitNumber: p.permitNumber || '',
      issuedBy: p.issuedBy, issuedAt: p.issuedAt, expiresAt: p.expiresAt || '',
      status: p.status, autoRenew: p.autoRenew, alertDaysBefore: p.alertDaysBefore,
      notes: p.notes || '',
    });
    setEditingId(p.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.issuedBy || !form.issuedAt) {
      alert('Emisor y fecha de emisión son obligatorios');
      return;
    }
    const saveData = {
      ...form,
      name: form.name || PERMIT_TYPES[form.type].label,
    };
    setSaving(true);
    try {
      if (editingId) {
        await db.updatePermit(editingId, saveData);
      } else {
        await db.createPermit(saveData);
      }
      await loadPermits();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este permiso?')) return;
    await db.deletePermit(id);
    await loadPermits();
  }

  const permitsWithStatus = permits.map(p => ({ ...p, computedStatus: computeStatus(p) }));
  const missing = REQUIRED_PERMITS.filter(type =>
    !permits.some(p => p.type === type)
  );
  const expiring = permitsWithStatus.filter(p =>
    p.computedStatus === 'por_vencer' || p.computedStatus === 'vencido'
  );

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Permisos y Autorizaciones</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de autorizaciones y patentes según Art. 5-7 Decreto N°20
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Permiso
        </button>
      </div>

      {/* Alerts */}
      {(missing.length > 0 || expiring.length > 0) && (
        <div className="space-y-3">
          {missing.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">Permisos obligatorios sin registrar</p>
                <ul className="text-xs text-red-700 dark:text-red-300 mt-1 space-y-0.5">
                  {missing.map(t => <li key={t}>• {PERMIT_TYPES[t].label} ({PERMIT_TYPES[t].article})</li>)}
                </ul>
              </div>
            </div>
          )}
          {expiring.length > 0 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
              <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Permisos por vencer o vencidos</p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 space-y-0.5">
                  {expiring.map(p => {
                    const days = p.expiresAt ? differenceInDays(parseISO(p.expiresAt), new Date()) : null;
                    return (
                      <li key={p.id}>
                        • {p.name || PERMIT_TYPES[p.type].label}
                        {days !== null && (days < 0 ? ' — VENCIDO' : ` — vence en ${days} días`)}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Registrados', value: permits.length, color: 'text-gray-900 dark:text-white' },
          { label: 'Vigentes', value: permitsWithStatus.filter(p => p.computedStatus === 'vigente').length, color: 'text-green-600' },
          { label: 'Por Vencer', value: permitsWithStatus.filter(p => p.computedStatus === 'por_vencer').length, color: 'text-yellow-600' },
          { label: 'Vencidos', value: permitsWithStatus.filter(p => p.computedStatus === 'vencido').length, color: 'text-red-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Permits List */}
      <div className="space-y-3">
        {permitsWithStatus.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No hay permisos registrados</p>
            <button onClick={openNew} className="mt-2 text-blue-600 text-sm hover:underline">Registrar primer permiso</button>
          </div>
        ) : (
          permitsWithStatus.map(p => {
            const cfg = STATUS_CONFIG[p.computedStatus];
            const StatusIcon = cfg.icon;
            const days = p.expiresAt ? differenceInDays(parseISO(p.expiresAt), new Date()) : null;
            return (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                      <StatusIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {p.name || PERMIT_TYPES[p.type].label}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{PERMIT_TYPES[p.type].article}</span>
                        {p.permitNumber && <span className="text-xs text-gray-500 dark:text-gray-400">N° {p.permitNumber}</span>}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span>Emitido por: {p.issuedBy}</span>
                        <span>{format(parseISO(p.issuedAt), 'dd/MM/yyyy', { locale: es })}</span>
                        {p.expiresAt && (
                          <span className={days !== null && days < 0 ? 'text-red-600 font-medium' : days !== null && days <= p.alertDaysBefore ? 'text-yellow-600 font-medium' : ''}>
                            Vence: {format(parseISO(p.expiresAt), 'dd/MM/yyyy', { locale: es })}
                            {days !== null && (days < 0 ? ` (Vencido hace ${Math.abs(days)} días)` : ` (${days} días)`)}
                          </span>
                        )}
                      </div>
                      {p.notes && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic">{p.notes}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Editar Permiso' : 'Nuevo Permiso'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Permiso *</label>
                <select value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as PermitType, name: PERMIT_TYPES[e.target.value as PermitType].label }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  {Object.entries(PERMIT_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Personalizado</label>
                <input value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={PERMIT_TYPES[form.type].label}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">N° de Permiso</label>
                  <input value={form.permitNumber}
                    onChange={e => setForm(f => ({ ...f, permitNumber: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Emitido por *</label>
                  <input value={form.issuedBy}
                    onChange={e => setForm(f => ({ ...f, issuedBy: e.target.value }))}
                    placeholder="Ej: Seremi de Salud RM"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Emisión *</label>
                  <input type="date" value={form.issuedAt}
                    onChange={e => setForm(f => ({ ...f, issuedAt: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Vencimiento</label>
                  <input type="date" value={form.expiresAt}
                    onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Alertar con anticipación (días)
                </label>
                <input type="number" min="0" value={form.alertDaysBefore}
                  onChange={e => setForm(f => ({ ...f, alertDaysBefore: Number(e.target.value) }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estado</label>
                <select value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value as PermitStatus }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas</label>
                <textarea rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm" />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
