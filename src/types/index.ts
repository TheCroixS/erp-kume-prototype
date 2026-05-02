export interface Resident {
  id: string;
  run: string;
  name: string;
  birthDate: string;
  age: number;
  gender: 'masculino' | 'femenino' | 'otro';
  guardian: {
    name: string;
    relationship: string;
    phone: string;
  };
  admissionDate: string;
  functionalStatus: string[];
  clinicalDiagnosis: string;
  status: 'activo' | 'egresado';
  egressDate?: string;
  egressReason?: string;
  egressReport?: string;
  createdAt: string;
  updatedAt: string;
  files: ResidentFile[];
  medicalRecord?: MedicalRecord;
  carePlan?: CarePlan;
  // Evaluaciones funcionales al ingreso
  admissionEvaluations?: {
    katz: KatzEvaluation;
    barthel: BarthelEvaluation;
    pfeiffer: PfeifferEvaluation;
    evaluatedAt: string;
    evaluatedBy: string;
  };
}

export interface ResidentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  data: string; // base64 encoded
  category: 'contrato' | 'consentimiento' | 'entrevista' | 'pertenencias' | 'evaluacion' | 'otro';
  uploadedAt: string;
}

export interface MedicalRecord {
  id: string;
  residentId: string;
  medications: Medication[];
  allergies: string[];
  evaluations: {
    katz: KatzEvaluation;
    barthel: BarthelEvaluation;
    pfeiffer: PfeifferEvaluation;
  };
  vitalSigns: VitalSign[];
  nutritionalAssessment: NutritionalAssessment;
  medicalHistory: MedicalHistory;
  physicalExam: PhysicalExam;
  labResults: LabResult[];
  updatedAt: string;
}

export interface MedicalHistory {
  personalHistory: string;
  familyHistory: string;
  surgicalHistory: string;
  currentMedications: string;
  hospitalizations: string;
  chronicDiseases: string[];
  updatedAt: string;
}

export interface PhysicalExam {
  generalAppearance: string;
  cardiovascular: string;
  respiratory: string;
  neurological: string;
  musculoskeletal: string;
  skin: string;
  observations: string;
  examinedBy: string;
  examDate: string;
}

export interface LabResult {
  id: string;
  testName: string;
  result: string;
  normalRange: string;
  date: string;
  orderedBy: string;
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dose: string;
  frequency: string;
  schedule: string;
  indication: string;
  prescribedBy: string;
  startDate: string;
  endDate?: string;
  active: boolean;
}

export interface KatzEvaluation {
  bathing: number; // 0 = Dependiente, 1 = Independiente
  dressing: number;
  toileting: number;
  transferring: number;
  continence: number;
  feeding: number;
  total: number;
  interpretation: 'independiente' | 'dependencia_leve' | 'dependencia_moderada' | 'dependencia_severa';
  evaluatedAt: string;
  evaluatedBy: string;
  observations?: string;
}

export interface BarthelEvaluation {
  feeding: number; // 0, 5, 10
  bathing: number; // 0, 5
  grooming: number; // 0, 5
  dressing: number; // 0, 5, 10
  bowels: number; // 0, 5, 10
  bladder: number; // 0, 5, 10
  toilet: number; // 0, 5, 10
  transfers: number; // 0, 5, 10, 15
  mobility: number; // 0, 5, 10, 15
  stairs: number; // 0, 5, 10
  total: number;
  interpretation: 'independiente' | 'dependencia_leve' | 'dependencia_moderada' | 'dependencia_severa' | 'dependencia_total';
  evaluatedAt: string;
  evaluatedBy: string;
  observations?: string;
}

export interface PfeifferEvaluation {
  questions: {
    date: number; // 0 = Correcto, 1 = Incorrecto
    dayOfWeek: number;
    place: number;
    phoneNumber: number;
    age: number;
    birthDate: number;
    currentPresident: number;
    previousPresident: number;
    mothersMaidenName: number;
    subtraction: number;
  };
  errors: number;
  deteriorationLevel: 'normal' | 'leve' | 'moderado' | 'severo';
  evaluatedAt: string;
  evaluatedBy: string;
  observations?: string;
}

