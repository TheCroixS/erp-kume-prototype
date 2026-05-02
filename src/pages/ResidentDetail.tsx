import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Phone, 
  FileText, 
  Download, 
  Eye,
  Heart,
  Activity,
  Edit
} from 'lucide-react';
import { db } from '../services/database';
import { Resident } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { base64ToBlob } from '../utils/validation';

export default function ResidentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resident, setResident] = useState<Resident | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResident = async () => {
      if (!id) return;
      
      try {
        const residentData = await db.getResident(id);
        setResident(residentData);
      } catch (error) {
        console.error('Error loading resident:', error);
      } finally {
        setLoading(false);
      }
    };

    loadResident();
  }, [id]);

  const handleDownloadFile = (file: any) => {
    const blob = base64ToBlob(file.data, file.type);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportResident = async () => {
    if (!resident) return;
    
    try {
      const blob = await db.exportResidentData(resident.id);
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
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
        <div className="mt-6">
          <Link
            to="/residents"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Volver a Residentes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/residents')}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {resident.name}
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              RUN: {resident.run}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleExportResident}
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Datos
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Información Personal
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nombre Completo
                </label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                  {resident.name}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  RUN
                </label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                  {resident.run}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha de Nacimiento
                </label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                  {format(new Date(resident.birthDate), 'dd MMMM yyyy', { locale: es })}
                </p>
              </div>
              
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
                  Sexo
                </label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white capitalize">
                  {resident.gender}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Fecha de Ingreso
                </label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                  {format(new Date(resident.admissionDate), 'dd MMMM yyyy', { locale: es })}
                </p>
              </div>
            </div>
          </div>

          {/* Guardian Information */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Tutor Responsable
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Nombre
                </label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                  {resident.guardian.name}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Relación
                </label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                  {resident.guardian.relationship}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Teléfono
                </label>
                <p className="mt-1 text-lg text-gray-900 dark:text-white">
                  {resident.guardian.phone}
                </p>
              </div>
            </div>
          </div>

          {/* Functional Status */}
          {resident.functionalStatus.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Estado Funcional
              </h2>
              
              <div className="flex flex-wrap gap-2">
                {resident.functionalStatus.map((status, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                  >
                    {status}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Diagnosis */}
          {resident.clinicalDiagnosis && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Diagnósticos Clínicos
              </h2>
              
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                {resident.clinicalDiagnosis}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Acciones Rápidas
            </h3>
            
            <div className="space-y-3">
              <Link
                to={`/medical-records/${resident.id}`}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Heart className="w-4 h-4 mr-3 text-red-500" />
                Ficha Clínica
              </Link>
              
              <Link
                to={`/care-plans/${resident.id}`}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-3 text-purple-500" />
                Plan de Atención
              </Link>
              
              <Link
                to={`/daily-monitoring/${resident.id}`}
                className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <Activity className="w-4 h-4 mr-3 text-green-500" />
                Monitoreo Diario
              </Link>
            </div>
          </div>

          {/* Files */}
          {resident.files && resident.files.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Documentos ({resident.files.length})
              </h3>
              
              <div className="space-y-3">
                {resident.files.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center flex-1">
                      <FileText className="w-4 h-4 text-gray-400 mr-3" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {file.category.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownloadFile(file)}
                      className="ml-2 p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Descargar"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}