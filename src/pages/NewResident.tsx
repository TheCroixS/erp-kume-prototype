import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, User, FileText, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { db } from '../services/database';
import { useApp } from '../contexts/AppContext';
import { validateRUN, formatRUN, calculateAge, fileToBase64 } from '../utils/validation';
import { ResidentFile } from '../types';
import SpellCheckTextArea from '../components/SpellCheckTextArea';

interface ResidentForm {
  run: string;
  name: string;
  birthDate: string;
  gender: 'masculino' | 'femenino' | 'otro';
  guardian: {
    name: string;
    relationship: string;
    phone: string;
  };
  admissionDate: string;
  functionalStatus: string[];
  clinicalDiagnosis: string;
}

const FUNCTIONAL_STATUS_OPTIONS = [
  'Independiente',
  'Dependencia leve',
  'Dependencia moderada',
  'Dependencia severa',
  'Postrado',
  'Deterioro cognitivo',
  'Demencia',
  'Trastorno psiquiátrico'
];

const FILE_CATEGORIES = [
  { value: 'contrato', label: 'Contrato de Ingreso', icon: '📄' },
  { value: 'consentimiento', label: 'Consentimiento Informado', icon: '✍️' },
  { value: 'entrevista', label: 'Entrevista Inicial', icon: '💬' },
  { value: 'pertenencias', label: 'Listado de Pertenencias', icon: '📋' },
  { value: 'evaluacion', label: 'Evaluaciones Externas', icon: '📊' },
  { value: 'otro', label: 'Otro', icon: '📁' }
];

// Test RUNs for validation (using generic examples)
const testRUNs = [
  '11.111.111-1', // Valid example
  '22.222.222-2', // Valid example
  '12.345.678-5', // Valid example
  '98.765.432-1', // Valid example
];