export interface VitalSign {
  id: string;
  date: string;
  time: string;
  temperature?: number;
  bloodPressure?: string;
  pulse?: number;
  glucose?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  recordedBy: string;
  observations?: string;
}

export interface NutritionalAssessment {
  swallowingDiagnosis: string;
  recommendedConsistency: 'normal' | 'papilla' | 'licuado' | 'espesado';
  feedingType: 'oral' | 'sonda' | 'mixta';
  nutritionistComments: string;
  dietaryRestrictions: string[];
  supplements: string[];
  updatedAt: string;
  updatedBy: string;
}

export interface CarePlan {
  id: string;
  residentId: string;
  generalDiagnosis: {
    biomedical: string;
    functional: string;
    mental: string;
    social: string;
  };
  objectives: CareObjective[];
  residentSignature?: string;
  directorSignature?: string;
  createdAt: string;
  updatedAt: string;
  lastReviewDate?: string;
  nextReviewDate?: string;
}

export interface CareObjective {
  id: string;
  area: 'biomedica' | 'funcional' | 'social' | 'mental';
  description: string;
  activities: string[];
  periodicity: string;
  responsible: string;
  status: 'activo' | 'completado' | 'suspendido';
}

// Enhanced Daily Record interfaces
export interface DailyRecord {
  id: string;
  residentId: string;
  date: string;
  shift: 'mañana' | 'tarde' | 'noche';
  recordedBy: string;
  recordedAt: string;
  
  // Core monitoring areas
  vitalSigns: DailyVitalSigns;
  hygiene: HygieneRecord;
  nutrition: NutritionRecord;
  mobility: MobilityRecord;
  medication: MedicationAdministration[];
  activities: DailyActivity[];
  incidents: IncidentRecord[];
  
  // Assessment and observations
  physicalAssessment: PhysicalAssessment;
  mentalState: MentalStateAssessment;
  socialInteraction: SocialInteractionRecord;
  painAssessment: PainAssessment;
  
  // General observations and notes
  generalObservations: string;
  familyContact: FamilyContactRecord[];
  
  // Quality indicators
  qualityIndicators: QualityIndicators;
  
  // Validation and approval
  supervisorReview?: {
    reviewedBy: string;
    reviewedAt: string;
    approved: boolean;
    comments?: string;
  };
}

export interface DailyVitalSigns {
  morning?: VitalSignReading;
  afternoon?: VitalSignReading;
  evening?: VitalSignReading;
  notes: string;
}

export interface VitalSignReading {
  time: string;
  temperature?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  pulse?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  glucose?: number;
  weight?: number;
  recordedBy: string;
  alertValues: boolean;
  observations?: string;
}

export interface HygieneRecord {
  personalHygiene: {
    completed: boolean;
    type: 'ducha_completa' | 'aseo_parcial' | 'aseo_cama' | 'higiene_oral';
    assistance: 'independiente' | 'supervision' | 'asistencia_parcial' | 'asistencia_total';
    time: string;
    observations: string;
  };
  oralHygiene: {
    completed: boolean;
    method: 'cepillado' | 'enjuague' | 'limpieza_protesis';
    assistance: 'independiente' | 'supervision' | 'asistencia_total';
    observations: string;
  };
  continence: {
    bladderControl: 'continente' | 'incontinente' | 'sonda' | 'pañal';
    bowelControl: 'continente' | 'incontinente' | 'ostomia';
    diaperChanges: DiaperChange[];
    observations: string;
  };
}

export interface DiaperChange {
  time: string;
  type: 'orina' | 'deposicion' | 'mixto' | 'limpio';
  skinCondition: 'normal' | 'enrojecimiento' | 'lesion' | 'ulcera';
  products: string[];
  performedBy: string;
  observations: string;
}

