import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Search, DollarSign, Users,
  X, Save, CheckCircle, AlertCircle, Phone, Mail, MapPin, Trash2, Printer
} from 'lucide-react';
import { db } from '../services/database';
import { ResidentContract, Resident } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SignatureCanvas from '../components/SignatureCanvas';

const DEFAULT_INCLUDES = [
  'Alojamiento y alimentación',
  'Cuidado de enfermería (técnico auxiliar)',
  'Aseo personal y de habitación',
  'Lavado de ropa',
  'Actividades de estimulación',
  'Acceso a telecomunicaciones',
];

const DEFAULT_EXIT_CAUSES = [
  'Decisión voluntaria del residente o representante legal',
  'Condición de salud grave que requiere hospitalización',
  'Incumplimiento grave del reglamento interno',
  'No pago de mensualidades por más de dos meses',
  'Fallecimiento del residente',
];

const DEFAULT_EST_OBLIGATIONS = [
  'Proveer alimentación adecuada a las necesidades nutricionales del residente',
  'Mantener la ficha clínica actualizada',
  'Respetar la privacidad y autonomía del residente',
  'Informar a la familia ante cambios significativos en el estado de salud',
  'Resguardar las pertenencias del residente',
];

const DEFAULT_RES_OBLIGATIONS = [
  'Respetar el reglamento interno del establecimiento',
  'Pagar la mensualidad en la fecha acordada',
  'Informar al establecimiento de cambios en su situación de salud',
  'Tratar con respeto al personal y demás residentes',
];

function emptyContract(residentId = ''): Omit<ResidentContract, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    residentId,
    contractDate: new Date().toISOString().split('T')[0],
    monthlyFee: 0,
    paymentDay: 5,
    currency: 'CLP',
    includes: [...DEFAULT_INCLUDES],
    additionalServices: [],
    emergencyContacts: [],
    exitCauses: [...DEFAULT_EXIT_CAUSES],
    obligations: {
      establishment: [...DEFAULT_EST_OBLIGATIONS],
      resident: [...DEFAULT_RES_OBLIGATIONS],
    },
    status: 'activo',
    notes: '',
  };
}

