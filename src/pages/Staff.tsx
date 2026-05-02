import React, { useState, useEffect } from 'react';
import {
  Users, Plus, Search, Phone, Mail, Calendar,
  Award, ChevronRight, CheckCircle, XCircle, AlertTriangle,
  Briefcase, Clock, BookOpen, X, Save, Trash2, Edit3
} from 'lucide-react';
import { db } from '../services/database';
import { StaffMember, StaffRole, TrainingRecord, StaffCertification, StaffShift } from '../types';

const ROLE_LABELS: Record<StaffRole, string> = {
  director_tecnico: 'Director/a Técnico/a',
  director_administrativo: 'Director/a Administrativo/a',
  auxiliar_enfermeria: 'Auxiliar de Enfermería',
  tecnico_enfermeria: 'Técnico/a en Enfermería',
  cuidador: 'Cuidador/a',
  manipulador_alimentos: 'Manipulador/a de Alimentos',
  auxiliar_aseo: 'Auxiliar de Aseo y Lavandería',
  otro: 'Otro',
};

const ROLE_COLORS: Record<StaffRole, string> = {
  director_tecnico: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  director_administrativo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  auxiliar_enfermeria: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  tecnico_enfermeria: 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  cuidador: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  manipulador_alimentos: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  auxiliar_aseo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  otro: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const EMPTY_MEMBER: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'> = {
  run: '',
  name: '',
  role: 'cuidador',
  professionalTitle: '',
  specialization: '',
  phone: '',
  email: '',
  contractType: 'contrata',
  startDate: new Date().toISOString().split('T')[0],
  schedule: { hoursPerWeek: 44, shifts: [] },
  training: [],
  certifications: [],
  active: true,
  notes: '',
};

function calcMinStaff(dependentResidents: number, autovalentResidents: number) {
  const dep = dependentResidents;
  const autov = autovalentResidents;

  const dayCarers = dep <= 8 ? 1 : dep <= 16 ? 2 : dep <= 24 ? 3 : Math.ceil(dep / 8);
  const nightCarers = Math.max(2, dep <= 12 ? 1 : dep <= 24 ? 2 : dep <= 36 ? 3 : Math.ceil(dep / 12));

  const dayCarersAutov = autov > 0 ? Math.ceil(autov / 20) : 0;
  const nightCarersAutov = autov > 0 ? Math.ceil(autov / 20) : 0;

  return {
    dayCarers: dayCarers + dayCarersAutov,
    nightCarers: Math.max(2, nightCarers + nightCarersAutov),
    nursingTech: 1,
  };
}

