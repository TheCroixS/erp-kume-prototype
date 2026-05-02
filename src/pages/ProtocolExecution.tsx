import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  CheckSquare, 
  Save, 
  FileText,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';
import { db } from '../services/database';
import { useApp } from '../contexts/AppContext';
import { Protocol, ProtocolExecution as ProtocolExecutionType, ExecutedProtocolItem } from '../types';

export default function ProtocolExecution() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [selectedResident, setSelectedResident] = useState('');
  const [executedBy, setExecutedBy] = useState('');
  const [observations, setObservations] = useState('');
  const [executedItems, setExecutedItems] = useState<ExecutedProtocolItem[]>([]);

  useEffect(() => {
    const loadProtocol = async () => {
      if (!id) return;
      
      try {
        const protocols = await db.getProtocols();
        const foundProtocol = protocols.find(p => p.id === id);
        
        if (foundProtocol) {
          setProtocol(foundProtocol);
          // Initialize executed items
          setExecutedItems(foundProtocol.checklist.map(item => ({
            id: crypto.randomUUID(),
            protocolItemId: item.id,
            completed: false,
            observations: ''
          })));
        }
      } catch (error) {
        console.error('Error loading protocol:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProtocol();
  }, [id]);

  const handleItemToggle = (itemId: string, completed: boolean) => {
    setExecutedItems(prev => prev.map(item => 
      item.protocolItemId === itemId ? { ...item, completed } : item
    ));
  };

  const handleItemObservation = (itemId: string, observations: string) => {
    setExecutedItems(prev => prev.map(item => 
      item.protocolItemId === itemId ? { ...item, observations } : item
    ));
  };

  const calculateCompliance = () => {
    if (executedItems.length === 0) return 0;
    const completedItems = executedItems.filter(item => item.completed).length;
    return Math.round((completedItems / executedItems.length) * 100);
  };

  const getEvaluation = (percentage: number) => {
    if (percentage >= 90) return 'optimo';
    if (percentage >= 75) return 'bueno';
    if (percentage >= 60) return 'regular';
    return 'malo';
  };

  const handleSave = async () => {
    if (!protocol || !executedBy) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const compliancePercentage = calculateCompliance();
      const evaluation = getEvaluation(compliancePercentage);

      const execution: Omit<ProtocolExecutionType, 'id'> = {
        protocolId: protocol.id,
        residentId: selectedResident || undefined,
        executionDate: new Date().toISOString().split('T')[0],
        executedBy,
        items: executedItems,
        observations,
        compliancePercentage,
        evaluation: evaluation as any
      };

      await db.createProtocolExecution(execution);
      alert('Protocolo ejecutado y guardado exitosamente');
      navigate('/protocols');
    } catch (error) {
      console.error('Error saving protocol execution:', error);
      alert('Error al guardar la ejecución del protocolo');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="text-center py-12">
        <CheckSquare className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          Protocolo no encontrado
        </h3>
      </div>
    );
  }

  const compliancePercentage = calculateCompliance();
  const evaluation = getEvaluation(compliancePercentage);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/protocols')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Ejecutar Protocolo
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              {protocol.name}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Ejecución
            </>
          )}
        </button>
      </div>

      {/* Execution Info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Información de Ejecución
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Residente (opcional)
            </label>
            <select
              value={selectedResident}
              onChange={(e) => setSelectedResident(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Protocolo general</option>
              {state.residents.map(resident => (
                <option key={resident.id} value={resident.id}>
                  {resident.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ejecutado por *
            </label>
            <input
              type="text"
              value={executedBy}
              onChange={(e) => setExecutedBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Nombre del profesional"
              required
            />
          </div>
        </div>
      </div>

      {/* Compliance Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Resumen de Cumplimiento
          </h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {compliancePercentage}%
              </p>
              <p className={`text-sm font-medium capitalize ${
                evaluation === 'optimo' ? 'text-green-600 dark:text-green-400' :
                evaluation === 'bueno' ? 'text-blue-600 dark:text-blue-400' :
                evaluation === 'regular' ? 'text-yellow-600 dark:text-yellow-400' :
                'text-red-600 dark:text-red-400'
              }`}>
                {evaluation}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              evaluation === 'optimo' ? 'bg-green-100 dark:bg-green-900/50' :
              evaluation === 'bueno' ? 'bg-blue-100 dark:bg-blue-900/50' :
              evaluation === 'regular' ? 'bg-yellow-100 dark:bg-yellow-900/50' :
              'bg-red-100 dark:bg-red-900/50'
            }`}>
              {evaluation === 'optimo' ? (
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : evaluation === 'malo' ? (
                <X className="w-6 h-6 text-red-600 dark:text-red-400" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Lista de Verificación
        </h2>
        
        <div className="space-y-4">
          {protocol.checklist.map((item, index) => {
            const executedItem = executedItems.find(ei => ei.protocolItemId === item.id);
            
            return (
              <div key={item.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={executedItem?.completed || false}
                      onChange={(e) => handleItemToggle(item.id, e.target.checked)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {item.description}
                      </h3>
                      {item.required && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                          Obligatorio
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-2">
                      <textarea
                        value={executedItem?.observations || ''}
                        onChange={(e) => handleItemObservation(item.id, e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Observaciones (opcional)..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* General Observations */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Observaciones Generales
        </h2>
        
        <textarea
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Observaciones generales sobre la ejecución del protocolo..."
        />
      </div>
    </div>
  );
}