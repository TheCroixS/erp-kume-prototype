import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Activity, 
  Plus, 
  User, 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Search,
  Filter,
  SortAsc,
  TrendingUp,
  Heart,
  Thermometer,
  Pill,
  Utensils,
  Users,
  Eye,
  FileText,
  BarChart3
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/database';
import { format, isToday, isYesterday, differenceInHours } from 'date-fns';
import { es } from 'date-fns/locale';

interface ResidentMonitoringData {
  resident: any;
  lastRecord?: any;
  todayRecord?: any;
  yesterdayRecord?: any;
  hoursSinceLastRecord: number;
  riskLevel: 'bajo' | 'medio' | 'alto';
  alerts: string[];
  completionPercentage: number;
}

export default function DailyMonitoring() {
  const { state } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | 'bajo' | 'medio' | 'alto'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'risk' | 'lastRecord' | 'completion'>('risk');
  const [monitoringData, setMonitoringData] = useState<ResidentMonitoringData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShift, setSelectedShift] = useState<'all' | 'mañana' | 'tarde' | 'noche'>('all');

  useEffect(() => {
    loadMonitoringData();
  }, [state.residents, selectedDate]);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      const data = await Promise.all(
        state.residents
          .filter(r => r.status === 'activo')
          .map(async (resident) => {
            // Get recent records
            const records = await db.getDailyRecordsByResident(resident.id);
            const todayRecord = records.find(r => r.date === selectedDate);
            const yesterdayRecord = records.find(r => {
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              return r.date === yesterday.toISOString().split('T')[0];
            });
            const lastRecord = records[0]; // Most recent

            // Calculate hours since last record
            const hoursSinceLastRecord = lastRecord 
              ? differenceInHours(new Date(), new Date(lastRecord.recordedAt))
              : 999;

            // Assess risk level
            const riskLevel = assessRiskLevel(resident, todayRecord, hoursSinceLastRecord);
            
            // Generate alerts
            const alerts = generateAlerts(resident, todayRecord, hoursSinceLastRecord);
            
            // Calculate completion percentage
            const completionPercentage = calculateCompletionPercentage(todayRecord);

            return {
              resident,
              lastRecord,
              todayRecord,
              yesterdayRecord,
              hoursSinceLastRecord,
              riskLevel,
              alerts,
              completionPercentage
            };
          })
      );
      
      setMonitoringData(data);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assessRiskLevel = (resident: any, todayRecord: any, hoursSinceLastRecord: number): 'bajo' | 'medio' | 'alto' => {
    let riskScore = 0;

    // Time since last record
    if (hoursSinceLastRecord > 48) riskScore += 3;
    else if (hoursSinceLastRecord > 24) riskScore += 2;
    else if (hoursSinceLastRecord > 12) riskScore += 1;

    // Functional status
    const highRiskStatuses = ['Dependencia severa', 'Postrado', 'Demencia'];
    if (resident.functionalStatus.some((status: string) => highRiskStatuses.includes(status))) {
      riskScore += 2;
    }

    // Age factor
    if (resident.age > 85) riskScore += 1;

    // Today's record quality
    if (!todayRecord) riskScore += 2;
    else if (todayRecord.incidents?.length > 0) riskScore += 2;

    if (riskScore >= 5) return 'alto';
    if (riskScore >= 3) return 'medio';
    return 'bajo';
  };

  const generateAlerts = (resident: any, todayRecord: any, hoursSinceLastRecord: number): string[] => {
    const alerts: string[] = [];

    if (hoursSinceLastRecord > 48) {
      alerts.push('Sin registros por más de 48 horas');
    } else if (hoursSinceLastRecord > 24) {
      alerts.push('Sin registros por más de 24 horas');
    }

    if (!todayRecord) {
      alerts.push('Sin registro del día actual');
    } else {
      if (todayRecord.incidents?.length > 0) {
        alerts.push(`${todayRecord.incidents.length} incidente(s) reportado(s)`);
      }
      
      if (todayRecord.vitalSigns?.morning?.alertValues || 
          todayRecord.vitalSigns?.afternoon?.alertValues || 
          todayRecord.vitalSigns?.evening?.alertValues) {
        alerts.push('Signos vitales alterados');
      }

      if (todayRecord.qualityIndicators?.fallRisk === 'alto') {
        alerts.push('Alto riesgo de caídas');
      }

      if (todayRecord.painAssessment?.hasPain && todayRecord.painAssessment?.intensity > 7) {
        alerts.push('Dolor severo reportado');
      }
    }

    return alerts;
  };

  const calculateCompletionPercentage = (record: any): number => {
    if (!record) return 0;

    const sections = [
      'vitalSigns',
      'hygiene',
      'nutrition',
      'mobility',
      'physicalAssessment',
      'mentalState',
      'generalObservations'
    ];

    let completedSections = 0;
    sections.forEach(section => {
      if (record[section] && Object.keys(record[section]).length > 0) {
        completedSections++;
      }
    });

    return Math.round((completedSections / sections.length) * 100);
  };

  const filteredData = monitoringData
    .filter(item => {
      const matchesSearch = item.resident.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.resident.run.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRisk = riskFilter === 'all' || item.riskLevel === riskFilter;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.resident.name.localeCompare(b.resident.name);
        case 'risk':
          const riskOrder = { 'alto': 3, 'medio': 2, 'bajo': 1 };
          return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
        case 'lastRecord':
          return b.hoursSinceLastRecord - a.hoursSinceLastRecord;
        case 'completion':
          return b.completionPercentage - a.completionPercentage;
        default:
          return 0;
      }
    });

  const stats = {
    total: monitoringData.length,
    withTodayRecord: monitoringData.filter(item => item.todayRecord).length,
    highRisk: monitoringData.filter(item => item.riskLevel === 'alto').length,
    withAlerts: monitoringData.filter(item => item.alerts.length > 0).length,
    avgCompletion: monitoringData.length > 0 
      ? Math.round(monitoringData.reduce((sum, item) => sum + item.completionPercentage, 0) / monitoringData.length)
      : 0
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Monitoreo Diario Integral
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sistema avanzado de seguimiento y registro de actividades diarias
          </p>
          <div className="mt-3 flex items-center space-x-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.withTodayRecord} con registro hoy
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.highRisk} alto riesgo
              </span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-gray-600 dark:text-gray-400">
                {stats.avgCompletion}% completitud promedio
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <Link
            to="/daily-monitoring/analytics"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analíticas
          </Link>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Residentes
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.total}
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
                Con Registro Hoy
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.withTodayRecord}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Alto Riesgo
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.highRisk}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Con Alertas
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.withAlerts}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Completitud
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.avgCompletion}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar residente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Risk Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as any)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los riesgos</option>
              <option value="alto">Alto riesgo</option>
              <option value="medio">Riesgo medio</option>
              <option value="bajo">Bajo riesgo</option>
            </select>
          </div>

          {/* Shift Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as any)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos los turnos</option>
              <option value="mañana">Turno Mañana</option>
              <option value="tarde">Turno Tarde</option>
              <option value="noche">Turno Noche</option>
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
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="risk">Ordenar por riesgo</option>
              <option value="name">Ordenar por nombre</option>
              <option value="lastRecord">Último registro</option>
              <option value="completion">Completitud</option>
            </select>
          </div>
        </div>
      </div>

      {/* High Priority Alerts */}
      {stats.highRisk > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-start">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 mt-1" />
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                Atención Prioritaria Requerida
              </h3>
              <p className="mt-1 text-red-700 dark:text-red-300">
                {stats.highRisk} residente(s) requieren atención inmediata por alto riesgo.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {filteredData
                  .filter(item => item.riskLevel === 'alto')
                  .slice(0, 5)
                  .map((item) => (
                    <Link
                      key={item.resident.id}
                      to={`/daily-monitoring/${item.resident.id}`}
                      className="inline-flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-full text-sm font-medium hover:bg-red-200 dark:hover:bg-red-900 transition-colors"
                    >
                      {item.resident.name}
                    </Link>
                  ))}
                {filteredData.filter(item => item.riskLevel === 'alto').length > 5 && (
                  <span className="inline-flex items-center px-3 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-full text-sm font-medium">
                    +{filteredData.filter(item => item.riskLevel === 'alto').length - 5} más
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Residents Grid */}
      {filteredData.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Activity className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
            {searchTerm ? 'No se encontraron residentes' : 'No hay residentes activos'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {searchTerm 
              ? 'Intenta modificar los términos de búsqueda o ajustar los filtros'
              : 'Primero debes registrar residentes activos para realizar el monitoreo diario'
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
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredData.map((item) => (
            <div
              key={item.resident.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200 hover:scale-105 group ${
                item.riskLevel === 'alto' 
                  ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/10' 
                  : item.riskLevel === 'medio'
                  ? 'border-yellow-300 dark:border-yellow-600'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    item.riskLevel === 'alto' 
                      ? 'bg-red-100 dark:bg-red-900/50' 
                      : item.riskLevel === 'medio'
                      ? 'bg-yellow-100 dark:bg-yellow-900/50'
                      : 'bg-green-100 dark:bg-green-900/50'
                  }`}>
                    <User className={`w-7 h-7 ${
                      item.riskLevel === 'alto'
                        ? 'text-red-600 dark:text-red-400'
                        : item.riskLevel === 'medio'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`} />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                      {item.resident.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      RUN: {item.resident.run}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    item.riskLevel === 'alto'
                      ? 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'
                      : item.riskLevel === 'medio'
                      ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200'
                      : 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200'
                  }`}>
                    {item.riskLevel === 'alto' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {item.riskLevel === 'medio' && <Clock className="w-3 h-3 mr-1" />}
                    {item.riskLevel === 'bajo' && <CheckCircle className="w-3 h-3 mr-1" />}
                    {item.riskLevel.charAt(0).toUpperCase() + item.riskLevel.slice(1)} riesgo
                  </span>
                  
                  {item.completionPercentage > 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                      {item.completionPercentage}% completo
                    </span>
                  )}
                </div>
              </div>
              
              {/* Progress Bar */}
              {item.completionPercentage > 0 && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Progreso del día</span>
                    <span className="font-medium text-gray-900 dark:text-white">{item.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        item.completionPercentage >= 80 
                          ? 'bg-green-600' 
                          : item.completionPercentage >= 50 
                          ? 'bg-yellow-600' 
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${item.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Status Indicators */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium mr-2">Edad:</span>
                  <span>{item.resident.age} años</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-3 text-gray-400" />
                  <span className="font-medium mr-2">Último registro:</span>
                  <span>
                    {item.hoursSinceLastRecord < 24 
                      ? `Hace ${item.hoursSinceLastRecord}h`
                      : `Hace ${Math.floor(item.hoursSinceLastRecord / 24)}d`
                    }
                  </span>
                </div>

                {item.todayRecord && (
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Thermometer className="w-4 h-4 text-red-500 mb-1" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Vitales</span>
                      <span className={`text-xs font-medium ${
                        item.todayRecord.vitalSigns ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {item.todayRecord.vitalSigns ? '✓' : '○'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Utensils className="w-4 h-4 text-orange-500 mb-1" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Nutrición</span>
                      <span className={`text-xs font-medium ${
                        item.todayRecord.nutrition ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {item.todayRecord.nutrition ? '✓' : '○'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Pill className="w-4 h-4 text-blue-500 mb-1" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Medicación</span>
                      <span className={`text-xs font-medium ${
                        item.todayRecord.medication?.length > 0 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {item.todayRecord.medication?.length > 0 ? '✓' : '○'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <Heart className="w-4 h-4 text-purple-500 mb-1" />
                      <span className="text-xs text-gray-600 dark:text-gray-400">Actividades</span>
                      <span className={`text-xs font-medium ${
                        item.todayRecord.activities?.length > 0 ? 'text-green-600' : 'text-gray-400'
                      }`}>
                        {item.todayRecord.activities?.length > 0 ? '✓' : '○'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Alerts */}
              {item.alerts.length > 0 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2" />
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                        Alertas ({item.alerts.length})
                      </h4>
                      <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                        {item.alerts.slice(0, 2).map((alert, index) => (
                          <li key={index}>• {alert}</li>
                        ))}
                        {item.alerts.length > 2 && (
                          <li>• +{item.alerts.length - 2} alertas más</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/daily-monitoring/${item.resident.id}/view`}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      title="Ver historial"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/medical-records/${item.resident.id}`}
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                      title="Ficha clínica"
                    >
                      <FileText className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  <Link
                    to={`/daily-monitoring/${item.resident.id}`}
                    className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                  >
                    {item.todayRecord ? 'Actualizar' : 'Registrar'}
                    <Activity className="w-4 h-4 ml-2" />
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