export default function Staff() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('active');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_MEMBER });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'calculator'>('list');
  const [newTraining, setNewTraining] = useState<Omit<TrainingRecord, 'id'>>({
    courseName: '', hours: 0, completedAt: '', certifiedBy: '', observations: ''
  });
  const [newCert, setNewCert] = useState<Omit<StaffCertification, 'id'>>({
    name: '', issuedBy: '', issuedAt: '', expiresAt: '', documentNumber: ''
  });
  const [calcDep, setCalcDep] = useState(0);
  const [calcAutov, setCalcAutov] = useState(0);

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    try {
      const data = await db.getStaff();
      setStaff(data);
    } finally {
      setLoading(false);
    }
  }

  const filtered = staff.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.run.includes(search) ||
      ROLE_LABELS[m.role].toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' || m.role === filterRole;
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? m.active : !m.active);
    return matchSearch && matchRole && matchActive;
  });

  function openNew() {
    setForm({ ...EMPTY_MEMBER });
    setEditingId(null);
    setShowForm(true);
  }

  function openEdit(m: StaffMember) {
    setForm({
      run: m.run, name: m.name, role: m.role,
      professionalTitle: m.professionalTitle || '',
      specialization: m.specialization || '',
      phone: m.phone, email: m.email || '',
      contractType: m.contractType, startDate: m.startDate,
      endDate: m.endDate,
      schedule: m.schedule,
      training: m.training, certifications: m.certifications,
      active: m.active, notes: m.notes || '',
    });
    setEditingId(m.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (!form.run || !form.name || !form.phone) {
      alert('RUN, nombre y teléfono son obligatorios');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await db.updateStaff(editingId, form);
      } else {
        await db.createStaff(form as Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>);
      }
      await loadStaff();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(m: StaffMember) {
    await db.updateStaff(m.id, { active: !m.active });
    await loadStaff();
  }

  function addTraining() {
    if (!newTraining.courseName || !newTraining.hours) return;
    const t: TrainingRecord = { ...newTraining, id: crypto.randomUUID() };
    setForm(f => ({ ...f, training: [...f.training, t] }));
    setNewTraining({ courseName: '', hours: 0, completedAt: '', certifiedBy: '', observations: '' });
  }

  function addCert() {
    if (!newCert.name || !newCert.issuedBy) return;
    const c: StaffCertification = { ...newCert, id: crypto.randomUUID() };
    setForm(f => ({ ...f, certifications: [...f.certifications, c] }));
    setNewCert({ name: '', issuedBy: '', issuedAt: '', expiresAt: '', documentNumber: '' });
  }

  function removeTraining(id: string) {
    setForm(f => ({ ...f, training: f.training.filter(t => t.id !== id) }));
  }

  function removeCert(id: string) {
    setForm(f => ({ ...f, certifications: f.certifications.filter(c => c.id !== id) }));
  }

  const totalTrainingHours = (m: StaffMember) =>
    m.training.reduce((sum, t) => sum + t.hours, 0);

  const minRequired = calcMinStaff(calcDep, calcAutov);

  const activeStaff = staff.filter(s => s.active);
  const dayCaregivers = activeStaff.filter(s =>
    s.role === 'cuidador' &&
    s.schedule.shifts.some(sh => sh.type === 'mañana' || sh.type === 'tarde')
  ).length;
  const nightCaregivers = activeStaff.filter(s =>
    s.role === 'cuidador' &&
    s.schedule.shifts.some(sh => sh.type === 'noche')
  ).length;

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Personal</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Gestión de personal según Art. 11-21 Decreto N°20
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Trabajador
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(['list', 'calculator'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'list' ? 'Lista de Personal' : 'Calculadora Legal (Art. 15-17)'}
          </button>
        ))}
      </div>

      {activeTab === 'calculator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Parámetros de Cálculo
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  N° de Residentes con Dependencia
                </label>
                <input
                  type="number" min="0"
                  value={calcDep}
                  onChange={e => setCalcDep(Number(e.target.value))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  N° de Residentes Autovalentes
                </label>
                <input
                  type="number" min="0"
                  value={calcAutov}
                  onChange={e => setCalcAutov(Number(e.target.value))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Personal Mínimo Legal Requerido
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Cuidadores Turno Diurno', req: minRequired.dayCarers, actual: dayCaregivers },
                { label: 'Cuidadores Turno Nocturno', req: minRequired.nightCarers, actual: nightCaregivers },
                { label: 'Auxiliar/Técnico Enfermería (diurno)', req: minRequired.nursingTech, actual: activeStaff.filter(s => ['auxiliar_enfermeria', 'tecnico_enfermeria'].includes(s.role)).length },
              ].map(row => (
                <div key={row.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-750">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{row.label}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">Req: <strong>{row.req}</strong></span>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                      row.actual >= row.req
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {row.actual >= row.req ? <CheckCircle className="w-3 h-3 inline mr-1" /> : <AlertTriangle className="w-3 h-3 inline mr-1" />}
                      {row.actual} activos
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              Mínimo absoluto nocturno: 2 cuidadores (Art. 17). Datos de personal activo registrado.
            </p>
          </div>
        </div>
      )}

      {activeTab === 'list' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Personal', value: staff.length, color: 'text-blue-600' },
              { label: 'Activos', value: staff.filter(s => s.active).length, color: 'text-green-600' },
              { label: 'Cuidadores', value: staff.filter(s => s.role === 'cuidador' && s.active).length, color: 'text-orange-600' },
              { label: 'Enf./Aux.', value: staff.filter(s => ['auxiliar_enfermeria', 'tecnico_enfermeria'].includes(s.role) && s.active).length, color: 'text-teal-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, RUN o cargo..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <select
              value={filterRole}
              onChange={e => setFilterRole(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="all">Todos los cargos</option>
              {Object.entries(ROLE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filterActive}
              onChange={e => setFilterActive(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="active">Solo Activos</option>
              <option value="inactive">Solo Inactivos</option>
              <option value="all">Todos</option>
            </select>
          </div>

          {/* List */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            {filtered.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">
                  {staff.length === 0 ? 'No hay personal registrado.' : 'Sin resultados para los filtros aplicados.'}
                </p>
                {staff.length === 0 && (
                  <button onClick={openNew} className="mt-3 text-blue-600 hover:underline text-sm">
                    Agregar primer trabajador
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.map(m => (
                  <div key={m.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        m.active ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                      }`}>
                        {m.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{m.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{m.run}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[m.role]}`}>
                            {ROLE_LABELS[m.role]}
                          </span>
                          {!m.active && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300">
                              Inactivo
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {m.phone && <span className="text-xs text-gray-400 flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</span>}
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />{totalTrainingHours(m)}h capacitación
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleActive(m)}
                        title={m.active ? 'Desactivar' : 'Activar'}
                        className={`p-2 rounded-lg transition-colors ${
                          m.active
                            ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                            : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                        }`}
                      >
                        {m.active ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => openEdit(m)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl my-4">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingId ? 'Editar Trabajador' : 'Nuevo Trabajador'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">RUN *</label>
                  <input
                    value={form.run}
                    onChange={e => setForm(f => ({ ...f, run: e.target.value }))}
                    placeholder="12.345.678-9"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargo *</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as StaffRole }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo Contrato</label>
                  <select
                    value={form.contractType}
                    onChange={e => setForm(f => ({ ...f, contractType: e.target.value as any }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="planta">Planta</option>
                    <option value="contrata">Contrata</option>
                    <option value="honorarios">Honorarios</option>
                    <option value="reemplazo">Reemplazo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono *</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+56 9 1234 5678"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título Profesional</label>
                  <input
                    value={form.professionalTitle}
                    onChange={e => setForm(f => ({ ...f, professionalTitle: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Especialización</label>
                  <input
                    value={form.specialization}
                    onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))}
                    placeholder="Ej: Diplomado en Geriatría"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horas Semanales</label>
                  <input
                    type="number" min="0" max="60"
                    value={form.schedule.hoursPerWeek}
                    onChange={e => setForm(f => ({ ...f, schedule: { ...f.schedule, hoursPerWeek: Number(e.target.value) } }))}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Training */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Capacitaciones (mín. 22 horas/año — Art. 5 p)
                </h3>
                {form.training.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-750 rounded mb-1 text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{t.courseName} — {t.hours}h</span>
                    <button onClick={() => removeTraining(t.id)} className="text-red-500 hover:text-red-700">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <input
                    placeholder="Nombre curso"
                    value={newTraining.courseName}
                    onChange={e => setNewTraining(n => ({ ...n, courseName: e.target.value }))}
                    className="col-span-2 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    type="number" placeholder="Horas"
                    value={newTraining.hours || ''}
                    onChange={e => setNewTraining(n => ({ ...n, hours: Number(e.target.value) }))}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button onClick={addTraining} className="bg-blue-600 text-white rounded px-2 py-1 text-xs hover:bg-blue-700">
                    + Agregar
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Total: {form.training.reduce((s, t) => s + t.hours, 0)}h
                  {form.training.reduce((s, t) => s + t.hours, 0) < 22 && (
                    <span className="text-yellow-600 dark:text-yellow-400 ml-1">⚠ Faltan {22 - form.training.reduce((s, t) => s + t.hours, 0)}h para cumplir el mínimo</span>
                  )}
                </p>
              </div>

              {/* Certifications */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Certificaciones
                </h3>
                {form.certifications.map(c => (
                  <div key={c.id} className="flex items-center justify-between py-1 px-2 bg-gray-50 dark:bg-gray-750 rounded mb-1 text-sm">
                    <span className="text-gray-700 dark:text-gray-300">{c.name} — {c.issuedBy}</span>
                    <button onClick={() => removeCert(c.id)} className="text-red-500 hover:text-red-700">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <input
                    placeholder="Nombre certificación"
                    value={newCert.name}
                    onChange={e => setNewCert(n => ({ ...n, name: e.target.value }))}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <input
                    placeholder="Emitido por"
                    value={newCert.issuedBy}
                    onChange={e => setNewCert(n => ({ ...n, issuedBy: e.target.value }))}
                    className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                  <button onClick={addCert} className="bg-blue-600 text-white rounded px-2 py-1 text-xs hover:bg-blue-700">
                    + Agregar
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observaciones</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Trabajador activo</span>
                </label>
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
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
