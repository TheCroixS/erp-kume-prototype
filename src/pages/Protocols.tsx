import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Download, 
  Eye, 
  Trash2, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  Globe,
  BookOpen,
  X
} from 'lucide-react';
import { db } from '../services/database';
import { fileToBase64, base64ToBlob } from '../utils/validation';

interface ProtocolDocument {
  id: string;
  name: string;
  type: string;
  category: 'ambientes_facilitadores' | 'enfermeria' | 'paliativos' | 'alimentacion' | 'salidas' | 'general' | 'administrativo';
  file: {
    name: string;
    type: string;
    size: number;
    data: string; // base64
  };
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  version?: string;
}

const PROTOCOL_CATEGORIES = [
  { 
    value: 'ambientes_facilitadores', 
    label: 'Ambientes Facilitadores', 
    description: 'Protocolos para espacios seguros y accesibles',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
  },
  { 
    value: 'enfermeria', 
    label: 'Supervisión de Enfermería', 
    description: 'Protocolos de atención de enfermería y cuidados',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
  },
  { 
    value: 'paliativos', 
    label: 'Cuidados Paliativos', 
    description: 'Protocolos especializados en cuidados paliativos',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200'
  },
  { 
    value: 'alimentacion', 
    label: 'Alimentación y Nutrición', 
    description: 'Protocolos de alimentación, dietas y nutrición',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
  },
  { 
    value: 'salidas', 
    label: 'Salidas y Traslados', 
    description: 'Protocolos para salidas, traslados y emergencias',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200'
  },
  { 
    value: 'administrativo', 
    label: 'Administrativo', 
    description: 'Contratos, roles, procedimientos administrativos',
    color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200'
  },
  { 
    value: 'general', 
    label: 'General', 
    description: 'Otros protocolos y documentos institucionales',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }
];

