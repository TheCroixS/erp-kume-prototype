import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Plus, User, Calendar, Search, Filter, SortAsc, FileText, Activity, Brain, AlertTriangle } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function MedicalRecords() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'admissionDate' | 'lastUpdate'>('name');

  const filteredResidents = state.residents
    .filter(resident => {
      const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resident.run.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'complete') {
        matchesStatus = !!resident.medicalRecord;
      } else if (statusFilter === 'incomplete') {
        matchesStatus = !resident.medicalRecord;
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'admissionDate':
          return new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime();
        case 'lastUpdate':
          // Sort by medical record update date if available
          const aUpdate = a.medicalRecord ? new Date(a.updatedAt).getTime() : 0;
          const bUpdate = b.medicalRecord ? new Date(b.updatedAt).getTime() : 0;
          return bUpdate - aUpdate;
        default:
          return 0;
      }
    });

  const completeRecords = state.residents.filter(r => r.medicalRecord).length;
  const incompleteRecords = state.residents.length - completeRecords;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Fichas Clínicas
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestiona la información médica completa de todos los residentes
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {completeRecords} Completas
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {incompleteRecords} Pendientes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre o RUN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="all">Todas las fichas</option>
              <option value="complete">Solo completas</option>
              <option value="incomplete">Solo pendientes</option>
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SortAsc className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="name">Ordenar por nombre</option>
              <option value="admissionDate">Ordenar por ingreso</option>
              <option value="lastUpdate">Ordenar por actualización</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {searchTerm && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Se encontraron <strong>{filteredResidents.length}</strong> ficha(s) que coinciden con "{searchTerm}"
          </p>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Fichas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.residents.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {completeRecords}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pendientes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {incompleteRecords}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                % Completitud
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {state.residents.length > 0 ? Math.round((completeRecords / state.residents.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Residents Grid */}
      {filteredResidents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No se encontraron fichas clínicas' : 'No hay residentes registrados'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchTerm 
              ? 'Intenta modificar los términos de búsqueda o ajustar los filtros'
              : 'Primero debes registrar residentes para crear sus fichas clínicas'
            }
          </p>
          {!searchTerm && (
            <Link
              to="/residents/new"
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm"
            >
              <Plus className="w-5 h-5 mr-2" />
              Registrar Primer Residente
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResidents.map((resident) => (
            <Link
              key={resident.id}
              to={`/medical-records/${resident.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:scale-105 group"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    resident.medicalRecord 
                      ? 'bg-red-100 dark:bg-red-900/50' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <Heart className={`w-7 h-7 ${
                      resident.medicalRecord
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {resident.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      RUN: {resident.run}
                    </p>
                  </div>
                </div>
                
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  resident.medicalRecord
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                    : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                }`}>
                  {resident.medicalRecord ? 'Completa' : 'Pendiente'}
                </span>
              </div>
              
              {/* Info Grid */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium mr-2">Edad:</span>
                  <span>{resident.age} años • {resident.gender}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium mr-2">Ingreso:</span>
                  <span>{format(new Date(resident.admissionDate), 'dd MMM yyyy', { locale: es })}</span>
                </div>
                
                {resident.functionalStatus.length > 0 && (
                  <div className="flex items-start text-sm text-gray-600 dark:text-gray-400">
                    <Brain className="w-4 h-4 mr-3 text-gray-400 mt-0.5" />
                    <div>
                      <span className="font-medium">Estado funcional:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {resident.functionalStatus.slice(0, 2).map((status, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
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
                )}
              </div>

              {/* Medical Record Status */}
              {resident.medicalRecord && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-800 dark:text-green-200 font-medium">
                      Ficha clínica disponible
                    </span>
                    <div className="flex items-center space-x-2">
                      <Activity className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <Brain className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {resident.medicalRecord ? 'Ver y editar ficha' : 'Crear ficha clínica'}
                  </div>
                  
                  <span className="text-sm font-medium text-red-600 dark:text-red-400 group-hover:text-red-500 dark:group-hover:text-red-300 transition-colors">
                    {resident.medicalRecord ? 'Abrir ficha' : 'Crear ficha'} →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}