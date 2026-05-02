import React, { useState, useEffect } from 'react';
import { Building2, Heart, Target, Star, Award, FileText, Save, Plus, Trash2, Printer } from 'lucide-react';
import { db } from '../services/database';
import { InstitutionalProfile as IProfile, EleamType, InstitutionalSeal } from '../types';

const TABS = ['General', 'Identidad', 'Sellos y Acreditaciones', 'Reglamento Interno'] as const;
type Tab = typeof TABS[number];

const INPUT = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent';
const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

const ELEAM_TYPES: { value: EleamType; label: string }[] = [
  { value: 'residencia_adulto_mayor', label: 'Residencia para el Adulto Mayor' },
  { value: 'hogar_adulto_mayor', label: 'Hogar de Adulto Mayor' },
  { value: 'centro_dia', label: 'Centro de Día' },
  { value: 'otro', label: 'Otro' },
];

const REGIONS = [
  'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo',
  'Valparaíso', 'Metropolitana de Santiago', "O'Higgins", 'Maule',
  'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos',
  'Aysén', 'Magallanes',
];

const empty: Omit<IProfile, 'updatedAt'> = {
  id: 'profile',
  establishmentName: '',
  legalName: '',
  rut: '',
  eleamType: 'residencia_adulto_mayor',
  maxCapacity: 0,
  address: '',
  commune: '',
  region: 'Metropolitana de Santiago',
  phone: '',
  email: '',
  website: '',
  directorName: '',
  directorRun: '',
  directorTitle: '',
  foundingDate: '',
  vision: '',
  mission: '',
  values: [''],
  seals: [],
  internalRegulation: '',
};