export default function NewResident() {
  const navigate = useNavigate();
  const { loadResidents } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runError, setRunError] = useState('');
  const [runValid, setRunValid] = useState(false);
  
  const [form, setForm] = useState<ResidentForm>({
    run: '',
    name: '',
    birthDate: '',
    gender: 'masculino',
    guardian: {
      name: '',
      relationship: '',
      phone: ''
    },
    admissionDate: new Date().toISOString().split('T')[0],
    functionalStatus: [],
    clinicalDiagnosis: ''
  });

  const [files, setFiles] = useState<Array<{ file: File; category: string }>>([]);

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('guardian.')) {
      const guardianField = field.split('.')[1];
      setForm(prev => ({
        ...prev,
        guardian: {
          ...prev.guardian,
          [guardianField]: value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleRUNChange = (value: string) => {
    const formattedRUN = formatRUN(value);
    setForm(prev => ({ ...prev, run: formattedRUN }));
    
    if (formattedRUN.length >= 11) {
      if (!validateRUN(formattedRUN)) {
        setRunError('RUN inválido. Verifica el número y dígito verificador.');
        setRunValid(false);
      } else {
        setRunError('');
        setRunValid(true);
      }
    } else if (formattedRUN.length > 0) {
      setRunError('');
      setRunValid(false);
    } else {
      setRunError('');
      setRunValid(false);
    }
  };

  const handleFunctionalStatusChange = (status: string) => {
    setForm(prev => ({
      ...prev,
      functionalStatus: prev.functionalStatus.includes(status)
        ? prev.functionalStatus.filter(s => s !== status)
        : [...prev.functionalStatus, status]
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    const newFiles = selectedFiles.map(file => ({ file, category: 'otro' }));
    setFiles(prev => [...prev, ...newFiles]);
  };

  const updateFileCategory = (index: number, category: string) => {
    setFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, category } : item
    ));
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (runError || !runValid) {
      alert('Por favor ingresa un RUN válido antes de continuar');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert files to the required format
      const residentFiles: ResidentFile[] = await Promise.all(
        files.map(async ({ file, category }) => ({
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type,
          size: file.size,
          data: await fileToBase64(file),
          category: category as any,
          uploadedAt: new Date().toISOString(),
        }))
      );

      // Calculate age
      const age = calculateAge(form.birthDate);

      // Create resident
      await db.createResident({
        ...form,
        age,
        status: 'activo',
        files: residentFiles,
      });

      await loadResidents();
      navigate('/residents');
    } catch (error) {
      console.error('Error creating resident:', error);
      alert('Error al crear el residente. Por favor, intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillTestRUN = () => {
    const testRUN = testRUNs[Math.floor(Math.random() * testRUNs.length)];
    handleRUNChange(testRUN);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/residents')}
          className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Nuevo Residente
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Registra un nuevo residente en el sistema ELEAM
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Información Personal
              </h2>
            </div>
            <button
              type="button"
              onClick={fillTestRUN}
              className="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
            >
              Usar RUN de prueba
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                RUN *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={form.run}
                  onChange={(e) => handleRUNChange(e.target.value)}
                  placeholder="12.345.678-9"
                  className={`w-full px-4 py-3 border rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors ${
                    runError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : runValid 
                      ? 'border-green-500 focus:ring-green-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {runValid && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {runError && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </div>
              {runError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{runError}</p>}
              {runValid && <p className="mt-2 text-sm text-green-600 dark:text-green-400">✓ RUN válido</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Ejemplos válidos: 11.111.111-1, 12.345.678-5, 22.222.222-2
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                spellCheck="true"
                lang="es"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                value={form.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sexo *
              </label>
              <select
                value={form.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              >
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fecha de Ingreso *
              </label>
              <input
                type="date"
                value={form.admissionDate}
                onChange={(e) => handleInputChange('admissionDate', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {/* Guardian Information */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center mr-4">
              <User className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tutor Responsable
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                value={form.guardian.name}
                onChange={(e) => handleInputChange('guardian.name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                spellCheck="true"
                lang="es"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Relación *
              </label>
              <input
                type="text"
                value={form.guardian.relationship}
                onChange={(e) => handleInputChange('guardian.relationship', e.target.value)}
                placeholder="Hijo/a, Cónyuge, etc."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                spellCheck="true"
                lang="es"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                value={form.guardian.phone}
                onChange={(e) => handleInputChange('guardian.phone', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                required
              />
            </div>
          </div>
        </div>

        {/* Functional Status */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Estado Funcional
            </h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {FUNCTIONAL_STATUS_OPTIONS.map((status) => (
              <label key={status} className="flex items-center p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.functionalStatus.includes(status)}
                  onChange={() => handleFunctionalStatusChange(status)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {status}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Clinical Diagnosis */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Diagnósticos Clínicos
            </h2>
          </div>
          
          <SpellCheckTextArea
            value={form.clinicalDiagnosis}
            onChange={(value) => handleInputChange('clinicalDiagnosis', value)}
            placeholder="Describe los diagnósticos clínicos del residente..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            autoCorrect={true}
          />
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            💡 El corrector ortográfico está activado para términos médicos
          </p>
        </div>

        {/* Files */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center mr-4">
              <Upload className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Documentos y Archivos
            </h2>
          </div>
          
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="space-y-2">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-lg font-medium text-gray-900 dark:text-white">
                  Subir archivos
                </span>
                <p className="text-gray-500 dark:text-gray-400">
                  PDF, DOC, DOCX, JPG, PNG hasta 10MB por archivo
                </p>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('file-upload')?.click()}
              className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-blue-600 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-900 transition-colors"
            >
              Seleccionar archivos
            </button>
          </div>

          {files.length > 0 && (
            <div className="mt-8 space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Archivos seleccionados ({files.length})
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {files.map((item, index) => {
                  const category = FILE_CATEGORIES.find(cat => cat.value === item.category);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div className="flex items-center flex-1">
                        <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center mr-4">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="ml-4 flex items-center space-x-3">
                          <select
                            value={item.category}
                            onChange={(e) => updateFileCategory(index, e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {FILE_CATEGORIES.map(cat => (
                              <option key={cat.value} value={cat.value}>
                                {cat.icon} {cat.label}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => navigate('/residents')}
            className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting || !!runError || !runValid}
            className="inline-flex items-center px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors shadow-sm hover:shadow-md"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-3" />
                Crear Residente
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}