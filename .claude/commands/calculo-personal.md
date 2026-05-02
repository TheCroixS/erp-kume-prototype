# Calculadora de Personal Requerido — Art. 15-17 Decreto N°20

Calcula la dotación mínima legal de personal según el número y nivel de dependencia de los residentes activos.

## Instrucciones para Claude

Cuando se invoque este skill, obtén el número actual de residentes activos desde la base de datos y calcula:

### Fórmula Legal (Art. 15 — Residentes con Dependencia)

**Turno Diurno (12 horas):**
- 1 cuidador por hasta 8 residentes → mín. 1
- 2 cuidadores para 9-16 residentes
- 3 cuidadores para 17-24 residentes
- Incremento de 1 cuidador por cada 8 residentes adicionales

**Turno Nocturno:**
- 1 cuidador por hasta 12 residentes → mín. 1
- 2 cuidadores para 13-24 residentes
- 3 cuidadores para 25-36 residentes
- Incremento de 1 cuidador por cada 12 residentes adicionales
- **MÍNIMO ABSOLUTO: 2 cuidadores** (Art. 17)

**Auxiliar/Técnico Enfermería:**
- 1 de permanencia 12 horas diurnas
- 1 de llamada en noche (siempre)

### Fórmula Legal (Art. 16 — Residentes Autovalentes)
- 1 cuidador por cada 20 residentes autovalentes (turno diurno, 12h)
- 1 cuidador por cada 20 residentes autovalentes (turno nocturno)
- 1 auxiliar/técnico de enfermería de llamada 24h

### Cálculo Mixto
Si hay residentes con dependencia Y autovalentes, calcular ambos y sumar.

### Output Esperado
Presenta una tabla clara con:
| Turno | Cuidadores Req. | Auxiliar Enf. | Total Personal Mínimo |
|-------|-----------------|---------------|----------------------|
| Diurno | X | 1 | X+1 |
| Nocturno | X | 1 (llamada) | X |

Luego compara contra el personal activo registrado en el módulo de Personal y señala si hay déficit o cumplimiento.

### Notas Importantes
- Los números son MÍNIMOS legales — se recomienda un 20% adicional para cubrir licencias
- El Director Técnico puede acumular el rol de Director Administrativo (Art. 11)
- Registrar siempre el sistema de turnos para inspecciones de la Seremi de Salud