export default function Protocols() {
  const [protocols, setProtocols] = useState<ProtocolDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'general' as any,
    description: '',
    version: '',
    uploadedBy: '',
    file: null as File | null
  });

  useEffect(() => {
    loadProtocols();
  }, []);

  const loadProtocols = async () => {
    try {
      setLoading(true);
      // Load protocols from IndexedDB
      const storedProtocols = await db.getProtocolDocuments();
      setProtocols(storedProtocols || []);
    } catch (error) {
      console.error('Error loading protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Solo se permiten archivos PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('El archivo no puede superar los 10MB');
        return;
      }
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.name || !uploadForm.uploadedBy) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    setUploading(true);
    try {
      const fileData = await fileToBase64(uploadForm.file);
      
      const newProtocol: ProtocolDocument = {
        id: crypto.randomUUID(),
        name: uploadForm.name,
        type: 'document',
        category: uploadForm.category,
        file: {
          name: uploadForm.file.name,
          type: uploadForm.file.type,
          size: uploadForm.file.size,
          data: fileData
        },
        uploadedBy: uploadForm.uploadedBy,
        uploadedAt: new Date().toISOString(),
        description: uploadForm.description,
        version: uploadForm.version
      };

      await db.saveProtocolDocument(newProtocol);
      await loadProtocols();
      
      // Reset form
      setUploadForm({
        name: '',
        category: 'general',
        description: '',
        version: '',
        uploadedBy: '',
        file: null
      });
      setShowUploadForm(false);
      
      alert('Protocolo subido exitosamente');
    } catch (error) {
      console.error('Error uploading protocol:', error);
      alert('Error al subir el protocolo');
    } finally {
      setUploading(false);
    }
  };

  const handleViewProtocol = (protocol: ProtocolDocument) => {
    try {
      const blob = base64ToBlob(protocol.file.data, protocol.file.type);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error('Error opening protocol:', error);
      alert('Error al abrir el protocolo');
    }
  };

  const handleDownloadProtocol = (protocol: ProtocolDocument) => {
    try {
      const blob = base64ToBlob(protocol.file.data, protocol.file.type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = protocol.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading protocol:', error);
      alert('Error al descargar el protocolo');
    }
  };

  const handleDeleteProtocol = async (protocolId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este protocolo?')) return;
    
    try {
      await db.deleteProtocolDocument(protocolId);
      await loadProtocols();
      alert('Protocolo eliminado exitosamente');
    } catch (error) {
      console.error('Error deleting protocol:', error);
      alert('Error al eliminar el protocolo');
    }
  };

  const filteredProtocols = protocols.filter(protocol => 
    selectedCategory === 'all' || protocol.category === selectedCategory
  );

  const getProtocolsByCategory = (category: string) => {
    return protocols.filter(p => p.category === category);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Protocolos y Documentación
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestiona los protocolos institucionales y documentos normativos
          </p>
        </div>
        
        <button
          onClick={() => setShowUploadForm(true)}
          className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors shadow-sm"
        >
          <Upload className="w-5 h-5 mr-2" />
          Subir Protocolo
        </button>
      </div>

      {/* Red ELEAM Recommendation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="ml-4 flex-1">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200">
              Documentación Gratuita - Red ELEAM
            </h3>
            <p className="mt-1 text-blue-700 dark:text-blue-300">
              La Fundación Red ELEAM ofrece documentación gratuita sobre protocolos, contratos, roles y procedimientos para establecimientos de larga estadía para el adulto mayor.
            </p>
            <div className="mt-4">
              <a
                href="https://redeleam.cl/documentos/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
              >
                <Globe className="w-4 h-4 mr-2" />
                Visitar Red ELEAM
                <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Protocolos
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {protocols.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Categorías Activas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Set(protocols.map(p => p.category)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Último Actualizado
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {protocols.length > 0 
                  ? new Date(Math.max(...protocols.map(p => new Date(p.uploadedAt).getTime()))).toLocaleDateString('es-CL')
                  : 'N/A'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Tamaño Total
              </p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {(protocols.reduce((sum, p) => sum + p.file.size, 0) / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Filtrar por Categoría
        </h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            Todas ({protocols.length})
          </button>
          {PROTOCOL_CATEGORIES.map((category) => {
            const count = getProtocolsByCategory(category.value).length;
            return (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category.value
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Protocols Grid */}
      {filteredProtocols.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            {selectedCategory === 'all' ? 'No hay protocolos disponibles' : 'No hay protocolos en esta categoría'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {selectedCategory === 'all' 
              ? 'Sube el primer protocolo para comenzar a organizar la documentación institucional'
              : 'No se han subido protocolos para esta categoría específica'
            }
          </p>
          <button
            onClick={() => setShowUploadForm(true)}
            className="inline-flex items-center px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors shadow-sm"
          >
            <Upload className="w-5 h-5 mr-2" />
            Subir Primer Protocolo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProtocols.map((protocol) => {
            const category = PROTOCOL_CATEGORIES.find(c => c.value === protocol.category);
            
            return (
              <div
                key={protocol.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:scale-105 group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2">
                        {protocol.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {protocol.file.name}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Category Badge */}
                <div className="mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${category?.color || 'bg-gray-100 text-gray-800'}`}>
                    {category?.label || 'General'}
                  </span>
                </div>
                
                {/* Description */}
                {protocol.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                    {protocol.description}
                  </p>
                )}
                
                {/* Metadata */}
                <div className="space-y-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>Tamaño:</span>
                    <span>{(protocol.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Subido por:</span>
                    <span className="font-medium">{protocol.uploadedBy}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Fecha:</span>
                    <span>{new Date(protocol.uploadedAt).toLocaleDateString('es-CL')}</span>
                  </div>
                  {protocol.version && (
                    <div className="flex items-center justify-between">
                      <span>Versión:</span>
                      <span className="font-medium">{protocol.version}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewProtocol(protocol)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        title="Ver protocolo"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadProtocol(protocol)}
                        className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                        title="Descargar"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProtocol(protocol.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <button
                      onClick={() => handleViewProtocol(protocol)}
                      className="text-sm font-medium text-teal-600 dark:text-teal-400 hover:text-teal-500 dark:hover:text-teal-300 transition-colors"
                    >
                      Abrir PDF →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Subir Nuevo Protocolo
                </h3>
                <button
                  onClick={() => setShowUploadForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nombre del Protocolo *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.name}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Ej: Protocolo de Higiene Personal"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Categoría *
                    </label>
                    <select
                      value={uploadForm.category}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {PROTOCOL_CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Versión
                    </label>
                    <input
                      type="text"
                      value={uploadForm.version}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, version: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Ej: v1.0, 2024.1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Subido por *
                    </label>
                    <input
                      type="text"
                      value={uploadForm.uploadedBy}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, uploadedBy: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="Nombre del responsable"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Descripción
                  </label>
                  <textarea
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="Descripción del protocolo y su propósito..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Archivo PDF *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-teal-400 dark:hover:border-teal-500 transition-colors">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <div className="space-y-2">
                      <label htmlFor="protocol-file" className="cursor-pointer">
                        <span className="text-lg font-medium text-gray-900 dark:text-white">
                          {uploadForm.file ? uploadForm.file.name : 'Seleccionar archivo PDF'}
                        </span>
                        <p className="text-gray-500 dark:text-gray-400">
                          Solo archivos PDF, máximo 10MB
                        </p>
                      </label>
                      <input
                        id="protocol-file"
                        name="protocol-file"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => document.getElementById('protocol-file')?.click()}
                      className="mt-4 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-xl text-teal-600 bg-teal-100 hover:bg-teal-200 dark:bg-teal-900/50 dark:text-teal-400 dark:hover:bg-teal-900 transition-colors"
                    >
                      Seleccionar archivo
                    </button>
                    {uploadForm.file && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                          <span className="text-sm text-green-800 dark:text-green-200">
                            Archivo seleccionado: {uploadForm.file.name} ({(uploadForm.file.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setShowUploadForm(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading || !uploadForm.file || !uploadForm.name || !uploadForm.uploadedBy}
                    className="inline-flex items-center px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Subir Protocolo
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}