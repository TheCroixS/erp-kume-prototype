import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, User, Calendar, FileText, Edit, Eye, Phone, MapPin, Filter, SortAsc } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Residents() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'activo' | 'egresado'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'admissionDate' | 'age'>('name');

  const filteredResidents = state.residents
    .filter(resident => {
      const matchesSearch = resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           resident.run.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || resident.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'admissionDate':
          return new Date(b.admissionDate).getTime() - new Date(a.admissionDate).getTime();
        case 'age':
          return b.age - a.age;
        default:
          return 0;
      }
    });

  const activeCount = state.residents.filter(r => r.status === 'activo').length;
  const egressedCount = state.residents.filter(r => r.status === 'egresado').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gestión de Residentes
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Administra la información de todos los residentes del establecimiento
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {activeCount} Activos
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {egressedCount} Egresados
              </span>
            </div>
          </div>
        </div>
        <Link
          to="/residents/new"
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Residente
        </Link>
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="activo">Solo activos</option>
              <option value="egresado">Solo egresados</option>
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="name">Ordenar por nombre</option>
              <option value="admissionDate">Ordenar por ingreso</option>
              <option value="age">Ordenar por edad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {searchTerm && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200">
            Se encontraron <strong>{filteredResidents.length}</strong> residente(s) que coinciden con "{searchTerm}"
          </p>
        </div>
      )}

      {/* Residents Grid */}
      {filteredResidents.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No se encontraron residentes' : 'No hay residentes registrados'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchTerm 
              ? 'Intenta modificar los términos de búsqueda o ajustar los filtros'
              : 'Comienza registrando el primer residente del establecimiento para empezar a gestionar su información'
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
            <div
              key={resident.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:scale-105 group"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    resident.status === 'activo' 
                      ? 'bg-blue-100 dark:bg-blue-900/50' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <User className={`w-7 h-7 ${
                      resident.status === 'activo'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {resident.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      RUN: {resident.run}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    resident.status === 'activo'
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  }`}>
                    {resident.status === 'activo' ? 'Activo' : 'Egresado'}
                  </span>
                </div>
              </div>
              
              {/* Info Grid */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium mr-2">Edad:</span>
                  <span>{resident.age} años • {resident.gender}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium mr-2">Ingreso:</span>
                  <span>{format(new Date(resident.admissionDate), 'dd MMM yyyy', { locale: es })}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium mr-2">Tutor:</span>
                  <span className="truncate">{resident.guardian.name}</span>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex flex-wrap gap-2 mb-4">
                {resident.files && resident.files.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                    <FileText className="w-3 h-3 mr-1" />
                    {resident.files.length} archivo(s)
                  </span>
                )}
                {resident.medicalRecord && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200">
                    Ficha médica
                  </span>
                )}
                {resident.carePlan && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                    PAI
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/residents/${resident.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/medical-records/${resident.id}`}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Ficha clínica"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <Link
                    to={`/residents/${resident.id}`}
                    className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                  >
                    Ver detalles →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}