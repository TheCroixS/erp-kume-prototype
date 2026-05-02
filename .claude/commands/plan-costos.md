# Plan de Costos y Mantenimiento — Küme ERP ELEAM

Analiza y planifica los costos de operación del sistema de bajo costo para ELEAM.

## Instrucciones para Claude

Cuando se invoque, presenta el plan de costos según el modelo actual (PWA offline-first):

## Arquitectura de Bajo Costo Actual

### Infraestructura: $0/mes
- **Base de datos:** IndexedDB local en el navegador (sin servidor)
- **Hosting:** PWA instalable en cualquier dispositivo (sin servidor web)
- **Backups:** Exportación manual a archivo ZIP
- **Sincronización:** Manual vía importar/exportar

### Costo Total Actual: $0 CLP/mes

## Opciones de Escalamiento (según necesidad)

### Opción A — Nube Básica (~$15.000 CLP/mes)
- **Supabase Free Tier:** Base de datos PostgreSQL + Auth + Storage
  - 500 MB base de datos
  - 1 GB storage de archivos
  - 50.000 usuarios activos mensuales
  - SSL incluido
- **Vercel Free Tier:** Hosting del frontend
  - 100 GB bandwidth
  - Despliegue automático desde Git

### Opción B — Nube Intermedia (~$50.000 CLP/mes)
- **Supabase Pro:** $25 USD/mes (base de datos, auth, storage 8 GB)
- **Vercel Pro:** $20 USD/mes (bandwidth ilimitado, equipo)
- Backups automáticos diarios
- Multi-usuario con roles

### Opción C — Auto-hospedado (~$30.000 CLP/mes)
- **VPS en Chile:** Contabo o DigitalOcean (~$15.000 CLP)
- **Supabase Self-hosted:** Gratis (servidor propio)
- **Nginx + SSL (Let's Encrypt):** Gratis
- Control total de datos en Chile (cumplimiento Ley 19.628)

## Costos de Mantenimiento de Software

### Mantenimiento Básico (gratis con Claude Code)
- Corrección de bugs: bajo demanda
- Actualizaciones de dependencias: mensual
- Ajustes por cambios regulatorios: según publicación en BCN

### Desarrollo de Nuevas Funciones
- Estimar 2-4 horas Claude Code por módulo nuevo
- Sin costo adicional de desarrollo si se usa Claude Code

## Costos Legales y Administrativos ELEAM

### Autorización Sanitaria (Art. 5-6)
- Arancel Seremi de Salud: varía por región (~$50.000–200.000 CLP)
- Renovación automática: sin costo adicional (vigencia 3 años)

### Patente Comercial Municipal
- 0,25% a 0,5% del capital declarado
- Consultar municipio específico

### Registro SENAMA
- Sin costo directo (trámite administrativo)

## Recomendación
Para un ELEAM con ≤30 residentes, la Opción A (Supabase + Vercel gratuitos) 
es suficiente y permite multi-usuario con $0/mes hasta escalar.