export interface NutritionRecord {
  meals: {
    breakfast: MealRecord;
    lunch: MealRecord;
    dinner: MealRecord;
    snacks: MealRecord[];
  };
  hydration: {
    totalIntake: number; // ml
    fluidType: string[];
    assistance: 'independiente' | 'supervision' | 'asistencia_parcial' | 'asistencia_total';
    observations: string;
  };
  supplements: {
    administered: boolean;
    type: string[];
    time: string[];
    observations: string;
  };
  swallowing: {
    difficulty: boolean;
    consistency: 'normal' | 'papilla' | 'licuado' | 'espesado';
    aspiration: boolean;
    observations: string;
  };
}

export interface MealRecord {
  time: string;
  menu: string;
  amountConsumed: number; // percentage 0-100
  consistency: 'normal' | 'papilla' | 'licuado' | 'picado';
  assistance: 'independiente' | 'supervision' | 'asistencia_parcial' | 'asistencia_total' | 'sonda';
  appetite: 'bueno' | 'regular' | 'malo' | 'rechaza';
  observations: string;
}

export interface MobilityRecord {
  transfers: {
    bedToChair: 'independiente' | 'supervision' | 'asistencia_1_persona' | 'asistencia_2_personas' | 'mecanica';
    walking: 'independiente' | 'baston' | 'andador' | 'silla_ruedas' | 'no_deambula';
    stairs: 'independiente' | 'supervision' | 'asistencia' | 'no_aplica';
    observations: string;
  };
  positioning: {
    changes: number;
    positions: string[];
    pressureRelief: boolean;
    observations: string;
  };
  exercise: {
    participated: boolean;
    type: string[];
    duration: string;
    tolerance: 'buena' | 'regular' | 'mala';
    observations: string;
  };
}

export interface MedicationAdministration {
  medicationId: string;
  medicationName: string;
  dose: string;
  route: 'oral' | 'sublingual' | 'topica' | 'intravenosa' | 'intramuscular' | 'subcutanea' | 'rectal' | 'inhalatoria';
  scheduledTime: string;
  actualTime?: string;
  administered: boolean;
  administeredBy: string;
  reason?: string; // if not administered
  sideEffects: boolean;
  observations: string;
}

export interface DailyActivity {
  type: 'recreativa' | 'terapeutica' | 'social' | 'cognitiva' | 'fisica' | 'espiritual';
  name: string;
  startTime: string;
  endTime: string;
  participation: 'activa' | 'pasiva' | 'rechaza' | 'no_participa';
  mood: 'alegre' | 'tranquilo' | 'ansioso' | 'triste' | 'agresivo' | 'confuso';
  socialInteraction: 'buena' | 'regular' | 'limitada' | 'nula';
  observations: string;
}

export interface IncidentRecord {
  id: string;
  time: string;
  type: 'caida' | 'lesion' | 'confusion' | 'agitacion' | 'fuga' | 'medicacion' | 'otro';
  severity: 'leve' | 'moderado' | 'grave';
  description: string;
  location: string;
  witnesses: string[];
  actionsTaken: string[];
  familyNotified: boolean;
  doctorNotified: boolean;
  reportedBy: string;
  followUp: string;
}

export interface PhysicalAssessment {
  skin: {
    integrity: 'intacta' | 'lesiones_menores' | 'ulceras_presion' | 'heridas';
    color: 'normal' | 'palida' | 'cianotica' | 'ictérica';
    temperature: 'normal' | 'caliente' | 'fria';
    hydration: 'normal' | 'seca' | 'edematosa';
    observations: string;
  };
  respiratory: {
    pattern: 'normal' | 'taquipnea' | 'bradipnea' | 'disnea' | 'irregular';
    sounds: 'normales' | 'roncus' | 'sibilancias' | 'crepitos' | 'disminuidos';
    cough: boolean;
    secretions: boolean;
    observations: string;
  };
  cardiovascular: {
    rhythm: 'regular' | 'irregular' | 'taquicardia' | 'bradicardia';
    edema: boolean;
    edemaLocation: string[];
    perfusion: 'buena' | 'regular' | 'mala';
    observations: string;
  };
  neurological: {
    consciousness: 'alerta' | 'somnoliento' | 'estuporoso' | 'comatoso';
    orientation: 'orientado' | 'desorientado_tiempo' | 'desorientado_espacio' | 'desorientado_persona';
    speech: 'normal' | 'disartria' | 'afasia' | 'mutismo';
    mobility: 'normal' | 'limitada' | 'hemiparesia' | 'hemiplejia' | 'tetraplejia';
    observations: string;
  };
}

