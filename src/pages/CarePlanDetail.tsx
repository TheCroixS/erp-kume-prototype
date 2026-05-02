import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  FileText, 
  User, 
  Plus, 
  Trash2, 
  Edit,
  CheckCircle,
  Clock,
  Target,
  Users,
  Calendar,
  PenTool
} from 'lucide-react';
import { db } from '../services/database';
import { useApp } from '../contexts/AppContext';
import { Resident, CarePlan, CareObjective } from '../types';
import DigitalSignature from '../components/DigitalSignature';

export default function CarePlanDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadResidents } = useApp();
  const [resident, setResident] = useState<Resident | null>(null);
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState<'resident' | 'director' | null>(null);

  // Form states
  const [generalDiagnosis, setGeneralDiagnosis] = useState({
    biomedical: '',
    functional: '',
    mental: '',
    social: ''
  });
  const [objectives, setObjectives] = useState<CareObjective[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const residentData = await db.getResident(id);
        if (!residentData) {
          navigate('/residents');
          return;
        }
        
        setResident(residentData);
        
        // Load existing care plans
        const existingPlans = await db.getCarePlansByResident(id);
        setCarePlans(existingPlans);
        
        if (existingPlans.length > 0) {
          // Use the most recent plan
          const latestPlan = existingPlans.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          
          setCurrentPlan(latestPlan);
          setGeneralDiagnosis(latestPlan.generalDiagnosis);
          setObjectives(latestPlan.objectives || []);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const addObjective = () => {
    const newObjective: CareObjective = {
      id: crypto.randomUUID(),
      area: 'biomedica',
      description: '',
      activities: [''],
      periodicity: '',
      responsible: '',
      status: 'activo'
    };
    setObjectives([...objectives, newObjective]);
  };

  const updateObjective = (id: string, updates: Partial<CareObjective>) => {
    setObjectives(objectives.map(obj => 
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  };

  const removeObjective = (id: string) => {
    setObjectives(objectives.filter(obj => obj.id !== id));
  };

  const addActivity = (objectiveId: string) => {
    setObjectives(objectives.map(obj => 
      obj.id === objectiveId 
        ? { ...obj, activities: [...obj.activities, ''] }
        : obj
    ));
  };

  const updateActivity = (objectiveId: string, activityIndex: number, value: string) => {
    setObjectives(objectives.map(obj => 
      obj.id === objectiveId 
        ? { 
            ...obj, 
            activities: obj.activities.map((activity, index) => 
              index === activityIndex ? value : activity
            )
          }
        : obj
    ));
  };

  const removeActivity = (objectiveId: string, activityIndex: number) => {
    setObjectives(objectives.map(obj => 
      obj.id === objectiveId 
        ? { 
            ...obj, 
            activities: obj.activities.filter((_, index) => index !== activityIndex)
          }
        : obj
    ));
  };

  const handleSignature = (signature: string) => {
    if (showSignatureModal === 'resident') {
      setCurrentPlan(prev => prev ? { ...prev, residentSignature: signature } : null);
    } else if (showSignatureModal === 'director') {
      setCurrentPlan(prev => prev ? { ...prev, directorSignature: signature } : null);
    }
    setShowSignatureModal(null);
  };

  const handleSave = async () => {
    if (!resident) return;

    setSaving(true);
    try {
      const planData: Omit<CarePlan, 'id' | 'createdAt' | 'updatedAt'> = {
        residentId: resident.id,
        generalDiagnosis,
        objectives,
        residentSignature: currentPlan?.residentSignature,
        directorSignature: currentPlan?.directorSignature,
        lastReviewDate: currentPlan?.lastReviewDate,
        nextReviewDate: currentPlan?.nextReviewDate
      };

      if (currentPlan) {
        // Update existing plan
        await db.updateCarePlan(currentPlan.id, {
          ...planData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new plan
        const planId = await db.createCarePlan(planData);
        const newPlan: CarePlan = {
          ...planData,
          id: planId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setCurrentPlan(newPlan);
      }

      await loadResidents();
      alert('Plan de Atención Integral guardado exitosamente');
      navigate('/care-plans');
    } catch (error) {
      console.error('Error saving care plan:', error);
      alert('Error al guardar el Plan de Atención Integral');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!resident) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Residente no encontrado
        </h3>
      </div>
    );
  }

  const getAreaColor = (area: CareObjective['area']) => {
    const colors = {
      biomedica: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
      funcional: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
      mental: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
      social: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
    };
    return colors[area];
  };

  const getAreaLabel = (area: CareObjective['area']) => {
    const labels = {
      biomedica: 'Biomédica',
      funcional: 'Funcional',
      mental: 'Mental/Cognitiva',
      social: 'Social'
    };
    return labels[area];
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/care-plans')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Plan de Atención Integral (PAI)
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {resident.name} - RUN: {resident.run}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors shadow-sm"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-3" />
              Guardar PAI
            </>
          )}
        </button>
      </div>

      {/* Resident Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Información del Residente
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Edad
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {resident.age} años
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Fecha de Ingreso
            </label>
            <p className="mt-1 text-lg text-gray-900 dark:text-white">
              {new Date(resident.admissionDate).toLocaleDateString('es-CL')}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
              Estado Funcional
            </label>
            <div className="mt-1 flex flex-wrap gap-1">
              {resident.functionalStatus.slice(0, 2).map((status, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                >
                  {status}
                </span>
              ))}
              {resident.functionalStatus.length > 2 && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{resident.functionalStatus.length - 2} más
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* General Diagnosis */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Diagnóstico General
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Diagnóstico Biomédico
            </label>
            <textarea
              value={generalDiagnosis.biomedical}
              onChange={(e) => setGeneralDiagnosis({...generalDiagnosis, biomedical: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Diagnósticos médicos, patologías, medicamentos..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Diagnóstico Funcional
            </label>
            <textarea
              value={generalDiagnosis.functional}
              onChange={(e) => setGeneralDiagnosis({...generalDiagnosis, functional: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Capacidades funcionales, movilidad, autonomía..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Diagnóstico Mental/Cognitivo
            </label>
            <textarea
              value={generalDiagnosis.mental}
              onChange={(e) => setGeneralDiagnosis({...generalDiagnosis, mental: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Estado cognitivo, memoria, orientación..."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Diagnóstico Social
            </label>
            <textarea
              value={generalDiagnosis.social}
              onChange={(e) => setGeneralDiagnosis({...generalDiagnosis, social: e.target.value})}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Relaciones familiares, apoyo social, recursos..."
            />
          </div>
        </div>
      </div>

      {/* Objectives */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Objetivos de Atención
          </h2>
          <button
            onClick={addObjective}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Objetivo
          </button>
        </div>

        {objectives.length === 0 ? (
          <div className="text-center py-8">
            <Target className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              No hay objetivos definidos
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Comienza agregando el primer objetivo de atención
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {objectives.map((objective, index) => (
              <div key={objective.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getAreaColor(objective.area)}`}>
                      {getAreaLabel(objective.area)}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      objective.status === 'activo' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' :
                      objective.status === 'completado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    }`}>
                      {objective.status === 'activo' ? 'Activo' : 
                       objective.status === 'completado' ? 'Completado' : 'Suspendido'}
                    </span>
                  </div>
                  <button
                    onClick={() => removeObjective(objective.id)}
                    className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Área de Atención
                    </label>
                    <select
                      value={objective.area}
                      onChange={(e) => updateObjective(objective.id, { area: e.target.value as CareObjective['area'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="biomedica">Biomédica</option>
                      <option value="funcional">Funcional</option>
                      <option value="mental">Mental/Cognitiva</option>
                      <option value="social">Social</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Estado
                    </label>
                    <select
                      value={objective.status}
                      onChange={(e) => updateObjective(objective.id, { status: e.target.value as CareObjective['status'] })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="activo">Activo</option>
                      <option value="completado">Completado</option>
                      <option value="suspendido">Suspendido</option>
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción del Objetivo
                  </label>
                  <textarea
                    value={objective.description}
                    onChange={(e) => updateObjective(objective.id, { description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Describe el objetivo específico de atención..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Periodicidad
                    </label>
                    <input
                      type="text"
                      value={objective.periodicity}
                      onChange={(e) => updateObjective(objective.id, { periodicity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Ej: Diario, Semanal, Mensual..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Responsable
                    </label>
                    <input
                      type="text"
                      value={objective.responsible}
                      onChange={(e) => updateObjective(objective.id, { responsible: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Profesional responsable..."
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Actividades Específicas
                    </label>
                    <button
                      onClick={() => addActivity(objective.id)}
                      className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 text-xs font-medium rounded transition-colors hover:bg-purple-200 dark:hover:bg-purple-900"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Agregar
                    </button>
                  </div>
                  <div className="space-y-2">
                    {objective.activities.map((activity, activityIndex) => (
                      <div key={activityIndex} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={activity}
                          onChange={(e) => updateActivity(objective.id, activityIndex, e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          placeholder="Describe la actividad específica..."
                        />
                        {objective.activities.length > 1 && (
                          <button
                            onClick={() => removeActivity(objective.id, activityIndex)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Signatures */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Firmas Digitales
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Firma del Residente/Tutor
            </h3>
            {currentPlan?.residentSignature ? (
              <div className="space-y-4">
                <div className="w-full h-32 border-2 border-green-300 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ Firmado digitalmente
                </p>
                <button
                  onClick={() => setShowSignatureModal('resident')}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Actualizar Firma
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                  <PenTool className="w-8 h-8 text-gray-400" />
                </div>
                <button
                  onClick={() => setShowSignatureModal('resident')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Firmar Plan
                </button>
              </div>
            )}
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Firma del Director/Responsable
            </h3>
            {currentPlan?.directorSignature ? (
              <div className="space-y-4">
                <div className="w-full h-32 border-2 border-green-300 dark:border-green-600 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ Firmado digitalmente
                </p>
                <button
                  onClick={() => setShowSignatureModal('director')}
                  className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Actualizar Firma
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                  <PenTool className="w-8 h-8 text-gray-400" />
                </div>
                <button
                  onClick={() => setShowSignatureModal('director')}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  <PenTool className="w-4 h-4 mr-2" />
                  Firmar Plan
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Digital Signature Modal */}
      {showSignatureModal && (
        <DigitalSignature
          title={showSignatureModal === 'resident' ? 'Firma del Residente/Tutor' : 'Firma del Director/Responsable'}
          signerName={showSignatureModal === 'resident' ? resident.guardian.name : 'Director/Responsable'}
          onSave={handleSignature}
          onCancel={() => setShowSignatureModal(null)}
        />
      )}
    </div>
  );
}