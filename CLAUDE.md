# Küme — ERP Social para ELEAM

## Descripción del Proyecto
Sistema de gestión integral para Establecimientos de Larga Estadía para Personas Mayores (ELEAM), regulado por el **Decreto N°20 del Ministerio de Salud (2021)**, vigente desde el 1 de octubre de 2025.

**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + IndexedDB (PWA offline-first)

## Módulos del Sistema

| Módulo | Ruta | Decreto |
|--------|------|---------|
| Dashboard | `/` | General |
| Residentes | `/residents` | Art. 2, 23 |
| Fichas Clínicas | `/medical-records` | Art. 12 b,j |
| Planes de Atención | `/care-plans` | Art. 12 f, 25 |
| Monitoreo Diario | `/daily-monitoring` | Art. 12 j |
| Protocolos | `/protocols` | Art. 25 |
| Personal | `/staff` | Art. 11–21 |
| Reclamos/Sugerencias | `/complaints` | Art. 29 b |
| Contratos | `/contracts` | Art. 28 |
| Permisos y Patentes | `/permits` | Art. 5–7 |
| Reportes SENAMA | `/senama-report` | Art. 12 t |
| Egresos | `/egress` | Art. 23, 24 |
| Exportar Datos | `/export` | General |

## Base de Datos (IndexedDB)
- **Nombre:** `ELEAMSaltoAngelDB`
- **Versión actual:** 5
- **Stores:** residents, medicalRecords, carePlans, dailyRecords, protocols, protocolExecutions, protocolDocuments, staff, complaints, contracts, permits, backups

## Tipos de Dependencia (Decreto N°20, Art. 4 h)
Clasificados según orientaciones técnicas del Ministerio de Salud.

## Proporciones de Personal Obligatorias (Art. 15–17)
- **Turno diurno:** 1 cuidador por cada 8 residentes con dependencia
- **Turno nocturno:** 1 cuidador por cada 12 residentes con dependencia
- **Autovalentes:** 1 cuidador por cada 20 residentes (diurno y nocturno)
- **Mínimo nocturno:** 2 cuidadores independiente del número de residentes
- **Auxiliar/técnico enfermería:** 12 horas diurnas de permanencia + 1 de llamada nocturna

## Reportes SENAMA
Deben enviarse **trimestralmente** (Art. 12 t) con:
- Información administrativa del establecimiento
- Identificación de residentes y trabajadores

## Comandos de Desarrollo
```bash
pnpm dev      # Servidor de desarrollo
pnpm build    # Build de producción
pnpm preview  # Preview del build
```

## Skills Disponibles (/.claude/commands/)
- `/decreto20-cumplimiento` — Checklist de cumplimiento del Decreto N°20
- `/calculo-personal` — Cálculo de personal requerido por ley
- `/reporte-senama` — Generador de reporte trimestral SENAMA
- `/plan-costos` — Plan de costos y mantenimiento
- `/plan-marketing` — Estrategia de marketing para ELEAM
- `/tramites-gobierno` — Guía de trámites con gobierno/municipio
- `/patente-funcionamiento` — Guía para obtener patente de funcionamiento
- `/agregar-modulo` — Guía para agregar nuevo módulo al ERP

## Convenciones de Código
- Idioma de UI: Español chileno
- Formato fechas: `dd/MM/yyyy` (es-CL)
- RUT con formato: `12.345.678-9`
- Todos los componentes en TypeScript estricto
- Estilos con Tailwind CSS + clases dark mode