export interface MentalStateAssessment {
  mood: 'estable' | 'alegre' | 'triste' | 'ansioso' | 'irritable' | 'apatico';
  behavior: 'cooperativo' | 'agitado' | 'agresivo' | 'retraido' | 'confuso';
  cognition: 'normal' | 'confusion_leve' | 'confusion_moderada' | 'confusion_severa';
  sleep: {
    nightSleep: 'bueno' | 'intermitente' | 'insomnio' | 'hipersomnia';
    naps: boolean;
    sleepAids: boolean;
    observations: string;
  };
  communication: {
    verbal: 'normal' | 'limitada' | 'no_verbal';
    comprehension: 'buena' | 'regular' | 'limitada';
    expression: 'clara' | 'confusa' | 'incoherente';
    observations: string;
  };
}

export interface SocialInteractionRecord {
  familyVisits: {
    received: boolean;
    visitors: string[];
    duration: string;
    mood: 'positiva' | 'neutral' | 'negativa';
    observations: string;
  };
  peerInteraction: {
    participated: boolean;
    quality: 'buena' | 'regular' | 'conflictiva' | 'aislado';
    observations: string;
  };
  staffInteraction: {
    cooperative: boolean;
    communication: 'fluida' | 'limitada' | 'dificil';
    observations: string;
  };
}

export interface PainAssessment {
  hasPain: boolean;
  location: string[];
  intensity: number; // 0-10 scale
  character: 'punzante' | 'sordo' | 'quemante' | 'pulsatil' | 'colico';
  triggers: string[];
  relief: string[];
  medication: boolean;
  observations: string;
}

export interface FamilyContactRecord {
  time: string;
  contactType: 'visita' | 'llamada' | 'mensaje';
  contactPerson: string;
  relationship: string;
  purpose: string;
  information: string;
  concerns: string[];
  followUp: string;
}

export interface QualityIndicators {
  fallRisk: 'bajo' | 'medio' | 'alto';
  pressureUlcerRisk: 'bajo' | 'medio' | 'alto';
  nutritionalRisk: 'bajo' | 'medio' | 'alto';
  infectionRisk: 'bajo' | 'medio' | 'alto';
  depressionRisk: 'bajo' | 'medio' | 'alto';
  cognitiveDecline: 'estable' | 'leve' | 'moderado' | 'severo';
  functionalDecline: 'estable' | 'leve' | 'moderado' | 'severo';
  overallWellbeing: 'excelente' | 'bueno' | 'regular' | 'malo';
}

// ─── STAFF (Art. 11-21 Decreto N°20) ───────────────────────────────────────

export type StaffRole =
  | 'director_tecnico'
  | 'director_administrativo'
  | 'auxiliar_enfermeria'
  | 'tecnico_enfermeria'
  | 'cuidador'
  | 'manipulador_alimentos'
  | 'auxiliar_aseo'
  | 'otro';

