import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Heart, User, Activity, Brain, Pill, FileText,
  Plus, Trash2, AlertTriangle, CheckCircle, Printer
} from 'lucide-react';
import { db } from '../services/database';
import { useApp } from '../contexts/AppContext';
import {
  Resident, MedicalRecord, Medication, KatzEvaluation,
  BarthelEvaluation, PfeifferEvaluation, VitalSign,
  NutritionalAssessment, MedicalHistory, PhysicalExam, LabResult
} from '../types';

const INPUT = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500';
const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export default function MedicalRecordDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadResidents } = useApp();
  const [resident, setResident] = useState<Resident | null>(null);
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [medications, setMedications] = useState<Medication[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);

  const [katz, setKatz] = useState<KatzEvaluation>({
    bathing: 0, dressing: 0, toileting: 0, transferring: 0, continence: 0, feeding: 0,
    total: 0, interpretation: 'dependencia_severa',
    evaluatedAt: new Date().toISOString().split('T')[0], evaluatedBy: '', observations: ''
  });

  const [barthel, setBarthel] = useState<BarthelEvaluation>({
    feeding: 0, bathing: 0, grooming: 0, dressing: 0, bowels: 0,
    bladder: 0, toilet: 0, transfers: 0, mobility: 0, stairs: 0,
    total: 0, interpretation: 'dependencia_total',
    evaluatedAt: new Date().toISOString().split('T')[0], evaluatedBy: '', observations: ''
  });

  const [pfeiffer, setPfeiffer] = useState<PfeifferEvaluation>({
    questions: {
      date: 0, dayOfWeek: 0, place: 0, phoneNumber: 0, age: 0,
      birthDate: 0, currentPresident: 0, previousPresident: 0, mothersMaidenName: 0, subtraction: 0
    },
    errors: 0, deteriorationLevel: 'normal',
    evaluatedAt: new Date().toISOString().split('T')[0], evaluatedBy: '', observations: ''
  });

  const [nutrition, setNutrition] = useState<NutritionalAssessment>({
    swallowingDiagnosis: '', recommendedConsistency: 'normal', feedingType: 'oral',
    nutritionistComments: '', dietaryRestrictions: [], supplements: [],
    updatedAt: new Date().toISOString(), updatedBy: ''
  });

  const [history, setHistory] = useState<MedicalHistory>({
    personalHistory: '', familyHistory: '', surgicalHistory: '',
    currentMedications: '', hospitalizations: '', chronicDiseases: [],
    updatedAt: new Date().toISOString()
  });

  const [physical, setPhysical] = useState<PhysicalExam>({
    generalAppearance: '', cardiovascular: '', respiratory: '', neurological: '',
    musculoskeletal: '', skin: '', observations: '', examinedBy: '',
    examDate: new Date().toISOString().split('T')[0]
  });

  const [labs, setLabs] = useState<LabResult[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const r = await db.getResident(id);
        if (!r) { navigate('/medical-records'); return; }
        setResident(r);
        const rec = await db.getMedicalRecord(id);
        if (rec) {
          setMedicalRecord(rec);
          setMedications(rec.medications || []);
          setAllergies(rec.allergies || []);
          setVitalSigns(rec.vitalSigns || []);
          if (rec.evaluations?.katz) setKatz(rec.evaluations.katz);
          if (rec.evaluations?.barthel) setBarthel(rec.evaluations.barthel);
          if (rec.evaluations?.pfeiffer) setPfeiffer(rec.evaluations.pfeiffer);
          if (rec.nutritionalAssessment) setNutrition(rec.nutritionalAssessment);
          if (rec.medicalHistory) setHistory(rec.medicalHistory);
          if (rec.physicalExam) setPhysical(rec.physicalExam);
          if (rec.labResults) setLabs(rec.labResults);
        }
      } finally { setLoading(false); }
    };
    load();
  }, [id]);

  // ── Katz ──
  const updateKatz = (field: string, val: number) => {
    const up = { ...katz, [field]: val };
    const total = up.bathing + up.dressing + up.toileting + up.transferring + up.continence + up.feeding;
    const interpretation = total === 6 ? 'independiente' : total >= 4 ? 'dependencia_leve' : total >= 2 ? 'dependencia_moderada' : 'dependencia_severa';
    setKatz({ ...up, total, interpretation: interpretation as KatzEvaluation['interpretation'] });
  };

  // ── Barthel ──
  const updateBarthel = (field: string, val: number) => {
    const up = { ...barthel, [field]: val };
    const total = up.feeding + up.bathing + up.grooming + up.dressing + up.bowels + up.bladder + up.toilet + up.transfers + up.mobility + up.stairs;
    const interpretation = total >= 90 ? 'independiente' : total >= 60 ? 'dependencia_leve' : total >= 40 ? 'dependencia_moderada' : total >= 20 ? 'dependencia_severa' : 'dependencia_total';
    setBarthel({ ...up, total, interpretation: interpretation as BarthelEvaluation['interpretation'] });
  };

  // ── Pfeiffer ──
  const updatePfeiffer = (field: string, val: number) => {
    const q = { ...pfeiffer.questions, [field]: val };
    const errors = Object.values(q).reduce((s, v) => s + v, 0);
    const deteriorationLevel = errors <= 2 ? 'normal' : errors <= 4 ? 'leve' : errors <= 7 ? 'moderado' : 'severo';
    setPfeiffer({ ...pfeiffer, questions: q, errors, deteriorationLevel: deteriorationLevel as PfeifferEvaluation['deteriorationLevel'] });
  };

  const handleSave = async () => {
    if (!resident) return;
    setSaving(true);
    try {
      const record: MedicalRecord = {
        id: medicalRecord?.id || crypto.randomUUID(),
        residentId: resident.id,
        medications, allergies,
        evaluations: { katz, barthel, pfeiffer },
        vitalSigns, nutritionalAssessment: nutrition,
        medicalHistory: history, physicalExam: physical,
        labResults: labs, updatedAt: new Date().toISOString()
      };
      await db.createOrUpdateMedicalRecord(record);
      await loadResidents();
      navigate('/medical-records');
    } catch (e) {
      alert('Error al guardar la ficha clínica');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600" /></div>;
  if (!resident) return <div className="text-center py-12 text-gray-500">Residente no encontrado</div>;

  const tabs = [
    { id: 'general', name: 'General', icon: User },
    { id: 'evaluations', name: 'Evaluaciones', icon: Brain },
    { id: 'medications', name: 'Medicamentos', icon: Pill },
    { id: 'vitals', name: 'Signos Vitales', icon: Activity },
    { id: 'nutrition', name: 'Nutrición', icon: Heart },
    { id: 'history', name: 'Historia Clínica', icon: FileText },
    { id: 'physical', name: 'Examen Físico', icon: Activity },
    { id: 'labs', name: 'Laboratorio', icon: FileText },
  ];

  const interpColor = (i: string) =>
    i === 'independiente' || i === 'normal' ? 'text-green-600' :
    i === 'dependencia_leve' || i === 'leve' ? 'text-yellow-600' :
    i === 'dependencia_moderada' || i === 'moderado' ? 'text-orange-600' : 'text-red-600';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/medical-records')} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Ficha Clínica</h1>
            <p className="text-gray-600 dark:text-gray-400">{resident.name} — RUN: {resident.run}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <Printer className="w-4 h-4 mr-2" />Imprimir
          </button>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors">
            {saving ? <><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />Guardando...</> : <><Save className="w-5 h-5 mr-3" />Guardar Ficha</>}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <nav className="flex space-x-1 px-4 min-w-max">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-3 border-b-2 font-medium text-sm flex items-center gap-1.5 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-red-500 text-red-600 dark:text-red-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                <tab.icon className="w-4 h-4" />{tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">

          {/* ── GENERAL ── */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Datos del Residente</p>
                  <p className="text-gray-900 dark:text-white"><span className="font-medium">Edad:</span> {resident.age} años</p>
                  <p className="text-gray-900 dark:text-white"><span className="font-medium">Género:</span> {resident.gender}</p>
                  <p className="text-gray-900 dark:text-white"><span className="font-medium">Ingreso:</span> {new Date(resident.admissionDate).toLocaleDateString('es-CL')}</p>
                  <p className="text-gray-900 dark:text-white"><span className="font-medium">Diagnóstico:</span> {resident.clinicalDiagnosis || '—'}</p>
                </div>
                <div>
                  <label className={LABEL}>Alergias Conocidas</label>
                  <textarea value={allergies.join('\n')} onChange={e => setAllergies(e.target.value.split('\n').filter(a => a.trim()))}
                    rows={5} className={INPUT} placeholder="Una alergia por línea..." />
                </div>
              </div>
              <div>
                <label className={LABEL}>Estado Funcional</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {resident.functionalStatus.map((s, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── EVALUACIONES ── */}
          {activeTab === 'evaluations' && (
            <div className="space-y-8">
              {/* KATZ */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Índice de Katz (ABVD)</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className={LABEL}>Evaluado por</label><input type="text" value={katz.evaluatedBy} onChange={e => setKatz({...katz, evaluatedBy: e.target.value})} className={INPUT} /></div>
                  <div><label className={LABEL}>Fecha</label><input type="date" value={katz.evaluatedAt} onChange={e => setKatz({...katz, evaluatedAt: e.target.value})} className={INPUT} /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {[['bathing','Bañarse'],['dressing','Vestirse'],['toileting','Usar el baño'],['transferring','Movilidad'],['continence','Continencia'],['feeding','Alimentarse']].map(([k,l]) => (
                    <div key={k}>
                      <label className={LABEL}>{l}</label>
                      <select value={(katz as any)[k]} onChange={e => updateKatz(k, +e.target.value)} className={INPUT}>
                        <option value={0}>Dependiente (0)</option>
                        <option value={1}>Independiente (1)</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Puntuación: {katz.total}/6</p>
                    <p className={`text-sm font-medium capitalize ${interpColor(katz.interpretation)}`}>{katz.interpretation.replace(/_/g,' ')}</p>
                  </div>
                  {katz.interpretation === 'independiente' ? <CheckCircle className="w-8 h-8 text-green-500" /> : <AlertTriangle className="w-8 h-8 text-red-500" />}
                </div>
                <div className="mt-3"><label className={LABEL}>Observaciones</label><textarea value={katz.observations||''} onChange={e => setKatz({...katz, observations: e.target.value})} rows={2} className={INPUT} /></div>
              </div>

              {/* BARTHEL */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Índice de Barthel</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className={LABEL}>Evaluado por</label><input type="text" value={barthel.evaluatedBy} onChange={e => setBarthel({...barthel, evaluatedBy: e.target.value})} className={INPUT} /></div>
                  <div><label className={LABEL}>Fecha</label><input type="date" value={barthel.evaluatedAt} onChange={e => setBarthel({...barthel, evaluatedAt: e.target.value})} className={INPUT} /></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                  {[
                    {k:'feeding',l:'Alimentación',opts:[[0,'Incapaz'],[5,'Necesita ayuda'],[10,'Independiente']]},
                    {k:'bathing',l:'Baño',opts:[[0,'Dependiente'],[5,'Independiente']]},
                    {k:'grooming',l:'Aseo personal',opts:[[0,'Dependiente'],[5,'Independiente']]},
                    {k:'dressing',l:'Vestido',opts:[[0,'Dependiente'],[5,'Necesita ayuda'],[10,'Independiente']]},
                    {k:'bowels',l:'Deposiciones',opts:[[0,'Incontinente'],[5,'Accidente ocasional'],[10,'Continente']]},
                    {k:'bladder',l:'Vejiga',opts:[[0,'Incontinente'],[5,'Accidente ocasional'],[10,'Continente']]},
                    {k:'toilet',l:'Uso del retrete',opts:[[0,'Dependiente'],[5,'Necesita ayuda'],[10,'Independiente']]},
                    {k:'transfers',l:'Traslados',opts:[[0,'Imposible'],[5,'Gran ayuda'],[10,'Mínima ayuda'],[15,'Independiente']]},
                    {k:'mobility',l:'Deambulación',opts:[[0,'Inmóvil'],[5,'Silla de ruedas'],[10,'Camina con ayuda'],[15,'Independiente']]},
                    {k:'stairs',l:'Escaleras',opts:[[0,'Imposible'],[5,'Necesita ayuda'],[10,'Independiente']]},
                  ].map(({k,l,opts}) => (
                    <div key={k}>
                      <label className={LABEL}>{l}</label>
                      <select value={(barthel as any)[k]} onChange={e => updateBarthel(k, +e.target.value)} className={INPUT}>
                        {opts.map(([v, t]) => <option key={v} value={v}>{t} ({v})</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Puntuación: {barthel.total}/100</p>
                    <p className={`text-sm font-medium capitalize ${interpColor(barthel.interpretation)}`}>{barthel.interpretation.replace(/_/g,' ')}</p>
                  </div>
                  {barthel.total >= 90 ? <CheckCircle className="w-8 h-8 text-green-500" /> : <AlertTriangle className="w-8 h-8 text-red-500" />}
                </div>
                <div className="mt-3"><label className={LABEL}>Observaciones</label><textarea value={barthel.observations||''} onChange={e => setBarthel({...barthel, observations: e.target.value})} rows={2} className={INPUT} /></div>
              </div>

              {/* PFEIFFER */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Test de Pfeiffer (SPMSQ)</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className={LABEL}>Evaluado por</label><input type="text" value={pfeiffer.evaluatedBy} onChange={e => setPfeiffer({...pfeiffer, evaluatedBy: e.target.value})} className={INPUT} /></div>
                  <div><label className={LABEL}>Fecha</label><input type="date" value={pfeiffer.evaluatedAt} onChange={e => setPfeiffer({...pfeiffer, evaluatedAt: e.target.value})} className={INPUT} /></div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Marque incorrecto (1) o correcto (0) para cada pregunta:</p>
                <div className="space-y-2 mb-4">
                  {[
                    ['date','¿Qué fecha es hoy (día, mes, año)?'],
                    ['dayOfWeek','¿Qué día de la semana es hoy?'],
                    ['place','¿Dónde estamos ahora?'],
                    ['phoneNumber','¿Cuál es su número de teléfono (o dirección)?'],
                    ['age','¿Cuántos años tiene?'],
                    ['birthDate','¿Cuándo nació?'],
                    ['currentPresident','¿Quién es el Presidente de Chile?'],
                    ['previousPresident','¿Quién fue el Presidente anterior?'],
                    ['mothersMaidenName','¿Cuál es el primer apellido de su mamá?'],
                    ['subtraction','Reste de 3 en 3 desde 20'],
                  ].map(([k,l]) => (
                    <div key={k} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-600">
                      <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{l}</span>
                      <div className="flex gap-3 ml-4">
                        {[['0','Correcto'],['1','Incorrecto']].map(([v,t]) => (
                          <label key={v} className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" name={k} value={v} checked={(pfeiffer.questions as any)[k] === +v} onChange={() => updatePfeiffer(k, +v)} className="text-red-500" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{t}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">Errores: {pfeiffer.errors}/10</p>
                    <p className={`text-sm font-medium capitalize ${interpColor(pfeiffer.deteriorationLevel)}`}>Deterioro {pfeiffer.deteriorationLevel}</p>
                  </div>
                  {pfeiffer.errors <= 2 ? <CheckCircle className="w-8 h-8 text-green-500" /> : <AlertTriangle className="w-8 h-8 text-red-500" />}
                </div>
                <div className="mt-3"><label className={LABEL}>Observaciones</label><textarea value={pfeiffer.observations||''} onChange={e => setPfeiffer({...pfeiffer, observations: e.target.value})} rows={2} className={INPUT} /></div>
              </div>
            </div>
          )}

          {/* ── MEDICAMENTOS ── */}
          {activeTab === 'medications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Medicamentos Actuales</h3>
                <button onClick={() => setMedications([...medications, { id: crypto.randomUUID(), name: '', dose: '', frequency: '', schedule: '', indication: '', prescribedBy: '', startDate: new Date().toISOString().split('T')[0], active: true }])}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                  <Plus className="w-4 h-4 mr-1" />Agregar
                </button>
              </div>
              {medications.length === 0 ? (
                <div className="text-center py-10 text-gray-400"><Pill className="w-12 h-12 mx-auto mb-2" /><p>Sin medicamentos registrados</p></div>
              ) : (
                <div className="space-y-3">
                  {medications.map(med => (
                    <div key={med.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div><label className={LABEL}>Nombre</label><input className={INPUT} value={med.name} onChange={e => setMedications(medications.map(m => m.id===med.id ? {...m,name:e.target.value}:m))} /></div>
                        <div><label className={LABEL}>Dosis</label><input className={INPUT} value={med.dose} onChange={e => setMedications(medications.map(m => m.id===med.id ? {...m,dose:e.target.value}:m))} /></div>
                        <div><label className={LABEL}>Frecuencia</label><input className={INPUT} value={med.frequency} onChange={e => setMedications(medications.map(m => m.id===med.id ? {...m,frequency:e.target.value}:m))} /></div>
                        <div><label className={LABEL}>Horario</label><input className={INPUT} value={med.schedule} onChange={e => setMedications(medications.map(m => m.id===med.id ? {...m,schedule:e.target.value}:m))} /></div>
                        <div><label className={LABEL}>Indicación</label><input className={INPUT} value={med.indication} onChange={e => setMedications(medications.map(m => m.id===med.id ? {...m,indication:e.target.value}:m))} /></div>
                        <div><label className={LABEL}>Prescrito por</label><input className={INPUT} value={med.prescribedBy} onChange={e => setMedications(medications.map(m => m.id===med.id ? {...m,prescribedBy:e.target.value}:m))} /></div>
                        <div><label className={LABEL}>Inicio</label><input type="date" className={INPUT} value={med.startDate} onChange={e => setMedications(medications.map(m => m.id===med.id ? {...m,startDate:e.target.value}:m))} /></div>
                        <div><label className={LABEL}>Término</label><input type="date" className={INPUT} value={med.endDate||''} onChange={e => setMedications(medications.map(m => m.id===med.id ? {...m,endDate:e.target.value}:m))} /></div>
                        <div className="flex items-end gap-2">
                          <label className="flex items-center gap-2 cursor-pointer mt-5">
                            <input type="checkbox" checked={med.active} onChange={e => setMedications(medications.map(m => m.id===med.id ? {...m,active:e.target.checked}:m))} className="rounded" />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Activo</span>
                          </label>
                          <button onClick={() => setMedications(medications.filter(m => m.id!==med.id))} className="ml-auto mt-5 p-2 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SIGNOS VITALES ── */}
          {activeTab === 'vitals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Signos Vitales</h3>
                <button onClick={() => setVitalSigns([...vitalSigns, { id: crypto.randomUUID(), date: new Date().toISOString().split('T')[0], time: new Date().toTimeString().slice(0,5), recordedBy: '' }])}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                  <Plus className="w-4 h-4 mr-1" />Agregar Registro
                </button>
              </div>
              {vitalSigns.length === 0 ? (
                <div className="text-center py-10 text-gray-400"><Activity className="w-12 h-12 mx-auto mb-2" /><p>Sin registros de signos vitales</p></div>
              ) : (
                <div className="space-y-3">
                  {vitalSigns.map(vs => (
                    <div key={vs.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div><label className={LABEL}>Fecha</label><input type="date" className={INPUT} value={vs.date} onChange={e => setVitalSigns(vitalSigns.map(v => v.id===vs.id ? {...v,date:e.target.value}:v))} /></div>
                        <div><label className={LABEL}>Hora</label><input type="time" className={INPUT} value={vs.time} onChange={e => setVitalSigns(vitalSigns.map(v => v.id===vs.id ? {...v,time:e.target.value}:v))} /></div>
                        <div><label className={LABEL}>Temp (°C)</label><input type="number" step="0.1" className={INPUT} value={vs.temperature||''} onChange={e => setVitalSigns(vitalSigns.map(v => v.id===vs.id ? {...v,temperature:+e.target.value}:v))} /></div>
                        <div><label className={LABEL}>Presión Arterial</label><input className={INPUT} placeholder="120/80" value={vs.bloodPressure||''} onChange={e => setVitalSigns(vitalSigns.map(v => v.id===vs.id ? {...v,bloodPressure:e.target.value}:v))} /></div>
                        <div><label className={LABEL}>Pulso (lpm)</label><input type="number" className={INPUT} value={vs.pulse||''} onChange={e => setVitalSigns(vitalSigns.map(v => v.id===vs.id ? {...v,pulse:+e.target.value}:v))} /></div>
                        <div><label className={LABEL}>Glicemia (mg/dL)</label><input type="number" className={INPUT} value={vs.glucose||''} onChange={e => setVitalSigns(vitalSigns.map(v => v.id===vs.id ? {...v,glucose:+e.target.value}:v))} /></div>
                        <div><label className={LABEL}>SpO2 (%)</label><input type="number" className={INPUT} value={vs.oxygenSaturation||''} onChange={e => setVitalSigns(vitalSigns.map(v => v.id===vs.id ? {...v,oxygenSaturation:+e.target.value}:v))} /></div>
                        <div><label className={LABEL}>Peso (kg)</label><input type="number" step="0.1" className={INPUT} value={vs.weight||''} onChange={e => setVitalSigns(vitalSigns.map(v => v.id===vs.id ? {...v,weight:+e.target.value}:v))} /></div>
                        <div><label className={LABEL}>Registrado por</label><input className={INPUT} value={vs.recordedBy} onChange={e => setVitalSigns(vitalSigns.map(v => v.id===vs.id ? {...v,recordedBy:e.target.value}:v))} /></div>
                        <div className="md:col-span-2"><label className={LABEL}>Observaciones</label><input className={INPUT} value={vs.observations||''} onChange={e => setVitalSigns(vitalSigns.map(v => v.id===vs.id ? {...v,observations:e.target.value}:v))} /></div>
                        <div className="flex items-end"><button onClick={() => setVitalSigns(vitalSigns.filter(v => v.id!==vs.id))} className="p-2 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NUTRICIÓN ── */}
          {activeTab === 'nutrition' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Evaluación Nutricional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Diagnóstico de Deglución</label>
                  <textarea rows={3} className={INPUT} value={nutrition.swallowingDiagnosis} onChange={e => setNutrition({...nutrition, swallowingDiagnosis: e.target.value})} />
                </div>
                <div>
                  <label className={LABEL}>Consistencia Recomendada</label>
                  <select className={INPUT} value={nutrition.recommendedConsistency} onChange={e => setNutrition({...nutrition, recommendedConsistency: e.target.value as any})}>
                    <option value="normal">Normal</option>
                    <option value="papilla">Papilla</option>
                    <option value="licuado">Licuado</option>
                    <option value="espesado">Espesado</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Tipo de Alimentación</label>
                  <select className={INPUT} value={nutrition.feedingType} onChange={e => setNutrition({...nutrition, feedingType: e.target.value as any})}>
                    <option value="oral">Oral</option>
                    <option value="sonda">Sonda</option>
                    <option value="mixta">Mixta</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Nutricionista (responsable)</label>
                  <input className={INPUT} value={nutrition.updatedBy} onChange={e => setNutrition({...nutrition, updatedBy: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <label className={LABEL}>Comentarios del Nutricionista</label>
                  <textarea rows={3} className={INPUT} value={nutrition.nutritionistComments} onChange={e => setNutrition({...nutrition, nutritionistComments: e.target.value})} />
                </div>
                <div>
                  <label className={LABEL}>Restricciones Dietarias (una por línea)</label>
                  <textarea rows={3} className={INPUT} value={nutrition.dietaryRestrictions.join('\n')} onChange={e => setNutrition({...nutrition, dietaryRestrictions: e.target.value.split('\n').filter(s=>s.trim())})} />
                </div>
                <div>
                  <label className={LABEL}>Suplementos (uno por línea)</label>
                  <textarea rows={3} className={INPUT} value={nutrition.supplements.join('\n')} onChange={e => setNutrition({...nutrition, supplements: e.target.value.split('\n').filter(s=>s.trim())})} />
                </div>
              </div>
            </div>
          )}

          {/* ── HISTORIA CLÍNICA ── */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Historia Clínica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={LABEL}>Antecedentes Personales</label><textarea rows={4} className={INPUT} value={history.personalHistory} onChange={e => setHistory({...history, personalHistory: e.target.value})} /></div>
                <div><label className={LABEL}>Antecedentes Familiares</label><textarea rows={4} className={INPUT} value={history.familyHistory} onChange={e => setHistory({...history, familyHistory: e.target.value})} /></div>
                <div><label className={LABEL}>Antecedentes Quirúrgicos</label><textarea rows={4} className={INPUT} value={history.surgicalHistory} onChange={e => setHistory({...history, surgicalHistory: e.target.value})} /></div>
                <div><label className={LABEL}>Hospitalizaciones Previas</label><textarea rows={4} className={INPUT} value={history.hospitalizations} onChange={e => setHistory({...history, hospitalizations: e.target.value})} /></div>
                <div className="md:col-span-2"><label className={LABEL}>Enfermedades Crónicas (una por línea)</label><textarea rows={3} className={INPUT} value={history.chronicDiseases.join('\n')} onChange={e => setHistory({...history, chronicDiseases: e.target.value.split('\n').filter(s=>s.trim())})} /></div>
                <div className="md:col-span-2"><label className={LABEL}>Medicamentos Habituales</label><textarea rows={3} className={INPUT} value={history.currentMedications} onChange={e => setHistory({...history, currentMedications: e.target.value})} /></div>
              </div>
            </div>
          )}

          {/* ── EXAMEN FÍSICO ── */}
          {activeTab === 'physical' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Examen Físico</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><label className={LABEL}>Examinado por</label><input className={INPUT} value={physical.examinedBy} onChange={e => setPhysical({...physical, examinedBy: e.target.value})} /></div>
                <div><label className={LABEL}>Fecha del Examen</label><input type="date" className={INPUT} value={physical.examDate} onChange={e => setPhysical({...physical, examDate: e.target.value})} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ['generalAppearance','Apariencia General'],
                  ['cardiovascular','Sistema Cardiovascular'],
                  ['respiratory','Sistema Respiratorio'],
                  ['neurological','Sistema Neurológico'],
                  ['musculoskeletal','Sistema Musculoesquelético'],
                  ['skin','Piel y Tegumentos'],
                ].map(([k,l]) => (
                  <div key={k}>
                    <label className={LABEL}>{l}</label>
                    <textarea rows={2} className={INPUT} value={(physical as any)[k]} onChange={e => setPhysical({...physical, [k]: e.target.value})} />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <label className={LABEL}>Observaciones Generales</label>
                  <textarea rows={3} className={INPUT} value={physical.observations} onChange={e => setPhysical({...physical, observations: e.target.value})} />
                </div>
              </div>
            </div>
          )}

          {/* ── LABORATORIO ── */}
          {activeTab === 'labs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Resultados de Laboratorio</h3>
                <button onClick={() => setLabs([...labs, { id: crypto.randomUUID(), testName: '', result: '', normalRange: '', date: new Date().toISOString().split('T')[0], orderedBy: '' }])}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium">
                  <Plus className="w-4 h-4 mr-1" />Agregar Examen
                </button>
              </div>
              {labs.length === 0 ? (
                <div className="text-center py-10 text-gray-400"><FileText className="w-12 h-12 mx-auto mb-2" /><p>Sin resultados de laboratorio</p></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                      <th className="pb-2 font-medium text-gray-500">Examen</th>
                      <th className="pb-2 font-medium text-gray-500">Resultado</th>
                      <th className="pb-2 font-medium text-gray-500">Rango Normal</th>
                      <th className="pb-2 font-medium text-gray-500">Fecha</th>
                      <th className="pb-2 font-medium text-gray-500">Solicitado por</th>
                      <th className="pb-2 font-medium text-gray-500">Notas</th>
                      <th></th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {labs.map(lab => (
                        <tr key={lab.id}>
                          <td className="py-2 pr-2"><input className={INPUT} value={lab.testName} onChange={e => setLabs(labs.map(l => l.id===lab.id ? {...l,testName:e.target.value}:l))} /></td>
                          <td className="py-2 pr-2"><input className={INPUT} value={lab.result} onChange={e => setLabs(labs.map(l => l.id===lab.id ? {...l,result:e.target.value}:l))} /></td>
                          <td className="py-2 pr-2"><input className={INPUT} value={lab.normalRange} onChange={e => setLabs(labs.map(l => l.id===lab.id ? {...l,normalRange:e.target.value}:l))} /></td>
                          <td className="py-2 pr-2"><input type="date" className={INPUT} value={lab.date} onChange={e => setLabs(labs.map(l => l.id===lab.id ? {...l,date:e.target.value}:l))} /></td>
                          <td className="py-2 pr-2"><input className={INPUT} value={lab.orderedBy} onChange={e => setLabs(labs.map(l => l.id===lab.id ? {...l,orderedBy:e.target.value}:l))} /></td>
                          <td className="py-2 pr-2"><input className={INPUT} value={lab.notes||''} onChange={e => setLabs(labs.map(l => l.id===lab.id ? {...l,notes:e.target.value}:l))} /></td>
                          <td className="py-2"><button onClick={() => setLabs(labs.filter(l => l.id!==lab.id))} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
