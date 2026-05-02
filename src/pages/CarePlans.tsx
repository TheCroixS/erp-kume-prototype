import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Plus, 
  User, 
  Calendar, 
  CheckCircle, 
  AlertTriangle,
  Target,
  Clock,
  Search,
  Filter,
  SortAsc,
  Eye,
  Edit,
  TrendingUp,
  Users,
  Activity
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CarePlans() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'complete' | 'incomplete' | 'signed'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'createdDate' | 'progress'>('name');
  const [carePlansData, setCarePlansData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCarePlansData = async () => {
      try {
        const plansData = await Promise.all(
          state.residents.map(async (resident) => {
            const carePlans = await db.getCarePlansByResident(resident.id);
            const latestPlan = carePlans.length > 0 
              ? carePlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
              : null;
            
            let progress = 0;
            if (latestPlan?.objectives?.length > 0) {
              const completed = latestPlan.objectives.filter(o => o.status === 'completado').length;
              progress = Math.round((completed / latestPlan.objectives.length) * 100);
            }

            return {
              resident,
              latestPlan,
              progress,
              hasSignatures: !!(latestPlan?.residentSignature && latestPlan?.directorSignature),
              objectivesCount: latestPlan?.objectives?.length || 0,
              lastUpdate: latestPlan?.updatedAt || resident.createdAt
            };
          })
        );
        
        setCarePlansData(plansData);
      } catch (error) {
        console.error('Error loading care plans data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCarePlansData();
  }, [state.residents]);

  const filteredPlans = carePlansData
    .filter(item => {
      const matchesSearch = item.resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.resident.run.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesStatus = true;
      if (statusFilter === 'complete') {
        matchesStatus = !!item.latestPlan;
      } else if (statusFilter === 'incomplete') {
        matchesStatus = !item.latestPlan;
      } else if (statusFilter === 'signed') {
        matchesStatus = item.hasSignatures;
      }
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.resident.name.localeCompare(b.resident.name);
        case 'createdDate':
          return new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime();
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

  const stats = {
    total: state.residents.length,
    withPlans: carePlansData.filter(item => item.latestPlan).length,
    signed: carePlansData.filter(item => item.hasSignatures).length,
    avgProgress: carePlansData.length > 0 
      ? Math.round(carePlansData.reduce((sum, item) => sum + item.progress, 0) / carePlansData.length)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Planes de Atención Integral (PAI)
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Gestiona los planes de atención personalizados para cada residente
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.withPlans} con PAI
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.signed} firmados
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.avgProgress}% progreso promedio
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total PAI
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.withPlans}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Firmados
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.signed}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Progreso Promedio
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.avgProgress}%
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
                {stats.total - stats.withPlans}
              </p>
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="complete">Con PAI creado</option>
              <option value="incomplete">Sin PAI</option>
              <option value="signed">Firmados</option>
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="name">Ordenar por nombre</option>
              <option value="createdDate">Ordenar por fecha</option>
              <option value="progress">Ordenar por progreso</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      {searchTerm && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <p className="text-purple-800 dark:text-purple-200">
            Se encontraron <strong>{filteredPlans.length}</strong> plan(es) que coinciden con "{searchTerm}"
          </p>
        </div>
      )}

      {/* Plans Grid */}
      {filteredPlans.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No se encontraron planes' : 'No hay residentes registrados'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchTerm 
              ? 'Intenta modificar los términos de búsqueda o ajustar los filtros'
              : 'Primero debes registrar residentes para crear sus planes de atención'
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
          {filteredPlans.map((item) => (
            <Link
              key={item.resident.id}
              to={`/care-plans/${item.resident.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-all duration-200 hover:scale-105 group"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    item.latestPlan 
                      ? 'bg-purple-100 dark:bg-purple-900/50' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}>
                    <FileText className={`w-7 h-7 ${
                      item.latestPlan
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {item.resident.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      RUN: {item.resident.run}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.latestPlan
                      ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                      : 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                  }`}>
                    {item.latestPlan ? 'PAI creado' : 'Pendiente'}
                  </span>
                  
                  {item.hasSignatures && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Firmado
                    </span>
                  )}
                </div>
              </div>
              
              {/* Info Grid */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium mr-2">Edad:</span>
                  <span>{item.resident.age} años • {item.resident.gender}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium mr-2">Ingreso:</span>
                  <span>{format(new Date(item.resident.admissionDate), 'dd MMM yyyy', { locale: es })}</span>
                </div>
                
                {item.latestPlan && (
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                    <Target className="w-4 h-4 mr-3 text-gray-400" />
                    <span className="font-medium mr-2">Objetivos:</span>
                    <span>{item.objectivesCount}</span>
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              {item.latestPlan && item.progress > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Progreso</span>
                    <span className="font-medium text-gray-900 dark:text-white">{item.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Status Indicators */}
              <div className="flex flex-wrap gap-2 mb-4">
                {item.latestPlan && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200">
                    <Activity className="w-3 h-3 mr-1" />
                    Actualizado {format(new Date(item.lastUpdate), 'dd MMM', { locale: es })}
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {item.latestPlan ? 'Ver y editar PAI' : 'Crear PAI'}
                    </div>
                  </div>
                  
                  <span className="text-sm font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-500 dark:group-hover:text-purple-300 transition-colors">
                    {item.latestPlan ? 'Abrir PAI' : 'Crear PAI'} →
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