export interface StaffMember {
  id: string;
  run: string;
  name: string;
  role: StaffRole;
  professionalTitle?: string;
  specialization?: string;
  phone: string;
  email?: string;
  contractType: 'planta' | 'contrata' | 'honorarios' | 'reemplazo';
  startDate: string;
  endDate?: string;
  schedule: {
    hoursPerWeek: number;
    shifts: StaffShift[];
  };
  training: TrainingRecord[];
  certifications: StaffCertification[];
  active: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffShift {
  id: string;
  type: 'mañana' | 'tarde' | 'noche';
  days: string[];
  startTime: string;
  endTime: string;
}

export interface TrainingRecord {
  id: string;
  courseName: string;
  hours: number;
  completedAt: string;
  certifiedBy: string;
  observations?: string;
}

export interface StaffCertification {
  id: string;
  name: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  documentNumber?: string;
}

// ─── COMPLAINTS (Art. 29 b Decreto N°20) ───────────────────────────────────

export type ComplaintType = 'reclamo' | 'sugerencia' | 'felicitacion';
export type ComplaintStatus = 'pendiente' | 'en_proceso' | 'resuelto' | 'cerrado';
export type ComplaintCategory =
  | 'atencion_personal'
  | 'alimentacion'
  | 'infraestructura'
  | 'medicacion'
  | 'higiene'
  | 'actividades'
  | 'administracion'
  | 'otro';

export interface ComplaintRecord {
  id: string;
  folio: number;
  type: ComplaintType;
  submittedBy: 'residente' | 'familiar' | 'visita' | 'anonimo';
  submitterName: string;
  submitterRelationship?: string;
  residentId?: string;
  date: string;
  category: ComplaintCategory;
  description: string;
  status: ComplaintStatus;
  response?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── CONTRACTS (Art. 28 Decreto N°20) ──────────────────────────────────────

export interface ResidentContract {
  id: string;
  residentId: string;
  contractDate: string;
  monthlyFee: number;
  paymentDay: number;
  currency: 'CLP';
  includes: string[];
  additionalServices: {
    name: string;
    monthlyCost: number;
  }[];
  emergencyContacts: {
    id: string;
    name: string;
    relationship: string;
    phone: string;
    email?: string;
    address: string;
  }[];
  exitCauses: string[];
  obligations: {
    establishment: string[];
    resident: string[];
  };
  status: 'activo' | 'terminado' | 'suspendido';
  terminationDate?: string;
  terminationReason?: string;
  residentSignature?: string;
  representativeSignature?: string;
  directorSignature?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── OPERATING PERMITS (Art. 5-7 Decreto N°20) ─────────────────────────────

export type PermitType =
  | 'autorizacion_sanitaria'
  | 'patente_comercial'
  | 'certificado_incendios'
  | 'certificado_instalaciones_electricas'
  | 'certificado_gas'
  | 'certificado_agua_potable'
  | 'certificado_recepcion_final'
  | 'autorizacion_cocina'
  | 'otro';

export type PermitStatus = 'vigente' | 'por_vencer' | 'vencido' | 'en_tramite' | 'no_aplica';

export interface OperatingPermit {
  id: string;
  type: PermitType;
  name: string;
  permitNumber?: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  status: PermitStatus;
  autoRenew: boolean;
  alertDaysBefore: number;
  notes?: string;
  documentName?: string;
  documentData?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── MEDICATIONS MODULE (Art. 12 b) ────────────────────────────────────────

export type MedRoute = 'oral' | 'sublingual' | 'topica' | 'inhalatoria' | 'subcutanea' | 'intramuscular' | 'rectal' | 'oftalmica' | 'otica';

export interface MedicationScheduleRecord {
  id: string;
  residentId: string;
  residentName: string;
  medicationName: string;
  dose: string;
  route: MedRoute;
  scheduledTime: string;
  date: string;
  administered: boolean;
  administeredAt?: string;
  administeredBy?: string;
  skipped: boolean;
  skipReason?: string;
  sideEffects?: string;
  observations?: string;
  createdAt: string;
}

export interface MedicationStockItem {
  id: string;
  residentId: string;
  residentName: string;
  medicationName: string;
  currentStock: number;
  minStock: number;
  unit: string;
  lastRestockedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── AUDIT LOG ─────────────────────────────────────────────────────────────

export type AuditAction = 'create' | 'update' | 'delete' | 'export' | 'egress';
export type AuditEntity = 'resident' | 'medicalRecord' | 'carePlan' | 'dailyRecord' | 'staff' | 'complaint' | 'contract' | 'permit' | 'medication' | 'protocol';

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName: string;
  performedBy: string;
  performedAt: string;
  summary: string;
}

// ─── INSTITUTIONAL PROFILE (Art. 1-4, 8, 30) ──────────────────────────────

export type EleamType = 'residencia_adulto_mayor' | 'hogar_adulto_mayor' | 'centro_dia' | 'otro';

export interface InstitutionalSeal {
  id: string;
  name: string;
  issuedBy: string;
  issuedAt: string;
  expiresAt?: string;
  description: string;
}

export interface InstitutionalProfile {
  id: string;
  establishmentName: string;
  legalName: string;
  rut: string;
  eleamType: EleamType;
  maxCapacity: number;
  address: string;
  commune: string;
  region: string;
  phone: string;
  email: string;
  website?: string;
  directorName: string;
  directorRun: string;
  directorTitle: string;
  foundingDate?: string;
  vision: string;
  mission: string;
  values: string[];
  seals: InstitutionalSeal[];
  internalRegulation?: string;
  updatedAt: string;
}

// ─── RESOURCES (Art. 9-10) ──────────────────────────────────────────────────

export type ResourceCategory = 'infraestructura' | 'equipamiento_medico' | 'mobiliario' | 'insumos' | 'vehiculo' | 'otro';
export type ResourceCondition = 'bueno' | 'regular' | 'malo' | 'en_reparacion' | 'dado_de_baja';

export interface ResourceItem {
  id: string;
  category: ResourceCategory;
  name: string;
  description?: string;
  quantity: number;
  unit: string;
  condition: ResourceCondition;
  location: string;
  acquisitionDate?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  supplier?: string;
  serialNumber?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── VISITOR LOG (Art. 23) ──────────────────────────────────────────────────

export interface VisitorEntry {
  id: string;
  residentId: string;
  residentName: string;
  visitorName: string;
  visitorRun?: string;
  visitorPhone?: string;
  relationship: string;
  date: string;
  entryTime: string;
  exitTime?: string;
  purpose: string;
  authorizedBy?: string;
  observations?: string;
  createdAt: string;
}

// ─── INCIDENT REPORTS (Art. 12 k) ──────────────────────────────────────────

export type IncidentReportType = 'caida' | 'lesion_grave' | 'emergencia_medica' | 'fuga' | 'fallecimiento' | 'maltrato' | 'accidente_laboral' | 'otro';
export type IncidentSeverity = 'leve' | 'grave' | 'muy_grave' | 'fatal';
export type IncidentStatus = 'abierto' | 'en_seguimiento' | 'cerrado';

export interface IncidentReport {
  id: string;
  date: string;
  time: string;
  residentId?: string;
  residentName?: string;
  type: IncidentReportType;
  severity: IncidentSeverity;
  description: string;
  location: string;
  witnesses: string[];
  actionsTaken: string[];
  familyNotifiedAt?: string;
  familyNotifiedBy?: string;
  doctorNotifiedAt?: string;
  doctorNotifiedBy?: string;
  seremiNotifiedAt?: string;
  seremiNotifiedBy?: string;
  followUp: string;
  reportedBy: string;
  status: IncidentStatus;
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// Legacy interfaces for backward compatibility
export interface Activity {
  type: 'recreativa' | 'fisica' | 'cognitiva';
  description: string;
  duration: string;
  participation: 'activa' | 'pasiva' | 'no_participo';
}

export interface MedicationRecord {
  medicationId: string;
  time: string;
  administered: boolean;
  observations: string;
}

export interface Protocol {
  id: string;
  name: string;
  type: 'ambientes_facilitadores' | 'enfermeria' | 'paliativos' | 'alimentacion' | 'salidas' | 'general';
  checklist: ProtocolItem[];
  createdAt: string;
}

export interface ProtocolItem {
  id: string;
  description: string;
  required: boolean;
  category?: string;
}

export interface ProtocolExecution {
  id: string;
  protocolId: string;
  residentId?: string;
  executionDate: string;
  executedBy: string;
  items: ExecutedProtocolItem[];
  observations: string;
  compliancePercentage: number;
  evaluation: 'optimo' | 'bueno' | 'regular' | 'malo';
}

export interface ExecutedProtocolItem {
  id: string;
  protocolItemId: string;
  completed: boolean;
  observations?: string;
}