export default function Contracts() {
  const [contracts, setContracts] = useState<ResidentContract[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Omit<ResidentContract, 'id' | 'createdAt' | 'updatedAt'>>(emptyContract());
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [newService, setNewService] = useState({ name: '', monthlyCost: 0 });
  const [newContact, setNewContact] = useState({ id: '', name: '', relationship: '', phone: '', email: '', address: '' });
  const [newInclude, setNewInclude] = useState('');
  const [newOblEst, setNewOblEst] = useState('');
  const [newOblRes, setNewOblRes] = useState('');
  const [newExitCause, setNewExitCause] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [c, r] = await Promise.all([db.getContracts(), db.getResidents()]);
      setContracts(c);
      setResidents(r);
    } finally {
      setLoading(false);
    }
  }

  const residentMap = Object.fromEntries(residents.map(r => [r.id, r]));
  const filtered = contracts.filter(c => {
    const name = residentMap[c.residentId]?.name || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
      c.contractDate.includes(search);
  });
  const selected = contracts.find(c => c.id === selectedId) || null;

  function openNew() {
    setForm(emptyContract());
    setEditMode(false);
    setShowForm(true);
  }

  function openEdit(c: ResidentContract) {
    setForm({
      residentId: c.residentId,
      contractDate: c.contractDate,
      monthlyFee: c.monthlyFee,
      paymentDay: c.paymentDay,
      currency: c.currency,
      includes: [...c.includes],
      additionalServices: [...c.additionalServices],
      emergencyContacts: [...c.emergencyContacts],
      exitCauses: [...c.exitCauses],
      obligations: { establishment: [...c.obligations.establishment], resident: [...c.obligations.resident] },
      status: c.status,
      terminationDate: c.terminationDate,
      terminationReason: c.terminationReason,
      residentSignature: c.residentSignature,
      representativeSignature: c.representativeSignature,
      directorSignature: c.directorSignature,
      notes: c.notes || '',
    });
    setEditMode(true);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.residentId || form.monthlyFee < 0) {
      alert('Selecciona un residente y especifica la mensualidad');
      return;
    }
    setSaving(true);
    try {
      if (editMode && selectedId) {
        await db.updateContract(selectedId, form);
      } else {
        await db.createContract(form);
      }
      await loadData();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  function addService() {
    if (!newService.name) return;
    setForm(f => ({ ...f, additionalServices: [...f.additionalServices, { ...newService }] }));
    setNewService({ name: '', monthlyCost: 0 });
  }

  function addContact() {
    if (!newContact.name || !newContact.phone) return;
    setForm(f => ({
      ...f,
      emergencyContacts: [...f.emergencyContacts, { ...newContact, id: crypto.randomUUID() }]
    }));
    setNewContact({ id: '', name: '', relationship: '', phone: '', email: '', address: '' });
  }

  const totalFee = (c: ResidentContract) =>
    c.monthlyFee + c.additionalServices.reduce((s, sv) => s + sv.monthlyCost, 0);

  const residentsWithoutContract = residents.filter(r =>
    !contracts.some(c => c.residentId === r.id && c.status === 'activo')
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contratos de Residencia</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de contratos según Art. 28 Decreto N°20
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Contrato
        </button>
      </div>

      {/* Alert: residents without contract */}
      {residentsWithoutContract.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              {residentsWithoutContract.length} residente(s) sin contrato activo
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-0.5">
              {residentsWithoutContract.map(r => r.name).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Contratos Activos', value: contracts.filter(c => c.status === 'activo').length, color: 'text-green-600' },
          { label: 'Sin Contrato', value: residentsWithoutContract.length, color: residentsWithoutContract.length > 0 ? 'text-red-600' : 'text-gray-900 dark:text-white' },
          { label: 'Ingresos Mensuales', value: `$${contracts.filter(c => c.status === 'activo').reduce((s, c) => s + totalFee(c), 0).toLocaleString('es-CL')}`, color: 'text-blue-600' },
        ].map(s => (
          <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por residente..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(c => {
          const resident = residentMap[c.residentId];
          return (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id === selectedId ? null : c.id)}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition-all ${
                selectedId === c.id
                  ? 'border-blue-500 ring-1 ring-blue-500'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {resident?.name || 'Residente no encontrado'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Desde: {format(new Date(c.contractDate), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-green-600">
                      ${totalFee(c).toLocaleString('es-CL')}/mes
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.status === 'activo'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {c.status === 'activo' ? 'Activo' : 'Terminado'}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span><DollarSign className="w-3 h-3 inline mr-0.5" />Pago día {c.paymentDay}</span>
                  <span><Phone className="w-3 h-3 inline mr-0.5" />{c.emergencyContacts.length} contacto(s)</span>
                  <span><FileText className="w-3 h-3 inline mr-0.5" />{c.additionalServices.length} servicio(s) extra</span>
                </div>
              </div>
              {selectedId === c.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Contactos de Emergencia</p>
                    {c.emergencyContacts.length === 0 ? (
                      <p className="text-xs text-red-500">Sin contactos registrados</p>
                    ) : c.emergencyContacts.map(ec => (
                      <div key={ec.id} className="text-xs text-gray-700 dark:text-gray-300">
                        {ec.name} ({ec.relationship}) — {ec.phone}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Servicios Adicionales</p>
                    {c.additionalServices.length === 0 ? (
                      <p className="text-xs text-gray-500">Ninguno</p>
                    ) : c.additionalServices.map((s, i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-700 dark:text-gray-300">
                        <span>{s.name}</span>
                        <span>${s.monthlyCost.toLocaleString('es-CL')}/mes</span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                    className="w-full py-1.5 text-sm text-blue-600 border border-blue-300 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    Editar Contrato
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No hay contratos registrados</p>
            <button onClick={openNew} className="mt-2 text-blue-600 text-sm hover:underline">
              Crear primer contrato
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editMode ? 'Editar Contrato' : 'Nuevo Contrato de Residencia'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
              {/* Resident + dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Residente *</label>
                  <select
                    value={form.residentId}
                    onChange={e => setForm(f => ({ ...f, residentId: e.target.value }))}
                    disabled={editMode}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
                  >
                    <option value="">Seleccionar...</option>
                    {residents.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha del Contrato</label>
                  <input type="date" value={form.contractDate}
                    onChange={e => setForm(f => ({ ...f, contractDate: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensualidad Base (CLP) *</label>
                  <input type="number" min="0"
                    value={form.monthlyFee || ''}
                    onChange={e => setForm(f => ({ ...f, monthlyFee: Number(e.target.value) }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Día de Pago (del mes)</label>
                  <input type="number" min="1" max="28"
                    value={form.paymentDay}
                    onChange={e => setForm(f => ({ ...f, paymentDay: Number(e.target.value) }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Includes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Servicios Incluidos</label>
                {form.includes.map((inc, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-750 rounded mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{inc}</span>
                    <button onClick={() => setForm(f => ({ ...f, includes: f.includes.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2 mt-1">
                  <input placeholder="Agregar servicio incluido..." value={newInclude}
                    onChange={e => setNewInclude(e.target.value)}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button onClick={() => { if (newInclude) { setForm(f => ({ ...f, includes: [...f.includes, newInclude] })); setNewInclude(''); } }}
                    className="bg-blue-600 text-white rounded px-3 py-1 text-xs hover:bg-blue-700">
                    +
                  </button>
                </div>
              </div>

              {/* Additional services */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Servicios Adicionales</label>
                {form.additionalServices.map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-750 rounded mb-1 text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">${s.monthlyCost.toLocaleString('es-CL')}/mes</span>
                      <button onClick={() => setForm(f => ({ ...f, additionalServices: f.additionalServices.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 mt-1">
                  <input placeholder="Nombre servicio" value={newService.name}
                    onChange={e => setNewService(n => ({ ...n, name: e.target.value }))}
                    className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input type="number" placeholder="$/mes" value={newService.monthlyCost || ''}
                    onChange={e => setNewService(n => ({ ...n, monthlyCost: Number(e.target.value) }))}
                    className="w-24 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button onClick={addService} className="bg-blue-600 text-white rounded px-3 py-1 text-xs hover:bg-blue-700">+</button>
                </div>
              </div>

              {/* Emergency Contacts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contactos de Emergencia (Art. 28 e)
                </label>
                {form.emergencyContacts.map((ec, i) => (
                  <div key={ec.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-750 rounded mb-1 text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{ec.name} ({ec.relationship}) — {ec.phone}</span>
                    <button onClick={() => setForm(f => ({ ...f, emergencyContacts: f.emergencyContacts.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-2 mt-1">
                  <input placeholder="Nombre" value={newContact.name}
                    onChange={e => setNewContact(n => ({ ...n, name: e.target.value }))}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input placeholder="Relación" value={newContact.relationship}
                    onChange={e => setNewContact(n => ({ ...n, relationship: e.target.value }))}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input placeholder="Teléfono" value={newContact.phone}
                    onChange={e => setNewContact(n => ({ ...n, phone: e.target.value }))}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button onClick={addContact} className="bg-blue-600 text-white rounded px-3 py-1 text-xs hover:bg-blue-700">+</button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                <textarea rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              {/* Firmas digitales */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Firmas Digitales (Art. 28)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <SignatureCanvas
                    label="Firma del Residente"
                    value={form.residentSignature}
                    onChange={sig => setForm(f => ({ ...f, residentSignature: sig }))}
                  />
                  <SignatureCanvas
                    label="Firma del Representante Legal"
                    value={form.representativeSignature}
                    onChange={sig => setForm(f => ({ ...f, representativeSignature: sig }))}
                  />
                  <SignatureCanvas
                    label="Firma del Director/a"
                    value={form.directorSignature}
                    onChange={sig => setForm(f => ({ ...f, directorSignature: sig }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total mensual: <strong className="text-green-600">
                  ${(form.monthlyFee + form.additionalServices.reduce((s, sv) => s + sv.monthlyCost, 0)).toLocaleString('es-CL')} CLP
                </strong>
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Guardando...' : 'Guardar Contrato'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