export default function InstitutionalProfile() {
  const [tab, setTab] = useState<Tab>('General');
  const [form, setForm] = useState<Omit<IProfile, 'updatedAt'>>(empty);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [newSeal, setNewSeal] = useState<Omit<InstitutionalSeal, 'id'>>({
    name: '', issuedBy: '', issuedAt: '', expiresAt: '', description: '',
  });

  useEffect(() => {
    db.getInstitutionalProfile().then(p => { if (p) setForm(p); });
  }, []);

  const set = (field: keyof Omit<IProfile, 'updatedAt'>, value: unknown) =>
    setForm(f => ({ ...f, [field]: value }));

  const save = async () => {
    setSaving(true);
    try {
      await db.saveInstitutionalProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const addValue = () => set('values', [...form.values, '']);
  const removeValue = (i: number) => set('values', form.values.filter((_, idx) => idx !== i));
  const updateValue = (i: number, v: string) => {
    const arr = [...form.values];
    arr[i] = v;
    set('values', arr);
  };

  const addSeal = () => {
    if (!newSeal.name) return;
    const seal: InstitutionalSeal = { ...newSeal, id: crypto.randomUUID() };
    set('seals', [...form.seals, seal]);
    setNewSeal({ name: '', issuedBy: '', issuedAt: '', expiresAt: '', description: '' });
  };

  const removeSeal = (id: string) => set('seals', form.seals.filter(s => s.id !== id));

  const sealExpiry = (s: InstitutionalSeal) => {
    if (!s.expiresAt) return null;
    const days = Math.ceil((new Date(s.expiresAt).getTime() - Date.now()) / 86400000);
    return days;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Perfil Institucional</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Art. 1-4, 8, 30 Decreto N°20</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-sm">
            <Printer className="w-4 h-4" />Imprimir
          </button>
          <button onClick={save} disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
            <Save className="w-4 h-4" />
            {saved ? '¡Guardado!' : saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t
                ? 'bg-white dark:bg-gray-800 border border-b-white dark:border-gray-700 dark:border-b-gray-800 text-blue-600 dark:text-blue-400 border-b-transparent'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}>
            {t}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
        {tab === 'General' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={LABEL}>Nombre del Establecimiento</label>
                <input className={INPUT} value={form.establishmentName} onChange={e => set('establishmentName', e.target.value)} placeholder="Ej. ELEAM Salto del Ángel" />
              </div>
              <div>
                <label className={LABEL}>Razón Social (Persona Jurídica)</label>
                <input className={INPUT} value={form.legalName} onChange={e => set('legalName', e.target.value)} placeholder="Razón social o nombre legal" />
              </div>
              <div>
                <label className={LABEL}>RUT del Establecimiento</label>
                <input className={INPUT} value={form.rut} onChange={e => set('rut', e.target.value)} placeholder="12.345.678-9" />
              </div>
              <div>
                <label className={LABEL}>Tipo de ELEAM (Art. 2)</label>
                <select className={INPUT} value={form.eleamType} onChange={e => set('eleamType', e.target.value as EleamType)}>
                  {ELEAM_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Capacidad Máxima Autorizada (Art. 8)</label>
                <input type="number" className={INPUT} value={form.maxCapacity} onChange={e => set('maxCapacity', Number(e.target.value))} min={0} />
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Información de Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className={LABEL}>Dirección</label>
                <input className={INPUT} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Calle, número, villa" />
              </div>
              <div>
                <label className={LABEL}>Comuna</label>
                <input className={INPUT} value={form.commune} onChange={e => set('commune', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>Región</label>
                <select className={INPUT} value={form.region} onChange={e => set('region', e.target.value)}>
                  {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className={LABEL}>Teléfono</label>
                <input className={INPUT} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+56 9 1234 5678" />
              </div>
              <div>
                <label className={LABEL}>Correo Electrónico</label>
                <input type="email" className={INPUT} value={form.email} onChange={e => set('email', e.target.value)} placeholder="contacto@eleam.cl" />
              </div>
              <div>
                <label className={LABEL}>Sitio Web (opcional)</label>
                <input className={INPUT} value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="www.eleam.cl" />
              </div>
              <div>
                <label className={LABEL}>Fecha de Fundación</label>
                <input type="date" className={INPUT} value={form.foundingDate || ''} onChange={e => set('foundingDate', e.target.value)} />
              </div>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Director Técnico (Art. 11)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={LABEL}>Nombre completo</label>
                <input className={INPUT} value={form.directorName} onChange={e => set('directorName', e.target.value)} />
              </div>
              <div>
                <label className={LABEL}>RUN</label>
                <input className={INPUT} value={form.directorRun} onChange={e => set('directorRun', e.target.value)} placeholder="12.345.678-9" />
              </div>
              <div>
                <label className={LABEL}>Título profesional</label>
                <input className={INPUT} value={form.directorTitle} onChange={e => set('directorTitle', e.target.value)} placeholder="Ej. Enfermera/o, Médico" />
              </div>
            </div>
          </div>
        )}

        {tab === 'Identidad' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg text-sm">
              <Target className="w-4 h-4 shrink-0" />
              La visión y misión definen la identidad del establecimiento y deben estar visibles para residentes, familias y personal (Art. 30).
            </div>

            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" />Visión</span>
              </label>
              <textarea rows={4} className={INPUT} value={form.vision}
                onChange={e => set('vision', e.target.value)}
                placeholder="¿Cómo queremos ser reconocidos en el futuro? ¿Qué aspiramos a lograr?" />
            </div>

            <div>
              <label className={LABEL}>
                <span className="flex items-center gap-2"><Heart className="w-4 h-4 text-red-500" />Misión</span>
              </label>
              <textarea rows={4} className={INPUT} value={form.mission}
                onChange={e => set('mission', e.target.value)}
                placeholder="¿Por qué existimos? ¿Qué hacemos y para quién lo hacemos?" />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={LABEL}>
                  <span className="flex items-center gap-2"><Star className="w-4 h-4 text-yellow-500" />Valores Institucionales</span>
                </label>
                <button onClick={addValue} className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline">
                  <Plus className="w-3.5 h-3.5" />Agregar valor
                </button>
              </div>
              <div className="space-y-2">
                {form.values.map((v, i) => (
                  <div key={i} className="flex gap-2">
                    <input className={INPUT} value={v} onChange={e => updateValue(i, e.target.value)}
                      placeholder={`Valor ${i + 1}, ej. Dignidad, Respeto, Calidad`} />
                    <button onClick={() => removeValue(i)} className="p-2 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'Sellos y Acreditaciones' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg text-sm">
              <Award className="w-4 h-4 shrink-0" />
              Registre aquí sellos de calidad, acreditaciones SENAMA, certificaciones ISO y cualquier otro reconocimiento institucional.
            </div>

            {/* Add seal form */}
            <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white text-sm">Agregar sello o acreditación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Nombre del sello / certificación</label>
                  <input className={INPUT} value={newSeal.name} onChange={e => setNewSeal(s => ({ ...s, name: e.target.value }))} placeholder="Ej. Sello SENAMA, ISO 9001" />
                </div>
                <div>
                  <label className={LABEL}>Otorgado por</label>
                  <input className={INPUT} value={newSeal.issuedBy} onChange={e => setNewSeal(s => ({ ...s, issuedBy: e.target.value }))} placeholder="Organismo o institución" />
                </div>
                <div>
                  <label className={LABEL}>Fecha de emisión</label>
                  <input type="date" className={INPUT} value={newSeal.issuedAt} onChange={e => setNewSeal(s => ({ ...s, issuedAt: e.target.value }))} />
                </div>
                <div>
                  <label className={LABEL}>Fecha de vencimiento (si aplica)</label>
                  <input type="date" className={INPUT} value={newSeal.expiresAt || ''} onChange={e => setNewSeal(s => ({ ...s, expiresAt: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL}>Descripción</label>
                  <input className={INPUT} value={newSeal.description} onChange={e => setNewSeal(s => ({ ...s, description: e.target.value }))} placeholder="Descripción o alcance de la certificación" />
                </div>
              </div>
              <button onClick={addSeal} disabled={!newSeal.name}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg disabled:opacity-50">
                <Plus className="w-4 h-4" />Agregar
              </button>
            </div>

            {/* Seals list */}
            {form.seals.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No hay sellos registrados</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {form.seals.map(seal => {
                  const days = sealExpiry(seal);
                  return (
                    <div key={seal.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex gap-3">
                      <Award className="w-8 h-8 text-yellow-500 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{seal.name}</p>
                          <button onClick={() => removeSeal(seal.id)} className="text-red-400 hover:text-red-600 ml-2">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{seal.issuedBy}</p>
                        {seal.description && <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{seal.description}</p>}
                        <div className="flex flex-wrap gap-2 mt-2">
                          {seal.issuedAt && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                              Emitido: {new Date(seal.issuedAt).toLocaleDateString('es-CL')}
                            </span>
                          )}
                          {days !== null && (
                            <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                              days < 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                              days <= 30 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                              'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            }`}>
                              {days < 0 ? `Vencido hace ${Math.abs(days)} días` : `Vence en ${days} días`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'Reglamento Interno' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg text-sm">
              <FileText className="w-4 h-4 shrink-0" />
              El reglamento interno debe estar disponible para residentes y familias (Art. 30). Puede adjuntarlo o redactarlo directamente aquí.
            </div>
            <label className={LABEL}>Contenido del Reglamento Interno (Art. 30)</label>
            <textarea rows={20} className={INPUT} value={form.internalRegulation || ''}
              onChange={e => set('internalRegulation', e.target.value)}
              placeholder="Redacte aquí el reglamento interno del establecimiento:

1. Normas de convivencia
2. Derechos y deberes de los residentes
3. Derechos y deberes de las familias
4. Protocolo de visitas
5. Manejo de pertenencias
6. Normas de seguridad
7. Procedimiento de reclamos y sugerencias
8. ..." />
          </div>
        )}
      </div>
    </div>
  );
}
