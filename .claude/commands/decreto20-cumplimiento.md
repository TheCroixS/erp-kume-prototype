# Checklist de Cumplimiento — Decreto N°20 ELEAM

Revisa el estado actual del sistema y del establecimiento contra los requisitos del Decreto N°20 del Ministerio de Salud (vigente desde 01/10/2025).

## Instrucciones para Claude

Cuando se invoque este comando, realiza una auditoría de cumplimiento del Decreto N°20 verificando:

### TÍTULO II — Autorización Sanitaria (Art. 5-7)
- [ ] ¿Existe autorización sanitaria vigente registrada en el módulo de Permisos?
- [ ] ¿El permiso tiene fecha de vencimiento y está dentro de los 3 años de vigencia?
- [ ] ¿Están cargados los documentos de respaldo (planos, certificados, etc.)?
- [ ] ¿Está registrado el Director Técnico con sus credenciales?

### TÍTULO III — Infraestructura (Art. 8-10)
- [ ] ¿Están registradas las condiciones de infraestructura en el sistema?
- [ ] ¿Hay protocolo de emergencias actualizado?
- [ ] ¿Existe certificado contra incendios vigente?

### TÍTULO IV — Personal (Art. 11-21)
- [ ] ¿Están registrados todos los trabajadores en el módulo de Personal?
- [ ] ¿La proporción de cuidadores cumple con Art. 15-17?
  - Turno diurno: 1 cuidador por cada 8 residentes con dependencia
  - Turno nocturno: 1 cuidador por cada 12 residentes con dependencia
  - Mínimo nocturno: 2 cuidadores siempre
- [ ] ¿El Director Técnico tiene título del área salud/social (≥8 semestres)?
- [ ] ¿Está registrado el plan de capacitación anual (mínimo 22 horas)?
- [ ] ¿Los auxiliares/técnicos de enfermería tienen certificados vigentes?

### TÍTULO V — Funcionamiento (Art. 22-26)
- [ ] ¿Todos los residentes tienen consentimiento voluntario de ingreso firmado?
- [ ] ¿Todos los residentes tienen evaluación geriátrica (Katz, Barthel, Pfeiffer)?
- [ ] ¿Existe protocolo de ingreso y egreso actualizado?
- [ ] ¿Hay protocolo de urgencias médicas?
- [ ] ¿Hay protocolo de fallecimiento de residentes?

### TÍTULO VI — Registros (Art. 27-30)
- [ ] ¿Existe reglamento interno publicado en lugar visible?
- [ ] ¿Todos los residentes tienen contrato firmado?
- [ ] ¿El libro de reclamos/sugerencias está activo y accesible?
- [ ] ¿Las carpetas personales de residentes están actualizadas?
- [ ] ¿Los medicamentos están correctamente registrados con recetas?

### REPORTES SENAMA (Art. 12 t)
- [ ] ¿Se han enviado reportes trimestrales al SENAMA?
- [ ] ¿El último reporte fue dentro del trimestre actual?

## Output Esperado
Genera una tabla con: Requisito | Estado | Observación | Acción Requerida

Verifica contra los datos reales en la base de datos IndexedDB usando los módulos disponibles.
