# Plan de Mantenimiento y Costos — Küme ERP ELEAM

## Arquitectura Actual (Costo $0/mes)

El sistema usa una arquitectura **offline-first PWA** con IndexedDB para almacenamiento local. No requiere servidores, dominio ni servicios de terceros para funcionar.

## Escenarios de Despliegue

### Escenario 1: Solo Local (Actual) — $0/mes
- **Funciona en:** Un único dispositivo (PC/tablet/smartphone)
- **Datos en:** IndexedDB del navegador
- **Backup:** Exportación manual ZIP (módulo Exportar)
- **Limitación:** No multi-usuario, no acceso remoto

### Escenario 2: Red Local (Recomendado para ELEAM pequeño) — $0/mes
- **Funciona en:** Servidor local (PC antiguo o NUC)
- **Acceso:** Todos los dispositivos de la red WiFi interna
- **Software:** Nginx (gratuito) sirviendo el build estático
- **Backup:** Script automático a disco externo o NAS
- **Costo adicional:** Solo electricidad del servidor (~$2.000 CLP/mes)

### Escenario 3: Nube Básica — $0-15.000 CLP/mes
- **Frontend:** Vercel Free Tier (100GB bandwidth)
- **Backend/BD:** Supabase Free (500MB PostgreSQL + auth)
- **Dominio:** ~$15.000 CLP/año (opcional, usar subdominio gratuito)
- **SSL:** Let's Encrypt (gratuito, incluido en Vercel)
- Requiere migrar de IndexedDB a Supabase (trabajo de desarrollo ~8h)

### Escenario 4: Nube Premium — ~$80.000 CLP/mes
- **Frontend:** Vercel Pro ($20 USD)
- **Backend:** Supabase Pro ($25 USD)
- Multi-usuario con roles y permisos
- Backups automáticos diarios
- SLA 99.9% uptime

## Costos de Mantenimiento de Software

### Actualizaciones de Dependencias (cada 3 meses)
```bash
pnpm outdated    # Ver dependencias desactualizadas
pnpm update      # Actualizar
pnpm build       # Verificar que compila
```
Tiempo estimado: 1-2 horas

### Ajustes por Cambios Regulatorios
- Monitorear: www.leychile.cl (ELEAM Decreto 20)
- Monitorear: www.senama.gob.cl (orientaciones técnicas)
- Tiempo estimado por ajuste: 2-4 horas con Claude Code

### Backup Estrategia Recomendada
- **Diario:** Exportar ZIP desde módulo Exportar (manual)
- **Semanal:** Copiar ZIP a Google Drive/OneDrive (gratuito)
- **Mensual:** Copia física en disco externo del establecimiento
- Tiempo: 5 minutos/día

## Roadmap de Mejoras Sugeridas

### Fase 1 (Actual)
- [x] Módulo Residentes + Fichas Clínicas
- [x] Monitoreo Diario
- [x] Protocolos
- [x] Egresos + Exportar
- [x] Personal
- [x] Reclamos/Sugerencias
- [x] Contratos
- [x] Permisos y Autorizaciones
- [x] Reportes SENAMA

### Fase 2 (Próxima)
- [ ] Módulo de Facturación/Cobranza
- [ ] Notificaciones de vencimiento de permisos
- [ ] Firma digital con CertificaChile
- [ ] Integración con FONASA API (si disponible)

### Fase 3 (Futuro)
- [ ] Multi-establecimiento
- [ ] App móvil nativa (React Native)
- [ ] Telemedicina integrada
- [ ] IA para alertas de salud

## Soporte y Capacitación

### Onboarding Recomendado
1. Instalación del sistema (30 min)
2. Capacitación básica: residentes + fichas (2 horas)
3. Capacitación avanzada: protocolos + reportes (2 horas)
4. Práctica guiada del equipo (1 hora)
**Total: ~5 horas**

### Soporte Continuo
- Manual de usuario: incluido en el sistema
- Documentación técnica: en carpeta `docs/`
- Actualizaciones: mediante Claude Code (sin costo adicional)
