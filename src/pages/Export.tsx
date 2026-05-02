import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Database, 
  FileText, 
  Calendar,
  Users,
  Activity,
  CheckSquare,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Upload,
  Save,
  Clock,
  HardDrive
} from 'lucide-react';
import { db } from '../services/database';
import { useApp } from '../contexts/AppContext';

interface Backup {
  id: string;
  type: 'manual' | 'automatic';
  createdAt: string;
  metadata: {
    totalResidents: number;
    totalMedicalRecords: number;
    totalCarePlans: number;
    totalDailyRecords: number;
    totalProtocols: number;
    totalProtocolExecutions: number;
  };
}

export default function Export() {
  const { state } = useApp();
  const [exporting, setExporting] = useState(false);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoadingBackups(true);
      const backupList = await db.getBackups();
      setBackups(backupList);
    } catch (error) {
      console.error('Error loading backups:', error);
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleExportAll = async () => {
    setExporting(true);
    try {
      const blob = await db.exportAllData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eleam_backup_completo_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Error al exportar los datos');
    } finally {
      setExporting(false);
    }
  };

  const handleExportResident = async (residentId: string) => {
    setExporting(true);
    try {
      const resident = await db.getResident(residentId);
      if (!resident) return;

      const blob = await db.exportResidentData(residentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `residente_${resident.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting resident data:', error);
      alert('Error al exportar los datos del residente');
    } finally {
      setExporting(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      await db.createBackup('manual');
      await loadBackups();
      alert('Respaldo creado exitosamente');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Error al crear el respaldo');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este respaldo?')) return;
    
    try {
      await db.deleteBackup(backupId);
      await loadBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      alert('Error al eliminar el respaldo');
    }
  };

  const handleRestoreBackup = async (backupId: string) => {
    if (!confirm('¿Estás seguro de que deseas restaurar este respaldo? Esto sobrescribirá todos los datos actuales.')) return;
    
    try {
      await db.restoreFromBackup(backupId);
      alert('Respaldo restaurado exitosamente. La página se recargará.');
      window.location.reload();
    } catch (error) {
      console.error('Error restoring backup:', error);
      alert('Error al restaurar el respaldo');
    }
  };

  const exportOptions = [
    {
      id: 'complete',
      title: 'Respaldo Completo',
      description: 'Exporta todos los datos del sistema incluyendo residentes, fichas clínicas, planes de atención, registros diarios y protocolos',
      icon: Database,
      color: 'bg-blue-500',
      action: handleExportAll
    },
    {
      id: 'backup',
      title: 'Crear Respaldo Local',
      description: 'Crea un respaldo en la base de datos local para restauración rápida',
      icon: Save,
      color: 'bg-green-500',
      action: handleCreateBackup
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Respaldos y Exportación
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestiona respaldos locales y exporta información del sistema
          </p>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Residentes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.residents.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Fichas Clínicas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.residents.filter(r => r.medicalRecord).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Planes de Atención
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.residents.filter(r => r.carePlan).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Respaldos Locales
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {backups.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Opciones de Exportación
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exportOptions.map((option) => (
            <div
              key={option.id}
              className="border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center`}>
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {option.title}
                  </h3>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {option.description}
              </p>
              
              <button
                onClick={option.action}
                disabled={exporting || creatingBackup}
                className="inline-flex items-center w-full justify-center px-4 py-2 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
              >
                {(exporting || creatingBackup) ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    <option.icon className="w-4 h-4 mr-2" />
                    {option.id === 'backup' ? 'Crear Respaldo' : 'Exportar'}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Local Backups */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Respaldos Locales
          </h2>
          <button
            onClick={loadBackups}
            disabled={loadingBackups}
            className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loadingBackups ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
        
        {loadingBackups ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8">
            <HardDrive className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No hay respaldos locales
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Crea tu primer respaldo para tener una copia de seguridad de los datos
            </p>
            <button
              onClick={handleCreateBackup}
              disabled={creatingBackup}
              className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
            >
              {creatingBackup ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Crear Primer Respaldo
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {backups.map((backup) => (
              <div key={backup.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        backup.type === 'manual' 
                          ? 'bg-blue-100 dark:bg-blue-900/50' 
                          : 'bg-green-100 dark:bg-green-900/50'
                      }`}>
                        {backup.type === 'manual' ? (
                          <Save className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          Respaldo {backup.type === 'manual' ? 'Manual' : 'Automático'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(backup.createdAt).toLocaleString('es-CL')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <div>
                        <span className="font-medium">{backup.metadata.totalResidents}</span> residentes
                      </div>
                      <div>
                        <span className="font-medium">{backup.metadata.totalMedicalRecords}</span> fichas
                      </div>
                      <div>
                        <span className="font-medium">{backup.metadata.totalCarePlans}</span> planes
                      </div>
                      <div>
                        <span className="font-medium">{backup.metadata.totalDailyRecords}</span> registros
                      </div>
                      <div>
                        <span className="font-medium">{backup.metadata.totalProtocols}</span> protocolos
                      </div>
                      <div>
                        <span className="font-medium">{backup.metadata.totalProtocolExecutions}</span> ejecuciones
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleRestoreBackup(backup.id)}
                      className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                      title="Restaurar respaldo"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      Restaurar
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors"
                      title="Eliminar respaldo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Individual Resident Export */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Exportar Residente Individual
        </h2>
        
        {state.residents.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay residentes registrados para exportar
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.residents.map((resident) => (
              <div key={resident.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {resident.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      RUN: {resident.run}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      {resident.medicalRecord && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200">
                          Ficha clínica
                        </span>
                      )}
                      {resident.carePlan && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                          PAI
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleExportResident(resident.id)}
                    disabled={exporting}
                    className="inline-flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded transition-colors"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Exportar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Important Notes */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
        <div className="flex items-start">
          <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mt-1" />
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
              Notas Importantes sobre Respaldos
            </h3>
            <ul className="mt-2 text-yellow-700 dark:text-yellow-300 space-y-1">
              <li>• Los respaldos locales se almacenan en el navegador y permiten restauración rápida</li>
              <li>• Los archivos exportados (.zip) pueden transferirse a otros equipos</li>
              <li>• Se recomienda crear respaldos antes de actualizaciones importantes</li>
              <li>• Los respaldos incluyen todas las evaluaciones funcionales y fichas clínicas</li>
              <li>• Mantén múltiples respaldos para mayor seguridad</li>
              <li>• Los documentos adjuntos se incluyen en formato original</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}