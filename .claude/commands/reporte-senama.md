# Generador de Reporte Trimestral SENAMA — Art. 12 t Decreto N°20

Genera el reporte trimestral que debe enviarse al Servicio Nacional del Adulto Mayor.

## Instrucciones para Claude

Cuando se invoque, recopila datos del sistema y genera el reporte estructurado:

### Datos del Establecimiento
- Nombre del establecimiento
- RUT del titular/representante legal
- Dirección
- N° de autorización sanitaria y fecha
- Nombre del Director Técnico
- Número de cupos autorizados

### Sección 1: Identificación de Residentes
Para cada residente activo registrar:
- RUN
- Nombre completo
- Edad y género
- Fecha de ingreso
- Nivel de dependencia (funcional, cognitiva, nutricional)
- Sistema previsional de salud
- Si recibe beneficio de programa social del Estado

### Sección 2: Identificación de Trabajadores
Para cada trabajador activo registrar:
- RUN
- Nombre completo
- Cargo/rol
- Tipo de contrato
- Horario/turno
- Certificaciones relevantes

### Sección 3: Indicadores de Atención
- N° de ingresos en el trimestre
- N° de egresos en el trimestre (por tipo: voluntario, traslado, fallecimiento)
- N° de incidentes registrados
- N° de hospitalizaciones
- Actividades comunitarias realizadas

### Sección 4: Protocolos y Planes
- Estado de los protocolos obligatorios
- Capacitaciones realizadas (horas totales)
- Estado del plan de integración socio-comunitaria

## Output Esperado
Genera el reporte en formato estructurado listo para:
1. Exportar como JSON/CSV para el portal SENAMA
2. Imprimir como documento formal
3. Adjuntar en carpeta del establecimiento

## Trimestres
- T1: Enero-Marzo (enviar antes del 15 de abril)
- T2: Abril-Junio (enviar antes del 15 de julio)  
- T3: Julio-Septiembre (enviar antes del 15 de octubre)
- T4: Octubre-Diciembre (enviar antes del 15 de enero)

## Notas
El SENAMA define el medio específico para el reporte (portal web, formulario, etc.).
Consultar: www.senama.gob.cl
