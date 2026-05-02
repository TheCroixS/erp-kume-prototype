import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LogOut, User, Calendar, FileText, Download, AlertTriangle,
  Eye, Search, Filter, Package, Printer, ChevronDown, ChevronUp
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { db } from '../services/database';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const REASON_LABELS: Record<string, string> = {
  alta_medica: 'Alta médica',
  fallecimiento: 'Fallecimiento',
  traslado: 'Traslado a otro centro',
  decision_familiar: 'Decisión familiar',
  hospitalizacion: 'Hospitalización',
  voluntario: 'Retiro voluntario',
  otro: 'Otro',
};

const REASON_COLORS: Record<string, string> = {
  alta_medica: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
  fallecimiento: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  traslado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
  decision_familiar: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
  hospitalizacion: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200',
  voluntario: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-200',
  otro: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const BELONGINGS_ITEMS = [
  'Ropa personal', 'Calzado', 'Artículos de higiene personal',
  'Documentos de identidad', 'Medicamentos personales', 'Objetos de valor',
  'Equipos médicos propios', 'Material de lectura / esparcimiento', 'Otros objetos personales',
];

const INPUT = 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500';
const LABEL = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export default function Egress() {
  const { state, loadResidents } = useApp();

  // Form state
  const [selectedResident, setSelectedResident] = useState('');
  const [egressReason, setEgressReason] = useState('');
  const [destination, setDestination] = useState('');
  const [destinationContact, setDestinationContact] = useState('');
  const [egressReport, setEgressReport] = useState('');
  const [medicalSummary, setMedicalSummary] = useState('');
  const [conditionAtEgress, setConditionAtEgress] = useState('');
  const [belongingsChecklist, setBelongingsChecklist] = useState<Record<string, boolean>>({});
  const [belongingsNotes, setBelongingsNotes] = useState('');
  const [responsiblePerson, setResponsiblePerson] = useState('');
  const [responsibleRelation, setResponsibleRelation] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // List filters
  const [searchTerm, setSearchTerm] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeResidents = state.residents.filter(r => r.status === 'activo');
  const egressedResidents = state.residents.filter(r => r.status === 'egresado');

  const filteredEgressed = egressedResidents.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.run.toLowerCase().includes(searchTerm.toLowerCase());
    const matchReason = reasonFilter === 'all' || r.egressReason === reasonFilter;
    return matchSearch && matchReason;
  });

  const thisMonth = egressedResidents.filter(r => {
    if (!r.egressDate) return false;
    return new Date(r.egressDate).getMonth() === new Date().getMonth() &&
           new Date(r.egressDate).getFullYear() === new Date().getFullYear();
  }).length;

  const handleEgress = async () => {
    if (!selectedResident || !egressReason) return;
    setProcessing(true);
    try {
      const belongingsStr = Object.entries(belongingsChecklist)
        .filter(([, v]) => v).map(([k]) => k).join(', ');

      const fullReport = [
        egressReport && `INFORME FINAL:\n${egressReport}`,
        medicalSummary && `RESUMEN MÉDICO AL EGRESO:\n${medicalSummary}`,
        conditionAtEgress && `CONDICIÓN AL EGRESO:\n${conditionAtEgress}`,
        destination && `DESTINO:\n${destination}${destinationContact ? ` — Contacto: ${destinationContact}` : ''}`,
        responsiblePerson && `RESPONSABLE RETIRO:\n${responsiblePerson}${responsibleRelation ? ` (${responsibleRelation})` : ''}`,
        belongingsStr && `PERTENENCIAS ENTREGADAS:\n${belongingsStr}`,
        belongingsNotes && `NOTAS PERTENENCIAS:\n${belongingsNotes}`,
      ].filter(Boolean).join('\n\n');

      await db.updateResident(selectedResident, {
        status: 'egresado',
        egressDate: new Date().toISOString(),
        egressReason,
        egressReport: fullReport,
      });
      await db.addAuditLog({
        action: 'egress',
        entity: 'resident',
        entityId: selectedResident,
        entityName: activeResidents.find(r => r.id === selectedResident)?.name || '',
        performedBy: responsiblePerson || 'Sistema',
        summary: `Egreso: ${REASON_LABELS[egressReason] || egressReason}`,
      });
      await loadResidents();
      // Reset
      setSelectedResident(''); setEgressReason(''); setDestination('');
      setDestinationContact(''); setEgressReport(''); setMedicalSummary('');
      setConditionAtEgress(''); setBelongingsChecklist({}); setBelongingsNotes('');
      setResponsiblePerson(''); setResponsibleRelation(''); setShowForm(false);
    } catch {
      alert('Error al procesar el egreso');
    } finally { setProcessing(false); }
  };

  const handleExport = async (residentId: string) => {
    try {
      const r = await db.getResident(residentId);
      if (!r) return;
      const blob = await db.exportResidentData(residentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `egreso_${r.name.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { alert('Error al exportar datos'); }
  };

  const toggleBelonging = (item: string) => {
    setBelongingsChecklist(prev => ({ ...prev, [item]: !prev[item] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Egresos</h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">Procesa egresos y genera informes finales — Art. 23-24</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-xl transition-colors shadow-sm">
          <LogOut className="w-4 h-4 mr-2" />{showForm ? 'Ocultar Formulario' : 'Nuevo Egreso'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Activos', value: activeResidents.length, icon: User, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Total Egresados', value: egressedResidents.length, icon: LogOut, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-700/50' },
          { label: 'Este Mes', value: thisMonth, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Con Informe', value: egressedResidents.filter(r => r.egressReport).length, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <s.icon className={`w-6 h-6 ${s.color} shrink-0`} />
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Egress Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <LogOut className="w-5 h-5 text-orange-500" />Procesar Nuevo Egreso
          </h2>

          {activeResidents.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No hay residentes activos para egresar.</p>
          ) : (
            <>
              {/* Row 1 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Residente *</label>
                  <select value={selectedResident} onChange={e => setSelectedResident(e.target.value)} className={INPUT} required>
                    <option value="">Seleccionar...</option>
                    {activeResidents.map(r => <option key={r.id} value={r.id}>{r.name} — {r.run}</option>)}
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Motivo del Egreso *</label>
                  <select value={egressReason} onChange={e => setEgressReason(e.target.value)} className={INPUT} required>
                    <option value="">Seleccionar...</option>
                    {Object.entries(REASON_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 2 — Destination */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Destino al egreso</label>
                  <input className={INPUT} value={destination} onChange={e => setDestination(e.target.value)} placeholder="Ej: Domicilio familiar, Hospital X, ELEAM Y..." />
                </div>
                <div>
                  <label className={LABEL}>Contacto en destino</label>
                  <input className={INPUT} value={destinationContact} onChange={e => setDestinationContact(e.target.value)} placeholder="Nombre y teléfono" />
                </div>
              </div>

              {/* Row 3 — Responsible */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Responsable del retiro</label>
                  <input className={INPUT} value={responsiblePerson} onChange={e => setResponsiblePerson(e.target.value)} placeholder="Nombre completo" />
                </div>
                <div>
                  <label className={LABEL}>Relación con el residente</label>
                  <input className={INPUT} value={responsibleRelation} onChange={e => setResponsibleRelation(e.target.value)} placeholder="Hijo/a, cónyuge, apoderado..." />
                </div>
              </div>

              {/* Condition and Medical Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={LABEL}>Condición al egreso</label>
                  <select value={conditionAtEgress} onChange={e => setConditionAtEgress(e.target.value)} className={INPUT}>
                    <option value="">Seleccionar...</option>
                    <option value="Estable">Estable</option>
                    <option value="Mejorado">Mejorado</option>
                    <option value="Sin cambios">Sin cambios</option>
                    <option value="Deteriorado">Deteriorado</option>
                    <option value="Crítico">Crítico</option>
                    <option value="Fallecido">Fallecido</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL}>Resumen médico al egreso</label>
                  <textarea rows={3} className={INPUT} value={medicalSummary} onChange={e => setMedicalSummary(e.target.value)} placeholder="Diagnósticos activos, medicamentos, indicaciones al alta..." />
                </div>
              </div>

              {/* Belongings checklist */}
              <div>
                <label className={LABEL}>Pertenencias entregadas</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                  {BELONGINGS_ITEMS.map(item => (
                    <label key={item} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer">
                      <input type="checkbox" checked={!!belongingsChecklist[item]} onChange={() => toggleBelonging(item)} className="rounded text-orange-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                    </label>
                  ))}
                </div>
                <div className="mt-2">
                  <label className={LABEL}>Notas sobre pertenencias</label>
                  <input className={INPUT} value={belongingsNotes} onChange={e => setBelongingsNotes(e.target.value)} placeholder="Observaciones adicionales..." />
                </div>
              </div>

              {/* Report */}
              <div>
                <label className={LABEL}>Informe final del residente</label>
                <textarea rows={5} className={INPUT} value={egressReport} onChange={e => setEgressReport(e.target.value)} placeholder="Evolución durante la estadía, logros, recomendaciones para continuidad de cuidados..." />
              </div>

              <div className="flex justify-end gap-3">
                <button onClick={() => setShowForm(false)} className="px-5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  Cancelar
                </button>
                <button onClick={handleEgress} disabled={processing || !selectedResident || !egressReason}
                  className="inline-flex items-center px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 text-white font-medium rounded-xl transition-colors">
                  {processing ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />Procesando...</> : <><LogOut className="w-4 h-4 mr-2" />Confirmar Egreso</>}
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Egressed list */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Residentes Egresados ({egressedResidents.length})</h2>
        </div>

        {egressedResidents.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Buscar..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select value={reasonFilter} onChange={e => setReasonFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="all">Todos los motivos</option>
                {Object.entries(REASON_LABELS).map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
        )}

        {filteredEgressed.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-2" />
            <p>{egressedResidents.length === 0 ? 'No hay residentes egresados' : 'Sin resultados para esta búsqueda'}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEgressed.map(resident => (
              <div key={resident.id} className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{resident.name}</p>
                      <p className="text-sm text-gray-500">{resident.run}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${resident.egressReason ? REASON_COLORS[resident.egressReason] || 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'}`}>
                      {resident.egressReason ? REASON_LABELS[resident.egressReason] || resident.egressReason : 'Sin especificar'}
                    </span>
                    {resident.egressDate && <span className="text-xs text-gray-500 hidden sm:block">{format(new Date(resident.egressDate), 'dd MMM yyyy', { locale: es })}</span>}
                    <button onClick={() => setExpandedId(expandedId === resident.id ? null : resident.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                      {expandedId === resident.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                    </button>
                  </div>
                </div>

                {expandedId === resident.id && (
                  <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700/30 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div><span className="text-gray-500">Edad:</span> <span className="font-medium text-gray-900 dark:text-white">{resident.age} años</span></div>
                      <div><span className="text-gray-500">Ingreso:</span> <span className="font-medium text-gray-900 dark:text-white">{format(new Date(resident.admissionDate), 'dd/MM/yyyy')}</span></div>
                      {resident.egressDate && <div><span className="text-gray-500">Egreso:</span> <span className="font-medium text-gray-900 dark:text-white">{format(new Date(resident.egressDate), 'dd/MM/yyyy')}</span></div>}
                      <div><span className="text-gray-500">Estadía:</span> <span className="font-medium text-gray-900 dark:text-white">
                        {Math.ceil((new Date(resident.egressDate || Date.now()).getTime() - new Date(resident.admissionDate).getTime()) / 86400000)} días
                      </span></div>
                    </div>
                    {resident.egressReport && (
                      <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Informe de Egreso</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{resident.egressReport}</p>
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <Link to={`/residents/${resident.id}`} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors">
                        <Eye className="w-4 h-4" />Ver perfil
                      </Link>
                      <button onClick={() => handleExport(resident.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                        <Download className="w-4 h-4" />Exportar datos
                      </button>
                      <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-white dark:hover:bg-gray-700 transition-colors">
                        <Printer className="w-4 h-4" />Imprimir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
