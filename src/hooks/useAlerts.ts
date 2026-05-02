import { useState, useEffect, useCallback } from 'react';
import { db } from '../services/database';
import { differenceInDays, parseISO } from 'date-fns';

export type AlertLevel = 'critical' | 'warning' | 'info';

export interface SystemAlert {
  id: string;
  level: AlertLevel;
  title: string;
  description: string;
  href: string;
  category: 'permits' | 'staff' | 'contracts' | 'medications';
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const newAlerts: SystemAlert[] = [];
    const today = new Date();

    try {
      // ── Permisos vencidos/por vencer ──
      const permits = await db.getPermits();
      for (const p of permits) {
        if (!p.expiresAt) continue;
        const days = differenceInDays(parseISO(p.expiresAt), today);
        if (days < 0) {
          newAlerts.push({ id: `permit-${p.id}`, level: 'critical', title: `Permiso VENCIDO: ${p.name}`, description: `Venció hace ${Math.abs(days)} día(s). Requiere renovación inmediata.`, href: '/permits', category: 'permits' });
        } else if (days <= (p.alertDaysBefore || 60)) {
          newAlerts.push({ id: `permit-${p.id}`, level: days <= 15 ? 'critical' : 'warning', title: `Permiso por vencer: ${p.name}`, description: `Vence en ${days} día(s) el ${new Date(p.expiresAt).toLocaleDateString('es-CL')}.`, href: '/permits', category: 'permits' });
        }
      }

      // ── Contratos sin firma / sin contrato ──
      const [contracts, residents] = await Promise.all([db.getContracts(), db.getResidents()]);
      const activeContracts = contracts.filter(c => c.status === 'activo');
      for (const r of residents) {
        const hasContract = activeContracts.some(c => c.residentId === r.id);
        if (!hasContract) {
          newAlerts.push({ id: `contract-${r.id}`, level: 'warning', title: `Sin contrato: ${r.name}`, description: 'El residente no tiene un contrato activo (Art. 28 Decreto N°20).', href: '/contracts', category: 'contracts' });
        }
      }
      // Contratos sin firma del representante
      for (const c of activeContracts) {
        if (!c.representativeSignature) {
          const res = residents.find(r => r.id === c.residentId);
          newAlerts.push({ id: `sig-${c.id}`, level: 'info', title: `Firma pendiente: ${res?.name || c.residentId}`, description: 'El contrato no tiene firma del representante legal.', href: '/contracts', category: 'contracts' });
        }
      }

      // ── Certificaciones de personal por vencer ──
      const staff = await db.getStaff(true);
      for (const s of staff) {
        for (const cert of (s.certifications || [])) {
          if (!cert.expiresAt) continue;
          const days = differenceInDays(parseISO(cert.expiresAt), today);
          if (days < 0) {
            newAlerts.push({ id: `cert-${cert.id}`, level: 'critical', title: `Certificación VENCIDA: ${s.name}`, description: `${cert.name} venció hace ${Math.abs(days)} día(s).`, href: '/staff', category: 'staff' });
          } else if (days <= 30) {
            newAlerts.push({ id: `cert-${cert.id}`, level: 'warning', title: `Certificación por vencer: ${s.name}`, description: `${cert.name} vence en ${days} día(s).`, href: '/staff', category: 'staff' });
          }
        }
        // Capacitaciones < 22 horas (exigencia del decreto)
        const totalHours = (s.training || []).reduce((sum, t) => sum + t.hours, 0);
        if (totalHours < 22) {
          newAlerts.push({ id: `train-${s.id}`, level: 'info', title: `Capacitación insuficiente: ${s.name}`, description: `Tiene ${totalHours}h de capacitación. El mínimo requerido es 22h (Art. 20).`, href: '/staff', category: 'staff' });
        }
      }

      // ── Stock crítico de medicamentos ──
      const stock = await db.getMedicationStock();
      for (const item of stock) {
        if (item.currentStock <= item.minStock) {
          newAlerts.push({ id: `stock-${item.id}`, level: item.currentStock === 0 ? 'critical' : 'warning', title: `Stock crítico: ${item.medicationName}`, description: `${item.residentName}: ${item.currentStock} ${item.unit}(s) restante(s).`, href: '/medications', category: 'medications' });
        }
      }
    } catch (e) {
      // silently ignore db errors
    }

    setAlerts(newAlerts);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const criticalCount = alerts.filter(a => a.level === 'critical').length;
  const warningCount = alerts.filter(a => a.level === 'warning').length;

  return { alerts, loading, refresh, criticalCount, warningCount };
}
