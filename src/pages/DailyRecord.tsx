import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Activity, 
  Save, 
  User,
  Clock,
  Pill,
  Utensils,
  Droplets,
  Heart,
  Plus,
  X,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Brain,
  Users,
  Phone,
  FileText,
  Target,
  TrendingUp,
  Calendar,
  Trash2,
  Edit
} from 'lucide-react';
import { db } from '../services/database';
import { Resident, DailyRecord as DailyRecordType } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DailyRecord() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedShift, setSelectedShift] = useState<'mañana' | 'tarde' | 'noche'>('mañana');
  const [activeTab, setActiveTab] = useState('vitals');

  // Enhanced form state
  const [record, setRecord] = useState<Partial<DailyRecordType>>({
    vitalSigns: {
      notes: ''
    },
    hygiene: {
      personalHygiene: {
        completed: false,
        type: 'ducha_completa',
        assistance: 'independiente',
        time: '',
        observations: ''
      },
      oralHygiene: {
        completed: false,
        method: 'cepillado',
        assistance: 'independiente',
        observations: ''
      },
      continence: {
        bladderControl: 'continente',
        bowelControl: 'continente',
        diaperChanges: [],
        observations: ''
      }
    },
    nutrition: {
      meals: {
        breakfast: {
          time: '08:00',
          menu: '',
          amountConsumed: 100,
          consistency: 'normal',
          assistance: 'independiente',
          appetite: 'bueno',
          observations: ''
        },
        lunch: {
          time: '12:30',
          menu: '',
          amountConsumed: 100,
          consistency: 'normal',
          assistance: 'independiente',
          appetite: 'bueno',
          observations: ''
        },
        dinner: {
          time: '19:00',
          menu: '',
          amountConsumed: 100,
          consistency: 'normal',
          assistance: 'independiente',
          appetite: 'bueno',
          observations: ''
        },
        snacks: []
      },
      hydration: {
        totalIntake: 0,
        fluidType: [],
        assistance: 'independiente',
        observations: ''
      },
      supplements: {
        administered: false,
        type: [],
        time: [],
        observations: ''
      },
      swallowing: {
        difficulty: false,
        consistency: 'normal',
        aspiration: false,
        observations: ''
      }
    },
    mobility: {
      transfers: {
        bedToChair: 'independiente',
        walking: 'independiente',
        stairs: 'independiente',
        observations: ''
      },
      positioning: {
        changes: 0,
        positions: [],
        pressureRelief: false,
        observations: ''
      },
      exercise: {
        participated: false,
        type: [],
        duration: '',
        tolerance: 'buena',
        observations: ''
      }
    },
    medication: [],
    activities: [],
    incidents: [],
    physicalAssessment: {
      skin: {
        integrity: 'intacta',
        color: 'normal',
        temperature: 'normal',
        hydration: 'normal',
        observations: ''
      },
      respiratory: {
        pattern: 'normal',
        sounds: 'normales',
        cough: false,
        secretions: false,
        observations: ''
      },
      cardiovascular: {
        rhythm: 'regular',
        edema: false,
        edemaLocation: [],
        perfusion: 'buena',
        observations: ''
      },
      neurological: {
        consciousness: 'alerta',
        orientation: 'orientado',
        speech: 'normal',
        mobility: 'normal',
        observations: ''
      }
    },
    mentalState: {
      mood: 'estable',
      behavior: 'cooperativo',
      cognition: 'normal',
      sleep: {
        nightSleep: 'bueno',
        naps: false,
        sleepAids: false,
        observations: ''
      },
      communication: {
        verbal: 'normal',
        comprehension: 'buena',
        expression: 'clara',
        observations: ''
      }
    },
    socialInteraction: {
      familyVisits: {
        received: false,
        visitors: [],
        duration: '',
        mood: 'neutral',
        observations: ''
      },
      peerInteraction: {
        participated: false,
        quality: 'buena',
        observations: ''
      },
      staffInteraction: {
        cooperative: true,
        communication: 'fluida',
        observations: ''
      }
    },
    painAssessment: {
      hasPain: false,
      location: [],
      intensity: 0,
      character: 'punzante',
      triggers: [],
      relief: [],
      medication: false,
      observations: ''
    },
    familyContact: [],
    qualityIndicators: {
      fallRisk: 'bajo',
      pressureUlcerRisk: 'bajo',
      nutritionalRisk: 'bajo',
      infectionRisk: 'bajo',
      depressionRisk: 'bajo',
      cognitiveDecline: 'estable',
      functionalDecline: 'estable',
      overallWellbeing: 'bueno'
    },
    generalObservations: '',
    recordedBy: ''
  });

  useEffect(() => {
    const loadData = async () => {
      if (!id) return;
      
      try {
        const residentData = await db.getResident(id);
        setResident(residentData);
        
        // Load existing record for the selected date
        const records = await db.getDailyRecordsByResident(id, selectedDate, selectedDate);
        const existingRecord = records.find(r => r.shift === selectedShift);
        
        if (existingRecord) {
          setRecord(existingRecord);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, selectedDate, selectedShift]);

  const handleSave = async () => {
    if (!resident || !record.recordedBy) {
      alert('Por favor completa el campo "Registrado por"');
      return;
    }

    setSaving(true);
    try {
      const recordToSave: Omit<DailyRecordType, 'id' | 'recordedAt'> = {
        residentId: resident.id,
        date: selectedDate,
        shift: selectedShift,
        recordedBy: record.recordedBy,
        ...record
      } as any;

      await db.createDailyRecord(recordToSave);
      alert('Registro diario guardado exitosamente');
      navigate('/daily-monitoring');
    } catch (error) {
      console.error('Error saving daily record:', error);
      alert('Error al guardar el registro diario');
    } finally {
      setSaving(false);
    }
  };

  const addVitalSign = (period: 'morning' | 'afternoon' | 'evening') => {
    setRecord(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [period]: {
          time: new Date().toTimeString().slice(0, 5),
          recordedBy: prev.recordedBy || '',
          alertValues: false
        }
      }
    }));
  };

  const addMedication = () => {
    const newMed = {
      medicationId: crypto.randomUUID(),
      medicationName: '',
      dose: '',
      route: 'oral' as const,
      scheduledTime: new Date().toTimeString().slice(0, 5),
      administered: false,
      administeredBy: record.recordedBy || '',
      sideEffects: false,
      observations: ''
    };

    setRecord(prev => ({
      ...prev,
      medication: [...(prev.medication || []), newMed]
    }));
  };

  const removeMedication = (index: number) => {
    setRecord(prev => ({
      ...prev,
      medication: prev.medication?.filter((_, i) => i !== index) || []
    }));
  };

  const addActivity = () => {
    const newActivity = {
      type: 'recreativa' as const,
      name: '',
      startTime: new Date().toTimeString().slice(0, 5),
      endTime: '',
      participation: 'activa' as const,
      mood: 'tranquilo' as const,
      socialInteraction: 'buena' as const,
      observations: ''
    };

    setRecord(prev => ({
      ...prev,
      activities: [...(prev.activities || []), newActivity]
    }));
  };

  const removeActivity = (index: number) => {
    setRecord(prev => ({
      ...prev,
      activities: prev.activities?.filter((_, i) => i !== index) || []
    }));
  };

  const addIncident = () => {
    const newIncident = {
      id: crypto.randomUUID(),
      time: new Date().toTimeString().slice(0, 5),
      type: 'otro' as const,
      severity: 'leve' as const,
      description: '',
      location: '',
      witnesses: [],
      actionsTaken: [],
      familyNotified: false,
      doctorNotified: false,
      reportedBy: record.recordedBy || '',
      followUp: ''
    };

    setRecord(prev => ({
      ...prev,
      incidents: [...(prev.incidents || []), newIncident]
    }));
  };

  const removeIncident = (index: number) => {
    setRecord(prev => ({
      ...prev,
      incidents: prev.incidents?.filter((_, i) => i !== index) || []
    }));
  };

  const addDiaperChange = () => {
    const newChange = {
      time: new Date().toTimeString().slice(0, 5),
      type: 'orina' as const,
      skinCondition: 'normal' as const,
      products: [],
      performedBy: record.recordedBy || '',
      observations: ''
    };

    setRecord(prev => ({
      ...prev,
      hygiene: {
        ...prev.hygiene,
        continence: {
          ...prev.hygiene?.continence,
          diaperChanges: [...(prev.hygiene?.continence?.diaperChanges || []), newChange]
        }
      }
    }));
  };

  const addSnack = () => {
    const newSnack = {
      time: new Date().toTimeString().slice(0, 5),
      menu: '',
      amountConsumed: 100,
      consistency: 'normal' as const,
      assistance: 'independiente' as const,
      appetite: 'bueno' as const,
      observations: ''
    };

    setRecord(prev => ({
      ...prev,
      nutrition: {
        ...prev.nutrition,
        meals: {
          ...prev.nutrition?.meals,
          snacks: [...(prev.nutrition?.meals?.snacks || []), newSnack]
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
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

  const tabs = [
    { id: 'vitals', name: 'Signos Vitales', icon: Thermometer, color: 'text-red-600' },
    { id: 'hygiene', name: 'Higiene', icon: Droplets, color: 'text-blue-600' },
    { id: 'nutrition', name: 'Nutrición', icon: Utensils, color: 'text-orange-600' },
    { id: 'mobility', name: 'Movilidad', icon: Activity, color: 'text-green-600' },
    { id: 'medication', name: 'Medicación', icon: Pill, color: 'text-purple-600' },
    { id: 'activities', name: 'Actividades', icon: Heart, color: 'text-pink-600' },
    { id: 'assessment', name: 'Evaluación', icon: Brain, color: 'text-indigo-600' },
    { id: 'social', name: 'Social', icon: Users, color: 'text-teal-600' },
    { id: 'incidents', name: 'Incidentes', icon: AlertTriangle, color: 'text-yellow-600' },
    { id: 'summary', name: 'Resumen', icon: FileText, color: 'text-gray-600' }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/daily-monitoring')}
            className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Registro Diario Integral
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {resident.name} • RUN: {resident.run}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <select
            value={selectedShift}
            onChange={(e) => setSelectedShift(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="mañana">Turno Mañana (07:00-15:00)</option>
            <option value="tarde">Turno Tarde (15:00-23:00)</option>
            <option value="noche">Turno Noche (23:00-07:00)</option>
          </select>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Registro
              </>
            )}
          </button>
        </div>
      </div>

      {/* Resident Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {resident.name}
              </h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                <span>RUN: {resident.run}</span>
                <span>Edad: {resident.age} años</span>
                <span>Ingreso: {format(new Date(resident.admissionDate), 'dd MMM yyyy', { locale: es })}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-400">Fecha de registro</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {format(new Date(selectedDate), 'dd MMMM yyyy', { locale: es })}
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 capitalize">
              {selectedShift}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className={`w-4 h-4 mr-2 ${tab.color}`} />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'vitals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Control de Signos Vitales
                </h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => addVitalSign('morning')}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded text-sm hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
                  >
                    + Mañana
                  </button>
                  <button
                    onClick={() => addVitalSign('afternoon')}
                    className="px-3 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded text-sm hover:bg-orange-200 dark:hover:bg-orange-900 transition-colors"
                  >
                    + Tarde
                  </button>
                  <button
                    onClick={() => addVitalSign('evening')}
                    className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded text-sm hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
                  >
                    + Noche
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['morning', 'afternoon', 'evening'].map((period) => (
                  <div key={period} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-4 capitalize">
                      {period === 'morning' ? 'Mañana' : period === 'afternoon' ? 'Tarde' : 'Noche'}
                    </h4>
                    
                    {record.vitalSigns?.[period as keyof typeof record.vitalSigns] ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Hora
                            </label>
                            <input
                              type="time"
                              value={record.vitalSigns[period as keyof typeof record.vitalSigns]?.time || ''}
                              onChange={(e) => setRecord(prev => ({
                                ...prev,
                                vitalSigns: {
                                  ...prev.vitalSigns,
                                  [period]: {
                                    ...prev.vitalSigns?.[period as keyof typeof prev.vitalSigns],
                                    time: e.target.value
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Temp. (°C)
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              placeholder="36.5"
                              value={record.vitalSigns[period as keyof typeof record.vitalSigns]?.temperature || ''}
                              onChange={(e) => setRecord(prev => ({
                                ...prev,
                                vitalSigns: {
                                  ...prev.vitalSigns,
                                  [period]: {
                                    ...prev.vitalSigns?.[period as keyof typeof prev.vitalSigns],
                                    temperature: parseFloat(e.target.value) || undefined
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              P.A. Sistólica
                            </label>
                            <input
                              type="number"
                              placeholder="120"
                              value={record.vitalSigns[period as keyof typeof record.vitalSigns]?.bloodPressure?.systolic || ''}
                              onChange={(e) => setRecord(prev => ({
                                ...prev,
                                vitalSigns: {
                                  ...prev.vitalSigns,
                                  [period]: {
                                    ...prev.vitalSigns?.[period as keyof typeof prev.vitalSigns],
                                    bloodPressure: {
                                      ...prev.vitalSigns?.[period as keyof typeof prev.vitalSigns]?.bloodPressure,
                                      systolic: parseInt(e.target.value) || 0
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              P.A. Diastólica
                            </label>
                            <input
                              type="number"
                              placeholder="80"
                              value={record.vitalSigns[period as keyof typeof record.vitalSigns]?.bloodPressure?.diastolic || ''}
                              onChange={(e) => setRecord(prev => ({
                                ...prev,
                                vitalSigns: {
                                  ...prev.vitalSigns,
                                  [period]: {
                                    ...prev.vitalSigns?.[period as keyof typeof prev.vitalSigns],
                                    bloodPressure: {
                                      ...prev.vitalSigns?.[period as keyof typeof prev.vitalSigns]?.bloodPressure,
                                      diastolic: parseInt(e.target.value) || 0
                                    }
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Pulso (lpm)
                            </label>
                            <input
                              type="number"
                              placeholder="70"
                              value={record.vitalSigns[period as keyof typeof record.vitalSigns]?.pulse || ''}
                              onChange={(e) => setRecord(prev => ({
                                ...prev,
                                vitalSigns: {
                                  ...prev.vitalSigns,
                                  [period]: {
                                    ...prev.vitalSigns?.[period as keyof typeof prev.vitalSigns],
                                    pulse: parseInt(e.target.value) || undefined
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Sat. O2 (%)
                            </label>
                            <input
                              type="number"
                              placeholder="98"
                              value={record.vitalSigns[period as keyof typeof record.vitalSigns]?.oxygenSaturation || ''}
                              onChange={(e) => setRecord(prev => ({
                                ...prev,
                                vitalSigns: {
                                  ...prev.vitalSigns,
                                  [period]: {
                                    ...prev.vitalSigns?.[period as keyof typeof prev.vitalSigns],
                                    oxygenSaturation: parseInt(e.target.value) || undefined
                                  }
                                }
                              }))}
                              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={record.vitalSigns[period as keyof typeof record.vitalSigns]?.alertValues || false}
                              onChange={(e) => setRecord(prev => ({
                                ...prev,
                                vitalSigns: {
                                  ...prev.vitalSigns,
                                  [period]: {
                                    ...prev.vitalSigns?.[period as keyof typeof prev.vitalSigns],
                                    alertValues: e.target.checked
                                  }
                                }
                              }))}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Valores de alerta
                            </span>
                          </label>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        No registrado
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Observaciones generales
                </label>
                <textarea
                  value={record.vitalSigns?.notes || ''}
                  onChange={(e) => setRecord(prev => ({
                    ...prev,
                    vitalSigns: {
                      ...prev.vitalSigns,
                      notes: e.target.value
                    }
                  }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Observaciones sobre los signos vitales..."
                />
              </div>
            </div>
          )}

          {activeTab === 'hygiene' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Control de Higiene Personal
              </h3>
              
              {/* Personal Hygiene */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-4">Higiene Personal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        checked={record.hygiene?.personalHygiene?.completed || false}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          hygiene: {
                            ...prev.hygiene,
                            personalHygiene: {
                              ...prev.hygiene?.personalHygiene,
                              completed: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Higiene personal completada
                      </span>
                    </label>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tipo de higiene
                        </label>
                        <select
                          value={record.hygiene?.personalHygiene?.type || 'ducha_completa'}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            hygiene: {
                              ...prev.hygiene,
                              personalHygiene: {
                                ...prev.hygiene?.personalHygiene,
                                type: e.target.value as any
                              }
                            }
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="ducha_completa">Ducha completa</option>
                          <option value="aseo_parcial">Aseo parcial</option>
                          <option value="aseo_cama">Aseo en cama</option>
                          <option value="higiene_oral">Solo higiene oral</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Nivel de asistencia
                        </label>
                        <select
                          value={record.hygiene?.personalHygiene?.assistance || 'independiente'}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            hygiene: {
                              ...prev.hygiene,
                              personalHygiene: {
                                ...prev.hygiene?.personalHygiene,
                                assistance: e.target.value as any
                              }
                            }
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="independiente">Independiente</option>
                          <option value="supervision">Supervisión</option>
                          <option value="asistencia_parcial">Asistencia parcial</option>
                          <option value="asistencia_total">Asistencia total</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Hora
                        </label>
                        <input
                          type="time"
                          value={record.hygiene?.personalHygiene?.time || ''}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            hygiene: {
                              ...prev.hygiene,
                              personalHygiene: {
                                ...prev.hygiene?.personalHygiene,
                                time: e.target.value
                              }
                            }
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={record.hygiene?.personalHygiene?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        hygiene: {
                          ...prev.hygiene,
                          personalHygiene: {
                            ...prev.hygiene?.personalHygiene,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={4}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Observaciones sobre la higiene personal..."
                    />
                  </div>
                </div>
              </div>

              {/* Oral Hygiene */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-medium text-green-900 dark:text-green-200 mb-4">Higiene Oral</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.hygiene?.oralHygiene?.completed || false}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          hygiene: {
                            ...prev.hygiene,
                            oralHygiene: {
                              ...prev.hygiene?.oralHygiene,
                              completed: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Higiene oral completada
                      </span>
                    </label>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Método
                      </label>
                      <select
                        value={record.hygiene?.oralHygiene?.method || 'cepillado'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          hygiene: {
                            ...prev.hygiene,
                            oralHygiene: {
                              ...prev.hygiene?.oralHygiene,
                              method: e.target.value as any
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="cepillado">Cepillado</option>
                        <option value="enjuague">Enjuague</option>
                        <option value="limpieza_protesis">Limpieza de prótesis</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Asistencia
                      </label>
                      <select
                        value={record.hygiene?.oralHygiene?.assistance || 'independiente'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          hygiene: {
                            ...prev.hygiene,
                            oralHygiene: {
                              ...prev.hygiene?.oralHygiene,
                              assistance: e.target.value as any
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="independiente">Independiente</option>
                        <option value="supervision">Supervisión</option>
                        <option value="asistencia_total">Asistencia total</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={record.hygiene?.oralHygiene?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        hygiene: {
                          ...prev.hygiene,
                          oralHygiene: {
                            ...prev.hygiene?.oralHygiene,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="Observaciones sobre la higiene oral..."
                    />
                  </div>
                </div>
              </div>

              {/* Continence */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-200 mb-4">Control de Esfínteres</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Control vesical
                      </label>
                      <select
                        value={record.hygiene?.continence?.bladderControl || 'continente'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          hygiene: {
                            ...prev.hygiene,
                            continence: {
                              ...prev.hygiene?.continence,
                              bladderControl: e.target.value as any
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      >
                        <option value="continente">Continente</option>
                        <option value="incontinente">Incontinente</option>
                        <option value="sonda">Sonda</option>
                        <option value="pañal">Pañal</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Control intestinal
                      </label>
                      <select
                        value={record.hygiene?.continence?.bowelControl || 'continente'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          hygiene: {
                            ...prev.hygiene,
                            continence: {
                              ...prev.hygiene?.continence,
                              bowelControl: e.target.value as any
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      >
                        <option value="continente">Continente</option>
                        <option value="incontinente">Incontinente</option>
                        <option value="ostomia">Ostomía</option>
                      </select>
                    </div>
                    
                    <button
                      type="button"
                      onClick={addDiaperChange}
                      className="inline-flex items-center px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Agregar cambio de pañal
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={record.hygiene?.continence?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        hygiene: {
                          ...prev.hygiene,
                          continence: {
                            ...prev.hygiene?.continence,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                      placeholder="Observaciones sobre el control de esfínteres..."
                    />
                  </div>
                </div>

                {/* Diaper Changes */}
                {record.hygiene?.continence?.diaperChanges && record.hygiene.continence.diaperChanges.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cambios de pañal ({record.hygiene.continence.diaperChanges.length})
                    </h5>
                    <div className="space-y-2">
                      {record.hygiene.continence.diaperChanges.map((change, index) => (
                        <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded border">
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div>
                              <span className="font-medium">Hora:</span> {change.time}
                            </div>
                            <div>
                              <span className="font-medium">Tipo:</span> {change.type}
                            </div>
                            <div>
                              <span className="font-medium">Piel:</span> {change.skinCondition}
                            </div>
                            <div>
                              <span className="font-medium">Por:</span> {change.performedBy}
                            </div>
                          </div>
                          {change.observations && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {change.observations}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Control Nutricional
              </h3>
              
              {/* Meals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['breakfast', 'lunch', 'dinner'].map((mealType) => (
                  <div key={mealType} className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-orange-900 dark:text-orange-200 mb-4 capitalize">
                      {mealType === 'breakfast' ? 'Desayuno' : mealType === 'lunch' ? 'Almuerzo' : 'Cena'}
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Hora
                        </label>
                        <input
                          type="time"
                          value={record.nutrition?.meals?.[mealType as keyof typeof record.nutrition.meals]?.time || ''}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            nutrition: {
                              ...prev.nutrition,
                              meals: {
                                ...prev.nutrition?.meals,
                                [mealType]: {
                                  ...prev.nutrition?.meals?.[mealType as keyof typeof prev.nutrition.meals],
                                  time: e.target.value
                                }
                              }
                            }
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Menú
                        </label>
                        <input
                          type="text"
                          value={record.nutrition?.meals?.[mealType as keyof typeof record.nutrition.meals]?.menu || ''}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            nutrition: {
                              ...prev.nutrition,
                              meals: {
                                ...prev.nutrition?.meals,
                                [mealType]: {
                                  ...prev.nutrition?.meals?.[mealType as keyof typeof prev.nutrition.meals],
                                  menu: e.target.value
                                }
                              }
                            }
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="Descripción del menú..."
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Cantidad consumida (%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="25"
                          value={record.nutrition?.meals?.[mealType as keyof typeof record.nutrition.meals]?.amountConsumed || 100}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            nutrition: {
                              ...prev.nutrition,
                              meals: {
                                ...prev.nutrition?.meals,
                                [mealType]: {
                                  ...prev.nutrition?.meals?.[mealType as keyof typeof prev.nutrition.meals],
                                  amountConsumed: parseInt(e.target.value)
                                }
                              }
                            }
                          }))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                          <span>0%</span>
                          <span className="font-medium">
                            {record.nutrition?.meals?.[mealType as keyof typeof record.nutrition.meals]?.amountConsumed || 100}%
                          </span>
                          <span>100%</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Apetito
                        </label>
                        <select
                          value={record.nutrition?.meals?.[mealType as keyof typeof record.nutrition.meals]?.appetite || 'bueno'}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            nutrition: {
                              ...prev.nutrition,
                              meals: {
                                ...prev.nutrition?.meals,
                                [mealType]: {
                                  ...prev.nutrition?.meals?.[mealType as keyof typeof prev.nutrition.meals],
                                  appetite: e.target.value as any
                                }
                              }
                            }
                          }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="bueno">Bueno</option>
                          <option value="regular">Regular</option>
                          <option value="malo">Malo</option>
                          <option value="rechaza">Rechaza</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Observaciones
                        </label>
                        <textarea
                          value={record.nutrition?.meals?.[mealType as keyof typeof record.nutrition.meals]?.observations || ''}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            nutrition: {
                              ...prev.nutrition,
                              meals: {
                                ...prev.nutrition?.meals,
                                [mealType]: {
                                  ...prev.nutrition?.meals?.[mealType as keyof typeof prev.nutrition.meals],
                                  observations: e.target.value
                                }
                              }
                            }
                          }))}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-orange-500"
                          placeholder="Observaciones..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Snacks */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-200">
                    Colaciones ({record.nutrition?.meals?.snacks?.length || 0})
                  </h4>
                  <button
                    type="button"
                    onClick={addSnack}
                    className="inline-flex items-center px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar colación
                  </button>
                </div>
                
                {record.nutrition?.meals?.snacks && record.nutrition.meals.snacks.length > 0 && (
                  <div className="space-y-3">
                    {record.nutrition.meals.snacks.map((snack, index) => (
                      <div key={index} className="bg-white dark:bg-gray-700 p-3 rounded border">
                        <div className="grid grid-cols-4 gap-2 text-xs">
                          <div>
                            <span className="font-medium">Hora:</span> {snack.time}
                          </div>
                          <div>
                            <span className="font-medium">Menú:</span> {snack.menu}
                          </div>
                          <div>
                            <span className="font-medium">Consumido:</span> {snack.amountConsumed}%
                          </div>
                          <div>
                            <span className="font-medium">Apetito:</span> {snack.appetite}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hydration */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-4">Hidratación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Ingesta total (ml)
                      </label>
                      <input
                        type="number"
                        value={record.nutrition?.hydration?.totalIntake || 0}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          nutrition: {
                            ...prev.nutrition,
                            hydration: {
                              ...prev.nutrition?.hydration,
                              totalIntake: parseInt(e.target.value) || 0
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="1500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Asistencia
                      </label>
                      <select
                        value={record.nutrition?.hydration?.assistance || 'independiente'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          nutrition: {
                            ...prev.nutrition,
                            hydration: {
                              ...prev.nutrition?.hydration,
                              assistance: e.target.value as any
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="independiente">Independiente</option>
                        <option value="supervision">Supervisión</option>
                        <option value="asistencia_parcial">Asistencia parcial</option>
                        <option value="asistencia_total">Asistencia total</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={record.nutrition?.hydration?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        nutrition: {
                          ...prev.nutrition,
                          hydration: {
                            ...prev.nutrition?.hydration,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Observaciones sobre hidratación..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mobility' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Control de Movilidad
              </h3>
              
              {/* Transfers */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-medium text-green-900 dark:text-green-200 mb-4">Transferencias</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Cama a silla
                    </label>
                    <select
                      value={record.mobility?.transfers?.bedToChair || 'independiente'}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        mobility: {
                          ...prev.mobility,
                          transfers: {
                            ...prev.mobility?.transfers,
                            bedToChair: e.target.value as any
                          }
                        }
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="independiente">Independiente</option>
                      <option value="supervision">Supervisión</option>
                      <option value="asistencia_1_persona">Asistencia 1 persona</option>
                      <option value="asistencia_2_personas">Asistencia 2 personas</option>
                      <option value="mecanica">Mecánica</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Deambulación
                    </label>
                    <select
                      value={record.mobility?.transfers?.walking || 'independiente'}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        mobility: {
                          ...prev.mobility,
                          transfers: {
                            ...prev.mobility?.transfers,
                            walking: e.target.value as any
                          }
                        }
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="independiente">Independiente</option>
                      <option value="baston">Bastón</option>
                      <option value="andador">Andador</option>
                      <option value="silla_ruedas">Silla de ruedas</option>
                      <option value="no_deambula">No deambula</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Escaleras
                    </label>
                    <select
                      value={record.mobility?.transfers?.stairs || 'independiente'}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        mobility: {
                          ...prev.mobility,
                          transfers: {
                            ...prev.mobility?.transfers,
                            stairs: e.target.value as any
                          }
                        }
                      }))}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                      <option value="independiente">Independiente</option>
                      <option value="supervision">Supervisión</option>
                      <option value="asistencia">Asistencia</option>
                      <option value="no_aplica">No aplica</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Observaciones
                  </label>
                  <textarea
                    value={record.mobility?.transfers?.observations || ''}
                    onChange={(e) => setRecord(prev => ({
                      ...prev,
                      mobility: {
                        ...prev.mobility,
                        transfers: {
                          ...prev.mobility?.transfers,
                          observations: e.target.value
                        }
                      }
                    }))}
                    rows={2}
                    className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Observaciones sobre transferencias..."
                  />
                </div>
              </div>

              {/* Positioning */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-4">Posicionamiento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cambios de posición
                      </label>
                      <input
                        type="number"
                        value={record.mobility?.positioning?.changes || 0}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          mobility: {
                            ...prev.mobility,
                            positioning: {
                              ...prev.mobility?.positioning,
                              changes: parseInt(e.target.value) || 0
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Número de cambios"
                      />
                    </div>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.mobility?.positioning?.pressureRelief || false}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          mobility: {
                            ...prev.mobility,
                            positioning: {
                              ...prev.mobility?.positioning,
                              pressureRelief: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Alivio de presión
                      </span>
                    </label>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={record.mobility?.positioning?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        mobility: {
                          ...prev.mobility,
                          positioning: {
                            ...prev.mobility?.positioning,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Observaciones sobre posicionamiento..."
                    />
                  </div>
                </div>
              </div>

              {/* Exercise */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 dark:text-purple-200 mb-4">Ejercicio y Actividad Física</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.mobility?.exercise?.participated || false}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          mobility: {
                            ...prev.mobility,
                            exercise: {
                              ...prev.mobility?.exercise,
                              participated: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Participó en ejercicios
                      </span>
                    </label>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Duración
                      </label>
                      <input
                        type="text"
                        value={record.mobility?.exercise?.duration || ''}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          mobility: {
                            ...prev.mobility,
                            exercise: {
                              ...prev.mobility?.exercise,
                              duration: e.target.value
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="30 minutos"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tolerancia
                      </label>
                      <select
                        value={record.mobility?.exercise?.tolerance || 'buena'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          mobility: {
                            ...prev.mobility,
                            exercise: {
                              ...prev.mobility?.exercise,
                              tolerance: e.target.value as any
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="buena">Buena</option>
                        <option value="regular">Regular</option>
                        <option value="mala">Mala</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={record.mobility?.exercise?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        mobility: {
                          ...prev.mobility,
                          exercise: {
                            ...prev.mobility?.exercise,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="Observaciones sobre ejercicio..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'medication' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Administración de Medicamentos
                </h3>
                <button
                  type="button"
                  onClick={addMedication}
                  className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Medicamento
                </button>
              </div>
              
              {record.medication && record.medication.length > 0 ? (
                <div className="space-y-4">
                  {record.medication.map((med, index) => (
                    <div key={index} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-purple-900 dark:text-purple-200">
                          Medicamento #{index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeMedication(index)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre del medicamento *
                          </label>
                          <input
                            type="text"
                            value={med.medicationName}
                            onChange={(e) => {
                              const newMeds = [...(record.medication || [])];
                              newMeds[index] = { ...newMeds[index], medicationName: e.target.value };
                              setRecord(prev => ({ ...prev, medication: newMeds }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="Nombre del medicamento"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Dosis
                          </label>
                          <input
                            type="text"
                            value={med.dose}
                            onChange={(e) => {
                              const newMeds = [...(record.medication || [])];
                              newMeds[index] = { ...newMeds[index], dose: e.target.value };
                              setRecord(prev => ({ ...prev, medication: newMeds }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="5mg"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Vía de administración
                          </label>
                          <select
                            value={med.route}
                            onChange={(e) => {
                              const newMeds = [...(record.medication || [])];
                              newMeds[index] = { ...newMeds[index], route: e.target.value as any };
                              setRecord(prev => ({ ...prev, medication: newMeds }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="oral">Oral</option>
                            <option value="sublingual">Sublingual</option>
                            <option value="topica">Tópica</option>
                            <option value="intravenosa">Intravenosa</option>
                            <option value="intramuscular">Intramuscular</option>
                            <option value="subcutanea">Subcutánea</option>
                            <option value="rectal">Rectal</option>
                            <option value="inhalatoria">Inhalatoria</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Hora programada
                          </label>
                          <input
                            type="time"
                            value={med.scheduledTime}
                            onChange={(e) => {
                              const newMeds = [...(record.medication || [])];
                              newMeds[index] = { ...newMeds[index], scheduledTime: e.target.value };
                              setRecord(prev => ({ ...prev, medication: newMeds }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={med.administered}
                              onChange={(e) => {
                                const newMeds = [...(record.medication || [])];
                                newMeds[index] = { ...newMeds[index], administered: e.target.checked };
                                setRecord(prev => ({ ...prev, medication: newMeds }));
                              }}
                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Administrado
                            </span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={med.sideEffects}
                              onChange={(e) => {
                                const newMeds = [...(record.medication || [])];
                                newMeds[index] = { ...newMeds[index], sideEffects: e.target.checked };
                                setRecord(prev => ({ ...prev, medication: newMeds }));
                              }}
                              className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Efectos adversos
                            </span>
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Administrado por
                          </label>
                          <input
                            type="text"
                            value={med.administeredBy}
                            onChange={(e) => {
                              const newMeds = [...(record.medication || [])];
                              newMeds[index] = { ...newMeds[index], administeredBy: e.target.value };
                              setRecord(prev => ({ ...prev, medication: newMeds }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            placeholder="Nombre del profesional"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Observaciones
                        </label>
                        <textarea
                          value={med.observations}
                          onChange={(e) => {
                            const newMeds = [...(record.medication || [])];
                            newMeds[index] = { ...newMeds[index], observations: e.target.value };
                            setRecord(prev => ({ ...prev, medication: newMeds }));
                          }}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="Observaciones sobre la administración..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Pill className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay medicamentos registrados
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Agrega los medicamentos administrados durante este turno
                  </p>
                  <button
                    type="button"
                    onClick={addMedication}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primer Medicamento
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Actividades y Participación
                </h3>
                <button
                  type="button"
                  onClick={addActivity}
                  className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Actividad
                </button>
              </div>
              
              {record.activities && record.activities.length > 0 ? (
                <div className="space-y-4">
                  {record.activities.map((activity, index) => (
                    <div key={index} className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-pink-900 dark:text-pink-200">
                          Actividad #{index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeActivity(index)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de actividad
                          </label>
                          <select
                            value={activity.type}
                            onChange={(e) => {
                              const newActivities = [...(record.activities || [])];
                              newActivities[index] = { ...newActivities[index], type: e.target.value as any };
                              setRecord(prev => ({ ...prev, activities: newActivities }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                          >
                            <option value="recreativa">Recreativa</option>
                            <option value="terapeutica">Terapéutica</option>
                            <option value="social">Social</option>
                            <option value="cognitiva">Cognitiva</option>
                            <option value="fisica">Física</option>
                            <option value="espiritual">Espiritual</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nombre de la actividad
                          </label>
                          <input
                            type="text"
                            value={activity.name}
                            onChange={(e) => {
                              const newActivities = [...(record.activities || [])];
                              newActivities[index] = { ...newActivities[index], name: e.target.value };
                              setRecord(prev => ({ ...prev, activities: newActivities }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                            placeholder="Nombre de la actividad"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Hora inicio
                          </label>
                          <input
                            type="time"
                            value={activity.startTime}
                            onChange={(e) => {
                              const newActivities = [...(record.activities || [])];
                              newActivities[index] = { ...newActivities[index], startTime: e.target.value };
                              setRecord(prev => ({ ...prev, activities: newActivities }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Hora fin
                          </label>
                          <input
                            type="time"
                            value={activity.endTime}
                            onChange={(e) => {
                              const newActivities = [...(record.activities || [])];
                              newActivities[index] = { ...newActivities[index], endTime: e.target.value };
                              setRecord(prev => ({ ...prev, activities: newActivities }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Participación
                          </label>
                          <select
                            value={activity.participation}
                            onChange={(e) => {
                              const newActivities = [...(record.activities || [])];
                              newActivities[index] = { ...newActivities[index], participation: e.target.value as any };
                              setRecord(prev => ({ ...prev, activities: newActivities }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                          >
                            <option value="activa">Activa</option>
                            <option value="pasiva">Pasiva</option>
                            <option value="rechaza">Rechaza</option>
                            <option value="no_participa">No participa</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estado de ánimo
                          </label>
                          <select
                            value={activity.mood}
                            onChange={(e) => {
                              const newActivities = [...(record.activities || [])];
                              newActivities[index] = { ...newActivities[index], mood: e.target.value as any };
                              setRecord(prev => ({ ...prev, activities: newActivities }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                          >
                            <option value="alegre">Alegre</option>
                            <option value="tranquilo">Tranquilo</option>
                            <option value="ansioso">Ansioso</option>
                            <option value="triste">Triste</option>
                            <option value="agresivo">Agresivo</option>
                            <option value="confuso">Confuso</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Observaciones
                        </label>
                        <textarea
                          value={activity.observations}
                          onChange={(e) => {
                            const newActivities = [...(record.activities || [])];
                            newActivities[index] = { ...newActivities[index], observations: e.target.value };
                            setRecord(prev => ({ ...prev, activities: newActivities }));
                          }}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-pink-500"
                          placeholder="Observaciones sobre la actividad..."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay actividades registradas
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Registra las actividades en las que participó el residente
                  </p>
                  <button
                    type="button"
                    onClick={addActivity}
                    className="inline-flex items-center px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Primera Actividad
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'assessment' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Evaluación Física y Mental
              </h3>
              
              {/* Physical Assessment */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                <h4 className="font-medium text-indigo-900 dark:text-indigo-200 mb-4">Evaluación Física</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Skin */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Piel</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Integridad</label>
                        <select
                          value={record.physicalAssessment?.skin?.integrity || 'intacta'}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            physicalAssessment: {
                              ...prev.physicalAssessment,
                              skin: {
                                ...prev.physicalAssessment?.skin,
                                integrity: e.target.value as any
                              }
                            }
                          }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="intacta">Intacta</option>
                          <option value="lesiones_menores">Lesiones menores</option>
                          <option value="ulceras_presion">Úlceras de presión</option>
                          <option value="heridas">Heridas</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Color</label>
                        <select
                          value={record.physicalAssessment?.skin?.color || 'normal'}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            physicalAssessment: {
                              ...prev.physicalAssessment,
                              skin: {
                                ...prev.physicalAssessment?.skin,
                                color: e.target.value as any
                              }
                            }
                          }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="palida">Pálida</option>
                          <option value="cianotica">Cianótica</option>
                          <option value="ictérica">Ictérica</option>
                        </select>
                      </div>
                    </div>
                    
                    <textarea
                      value={record.physicalAssessment?.skin?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        physicalAssessment: {
                          ...prev.physicalAssessment,
                          skin: {
                            ...prev.physicalAssessment?.skin,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={2}
                      className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      placeholder="Observaciones sobre la piel..."
                    />
                  </div>

                  {/* Respiratory */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Respiratorio</h5>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Patrón</label>
                        <select
                          value={record.physicalAssessment?.respiratory?.pattern || 'normal'}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            physicalAssessment: {
                              ...prev.physicalAssessment,
                              respiratory: {
                                ...prev.physicalAssessment?.respiratory,
                                pattern: e.target.value as any
                              }
                            }
                          }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="normal">Normal</option>
                          <option value="taquipnea">Taquipnea</option>
                          <option value="bradipnea">Bradipnea</option>
                          <option value="disnea">Disnea</option>
                          <option value="irregular">Irregular</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Sonidos</label>
                        <select
                          value={record.physicalAssessment?.respiratory?.sounds || 'normales'}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            physicalAssessment: {
                              ...prev.physicalAssessment,
                              respiratory: {
                                ...prev.physicalAssessment?.respiratory,
                                sounds: e.target.value as any
                              }
                            }
                          }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="normales">Normales</option>
                          <option value="roncus">Roncus</option>
                          <option value="sibilancias">Sibilancias</option>
                          <option value="crepitos">Crepitos</option>
                          <option value="disminuidos">Disminuidos</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={record.physicalAssessment?.respiratory?.cough || false}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            physicalAssessment: {
                              ...prev.physicalAssessment,
                              respiratory: {
                                ...prev.physicalAssessment?.respiratory,
                                cough: e.target.checked
                              }
                            }
                          }))}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-1"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Tos</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={record.physicalAssessment?.respiratory?.secretions || false}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            physicalAssessment: {
                              ...prev.physicalAssessment,
                              respiratory: {
                                ...prev.physicalAssessment?.respiratory,
                                secretions: e.target.checked
                              }
                            }
                          }))}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mr-1"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Secreciones</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mental State */}
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <h4 className="font-medium text-purple-900 dark:text-purple-200 mb-4">Estado Mental</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Estado de ánimo
                      </label>
                      <select
                        value={record.mentalState?.mood || 'estable'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          mentalState: {
                            ...prev.mentalState,
                            mood: e.target.value as any
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="estable">Estable</option>
                        <option value="alegre">Alegre</option>
                        <option value="triste">Triste</option>
                        <option value="ansioso">Ansioso</option>
                        <option value="irritable">Irritable</option>
                        <option value="apatico">Apático</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Comportamiento
                      </label>
                      <select
                        value={record.mentalState?.behavior || 'cooperativo'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          mentalState: {
                            ...prev.mentalState,
                            behavior: e.target.value as any
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="cooperativo">Cooperativo</option>
                        <option value="agitado">Agitado</option>
                        <option value="agresivo">Agresivo</option>
                        <option value="retraido">Retraído</option>
                        <option value="confuso">Confuso</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Cognición
                      </label>
                      <select
                        value={record.mentalState?.cognition || 'normal'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          mentalState: {
                            ...prev.mentalState,
                            cognition: e.target.value as any
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="normal">Normal</option>
                        <option value="confusion_leve">Confusión leve</option>
                        <option value="confusion_moderada">Confusión moderada</option>
                        <option value="confusion_severa">Confusión severa</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Sueño nocturno
                      </label>
                      <select
                        value={record.mentalState?.sleep?.nightSleep || 'bueno'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          mentalState: {
                            ...prev.mentalState,
                            sleep: {
                              ...prev.mentalState?.sleep,
                              nightSleep: e.target.value as any
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="bueno">Bueno</option>
                        <option value="intermitente">Intermitente</option>
                        <option value="insomnio">Insomnio</option>
                        <option value="hipersomnia">Hipersomnia</option>
                      </select>
                    </div>
                    
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={record.mentalState?.sleep?.naps || false}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            mentalState: {
                              ...prev.mentalState,
                              sleep: {
                                ...prev.mentalState?.sleep,
                                naps: e.target.checked
                              }
                            }
                          }))}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Siestas</span>
                      </label>
                      
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={record.mentalState?.sleep?.sleepAids || false}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            mentalState: {
                              ...prev.mentalState,
                              sleep: {
                                ...prev.mentalState?.sleep,
                                sleepAids: e.target.checked
                              }
                            }
                          }))}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 mr-2"
                        />
                        <span className="text-xs text-gray-700 dark:text-gray-300">Ayudas para dormir</span>
                      </label>
                    </div>
                    
                    <textarea
                      value={record.mentalState?.sleep?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        mentalState: {
                          ...prev.mentalState,
                          sleep: {
                            ...prev.mentalState?.sleep,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={2}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                      placeholder="Observaciones sobre el sueño..."
                    />
                  </div>
                </div>
              </div>

              {/* Pain Assessment */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <h4 className="font-medium text-red-900 dark:text-red-200 mb-4">Evaluación del Dolor</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.painAssessment?.hasPain || false}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          painAssessment: {
                            ...prev.painAssessment,
                            hasPain: e.target.checked
                          }
                        }))}
                        className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Presenta dolor
                      </span>
                    </label>
                    
                    {record.painAssessment?.hasPain && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Intensidad (0-10)
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            value={record.painAssessment?.intensity || 0}
                            onChange={(e) => setRecord(prev => ({
                              ...prev,
                              painAssessment: {
                                ...prev.painAssessment,
                                intensity: parseInt(e.target.value)
                              }
                            }))}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>Sin dolor</span>
                            <span className="font-medium">
                              {record.painAssessment?.intensity || 0}
                            </span>
                            <span>Dolor severo</span>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Carácter del dolor
                          </label>
                          <select
                            value={record.painAssessment?.character || 'punzante'}
                            onChange={(e) => setRecord(prev => ({
                              ...prev,
                              painAssessment: {
                                ...prev.painAssessment,
                                character: e.target.value as any
                              }
                            }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                          >
                            <option value="punzante">Punzante</option>
                            <option value="sordo">Sordo</option>
                            <option value="quemante">Quemante</option>
                            <option value="pulsatil">Pulsátil</option>
                            <option value="colico">Cólico</option>
                          </select>
                        </div>
                        
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={record.painAssessment?.medication || false}
                            onChange={(e) => setRecord(prev => ({
                              ...prev,
                              painAssessment: {
                                ...prev.painAssessment,
                                medication: e.target.checked
                              }
                            }))}
                            className="rounded border-gray-300 text-red-600 focus:ring-red-500 mr-2"
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            Medicación para el dolor
                          </span>
                        </label>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={record.painAssessment?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        painAssessment: {
                          ...prev.painAssessment,
                          observations: e.target.value
                        }
                      }))}
                      rows={4}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500"
                      placeholder="Observaciones sobre el dolor..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'social' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Interacción Social
              </h3>
              
              {/* Family Visits */}
              <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
                <h4 className="font-medium text-teal-900 dark:text-teal-200 mb-4">Visitas Familiares</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.socialInteraction?.familyVisits?.received || false}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          socialInteraction: {
                            ...prev.socialInteraction,
                            familyVisits: {
                              ...prev.socialInteraction?.familyVisits,
                              received: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Recibió visitas familiares
                      </span>
                    </label>
                    
                    {record.socialInteraction?.familyVisits?.received && (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Duración
                          </label>
                          <input
                            type="text"
                            value={record.socialInteraction?.familyVisits?.duration || ''}
                            onChange={(e) => setRecord(prev => ({
                              ...prev,
                              socialInteraction: {
                                ...prev.socialInteraction,
                                familyVisits: {
                                  ...prev.socialInteraction?.familyVisits,
                                  duration: e.target.value
                                }
                              }
                            }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                            placeholder="2 horas"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Estado de ánimo durante la visita
                          </label>
                          <select
                            value={record.socialInteraction?.familyVisits?.mood || 'neutral'}
                            onChange={(e) => setRecord(prev => ({
                              ...prev,
                              socialInteraction: {
                                ...prev.socialInteraction,
                                familyVisits: {
                                  ...prev.socialInteraction?.familyVisits,
                                  mood: e.target.value as any
                                }
                              }
                            }))}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                          >
                            <option value="positiva">Positiva</option>
                            <option value="neutral">Neutral</option>
                            <option value="negativa">Negativa</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={record.socialInteraction?.familyVisits?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        socialInteraction: {
                          ...prev.socialInteraction,
                          familyVisits: {
                            ...prev.socialInteraction?.familyVisits,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                      placeholder="Observaciones sobre las visitas familiares..."
                    />
                  </div>
                </div>
              </div>

              {/* Peer Interaction */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-4">Interacción con Otros Residentes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.socialInteraction?.peerInteraction?.participated || false}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          socialInteraction: {
                            ...prev.socialInteraction,
                            peerInteraction: {
                              ...prev.socialInteraction?.peerInteraction,
                              participated: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Interactuó con otros residentes
                      </span>
                    </label>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Calidad de la interacción
                      </label>
                      <select
                        value={record.socialInteraction?.peerInteraction?.quality || 'buena'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          socialInteraction: {
                            ...prev.socialInteraction,
                            peerInteraction: {
                              ...prev.socialInteraction?.peerInteraction,
                              quality: e.target.value as any
                            }
                          }
                        
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="buena">Buena</option>
                        <option value="regular">Regular</option>
                        <option value="conflictiva">Conflictiva</option>
                        <option value="aislado">Aislado</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={record.socialInteraction?.peerInteraction?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        socialInteraction: {
                          ...prev.socialInteraction,
                          peerInteraction: {
                            ...prev.socialInteraction?.peerInteraction,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Observaciones sobre la interacción con otros residentes..."
                    />
                  </div>
                </div>
              </div>

              {/* Staff Interaction */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <h4 className="font-medium text-green-900 dark:text-green-200 mb-4">Interacción con el Personal</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.socialInteraction?.staffInteraction?.cooperative || false}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          socialInteraction: {
                            ...prev.socialInteraction,
                            staffInteraction: {
                              ...prev.socialInteraction?.staffInteraction,
                              cooperative: e.target.checked
                            }
                          }
                        }))}
                        className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-2"
                      />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Cooperativo con el personal
                      </span>
                    </label>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Comunicación
                      </label>
                      <select
                        value={record.socialInteraction?.staffInteraction?.communication || 'fluida'}
                        onChange={(e) => setRecord(prev => ({
                          ...prev,
                          socialInteraction: {
                            ...prev.socialInteraction,
                            staffInteraction: {
                              ...prev.socialInteraction?.staffInteraction,
                              communication: e.target.value as any
                            }
                          }
                        }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        <option value="fluida">Fluida</option>
                        <option value="limitada">Limitada</option>
                        <option value="dificil">Difícil</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Observaciones
                    </label>
                    <textarea
                      value={record.socialInteraction?.staffInteraction?.observations || ''}
                      onChange={(e) => setRecord(prev => ({
                        ...prev,
                        socialInteraction: {
                          ...prev.socialInteraction,
                          staffInteraction: {
                            ...prev.socialInteraction?.staffInteraction,
                            observations: e.target.value
                          }
                        }
                      }))}
                      rows={3}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="Observaciones sobre la interacción con el personal..."
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Registro de Incidentes
                </h3>
                <button
                  type="button"
                  onClick={addIncident}
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Incidente
                </button>
              </div>
              
              {record.incidents && record.incidents.length > 0 ? (
                <div className="space-y-4">
                  {record.incidents.map((incident, index) => (
                    <div key={index} className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-yellow-900 dark:text-yellow-200">
                          Incidente #{index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeIncident(index)}
                          className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Hora del incidente
                          </label>
                          <input
                            type="time"
                            value={incident.time}
                            onChange={(e) => {
                              const newIncidents = [...(record.incidents || [])];
                              newIncidents[index] = { ...newIncidents[index], time: e.target.value };
                              setRecord(prev => ({ ...prev, incidents: newIncidents }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tipo de incidente
                          </label>
                          <select
                            value={incident.type}
                            onChange={(e) => {
                              const newIncidents = [...(record.incidents || [])];
                              newIncidents[index] = { ...newIncidents[index], type: e.target.value as any };
                              setRecord(prev => ({ ...prev, incidents: newIncidents }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                          >
                            <option value="caida">Caída</option>
                            <option value="lesion">Lesión</option>
                            <option value="confusion">Confusión</option>
                            <option value="agitacion">Agitación</option>
                            <option value="fuga">Fuga</option>
                            <option value="medicacion">Medicación</option>
                            <option value="otro">Otro</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Severidad
                          </label>
                          <select
                            value={incident.severity}
                            onChange={(e) => {
                              const newIncidents = [...(record.incidents || [])];
                              newIncidents[index] = { ...newIncidents[index], severity: e.target.value as any };
                              setRecord(prev => ({ ...prev, incidents: newIncidents }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                          >
                            <option value="leve">Leve</option>
                            <option value="moderado">Moderado</option>
                            <option value="grave">Grave</option>
                          </select>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción del incidente
                          </label>
                          <textarea
                            value={incident.description}
                            onChange={(e) => {
                              const newIncidents = [...(record.incidents || [])];
                              newIncidents[index] = { ...newIncidents[index], description: e.target.value };
                              setRecord(prev => ({ ...prev, incidents: newIncidents }));
                            }}
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            placeholder="Describe detalladamente lo ocurrido..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Ubicación
                          </label>
                          <input
                            type="text"
                            value={incident.location}
                            onChange={(e) => {
                              const newIncidents = [...(record.incidents || [])];
                              newIncidents[index] = { ...newIncidents[index], location: e.target.value };
                              setRecord(prev => ({ ...prev, incidents: newIncidents }));
                            }}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            placeholder="Lugar donde ocurrió"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={incident.familyNotified}
                              onChange={(e) => {
                                const newIncidents = [...(record.incidents || [])];
                                newIncidents[index] = { ...newIncidents[index], familyNotified: e.target.checked };
                                setRecord(prev => ({ ...prev, incidents: newIncidents }));
                              }}
                              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 mr-2"
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                              Familia notificada
                            </span>
                          </label>
                          
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={incident.doctorNotified}
                              onChange={(e) => {
                                const newIncidents = [...(record.incidents || [])];
                                newIncidents[index] = { ...newIncidents[index], doctorNotified: e.target.checked };
                                setRecord(prev => ({ ...prev, incidents: newIncidents }));
                              }}
                              className="rounded border-gray-300 text-yellow-600 focus:ring-yellow-500 mr-2"
                            />
                            <span className="text-xs text-gray-700 dark:text-gray-300">
                              Médico notificado
                            </span>
                          </label>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Seguimiento requerido
                          </label>
                          <textarea
                            value={incident.followUp}
                            onChange={(e) => {
                              const newIncidents = [...(record.incidents || [])];
                              newIncidents[index] = { ...newIncidents[index], followUp: e.target.value };
                              setRecord(prev => ({ ...prev, incidents: newIncidents }));
                            }}
                            rows={2}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            placeholder="Acciones de seguimiento necesarias..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No hay incidentes registrados
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Si ocurrió algún incidente durante este turno, regístralo aquí
                  </p>
                  <button
                    type="button"
                    onClick={addIncident}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Registrar Incidente
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'summary' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resumen y Observaciones Generales
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observaciones Generales *
                  </label>
                  <textarea
                    value={record.generalObservations || ''}
                    onChange={(e) => setRecord(prev => ({ ...prev, generalObservations: e.target.value }))}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Resumen del estado general del residente, cambios observados, preocupaciones, etc..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Registrado por *
                  </label>
                  <input
                    type="text"
                    value={record.recordedBy || ''}
                    onChange={(e) => setRecord(prev => ({ ...prev, recordedBy: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Nombre del profesional que registra"
                    required
                  />
                  
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
                      Indicadores de Calidad
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <label className="block text-blue-800 dark:text-blue-300 mb-1">
                          Riesgo de caídas
                        </label>
                        <select
                          value={record.qualityIndicators?.fallRisk || 'bajo'}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            qualityIndicators: {
                              ...prev.qualityIndicators,
                              fallRisk: e.target.value as any
                            }
                          }))}
                          className="w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-blue-900/50 text-blue-900 dark:text-blue-200"
                        >
                          <option value="bajo">Bajo</option>
                          <option value="medio">Medio</option>
                          <option value="alto">Alto</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-blue-800 dark:text-blue-300 mb-1">
                          Bienestar general
                        </label>
                        <select
                          value={record.qualityIndicators?.overallWellbeing || 'bueno'}
                          onChange={(e) => setRecord(prev => ({
                            ...prev,
                            qualityIndicators: {
                              ...prev.qualityIndicators,
                              overallWellbeing: e.target.value as any
                            }
                          }))}
                          className="w-full px-2 py-1 border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-blue-900/50 text-blue-900 dark:text-blue-200"
                        >
                          <option value="excelente">Excelente</option>
                          <option value="bueno">Bueno</option>
                          <option value="regular">Regular</option>
                          <option value="malo">Malo</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}