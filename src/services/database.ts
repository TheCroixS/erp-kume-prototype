import {
  Resident,
  MedicalRecord,
  CarePlan,
  DailyRecord,
  Protocol,
  ProtocolExecution,
  ResidentFile,
  StaffMember,
  ComplaintRecord,
  ResidentContract,
  OperatingPermit,
  MedicationScheduleRecord,
  MedicationStockItem,
  AuditLogEntry,
  InstitutionalProfile,
  ResourceItem,
  VisitorEntry,
  IncidentReport
} from '../types';

interface ProtocolDocument {
  id: string;
  name: string;
  type: string;
  category: 'ambientes_facilitadores' | 'enfermeria' | 'paliativos' | 'alimentacion' | 'salidas' | 'general' | 'administrativo';
  file: {
    name: string;
    type: string;
    size: number;
    data: string; // base64
  };
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  version?: string;
}

class DatabaseService {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'ELEAMSaltoAngelDB';
  private readonly version = 7; // v7: institutionalProfile, resources, visitorLog, incidentReports
  private initPromise: Promise<void> | null = null;

  private async _getDb(): Promise<IDBDatabase> {
    if (this.db && this.db.objectStoreNames.length > 0) {
      return this.db;
    }

    if (!this.initPromise) {
      this.initPromise = this.init();
    }

    await this.initPromise;

    if (!this.db) {
      throw new Error('Failed to initialize database');
    }

    return this.db;
  }

  async init(): Promise<void> {
    if (this.db && this.db.objectStoreNames.length > 0) {
      return;
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Residents store
        if (!db.objectStoreNames.contains('residents')) {
          const residentsStore = db.createObjectStore('residents', { keyPath: 'id' });
          residentsStore.createIndex('run', 'run', { unique: true });
          residentsStore.createIndex('name', 'name');
          residentsStore.createIndex('status', 'status');
        }

        // Medical records store
        if (!db.objectStoreNames.contains('medicalRecords')) {
          const medicalStore = db.createObjectStore('medicalRecords', { keyPath: 'id' });
          medicalStore.createIndex('residentId', 'residentId', { unique: true });
        }

        // Care plans store
        if (!db.objectStoreNames.contains('carePlans')) {
          const carePlansStore = db.createObjectStore('carePlans', { keyPath: 'id' });
          carePlansStore.createIndex('residentId', 'residentId');
        }

        // Enhanced Daily records store
        if (!db.objectStoreNames.contains('dailyRecords')) {
          const dailyRecordsStore = db.createObjectStore('dailyRecords', { keyPath: 'id' });
          dailyRecordsStore.createIndex('residentId', 'residentId');
          dailyRecordsStore.createIndex('date', 'date');
          dailyRecordsStore.createIndex('shift', 'shift');
          dailyRecordsStore.createIndex('residentDate', ['residentId', 'date']);
          dailyRecordsStore.createIndex('residentDateShift', ['residentId', 'date', 'shift'], { unique: true });
          dailyRecordsStore.createIndex('recordedBy', 'recordedBy');
          dailyRecordsStore.createIndex('recordedAt', 'recordedAt');
        }

        // Protocols store (legacy)
        if (!db.objectStoreNames.contains('protocols')) {
          const protocolsStore = db.createObjectStore('protocols', { keyPath: 'id' });
          protocolsStore.createIndex('type', 'type');
        }

        // Protocol executions store (legacy)
        if (!db.objectStoreNames.contains('protocolExecutions')) {
          const executionsStore = db.createObjectStore('protocolExecutions', { keyPath: 'id' });
          executionsStore.createIndex('protocolId', 'protocolId');
          executionsStore.createIndex('residentId', 'residentId');
          executionsStore.createIndex('executionDate', 'executionDate');
        }

        // Protocol documents store (new)
        if (!db.objectStoreNames.contains('protocolDocuments')) {
          const protocolDocsStore = db.createObjectStore('protocolDocuments', { keyPath: 'id' });
          protocolDocsStore.createIndex('category', 'category');
          protocolDocsStore.createIndex('uploadedAt', 'uploadedAt');
          protocolDocsStore.createIndex('uploadedBy', 'uploadedBy');
        }

        // Backups store for local backup management
        if (!db.objectStoreNames.contains('backups')) {
          const backupsStore = db.createObjectStore('backups', { keyPath: 'id' });
          backupsStore.createIndex('createdAt', 'createdAt');
          backupsStore.createIndex('type', 'type');
        }

        // v5: Staff store (Art. 11-21 Decreto N°20)
        if (!db.objectStoreNames.contains('staff')) {
          const staffStore = db.createObjectStore('staff', { keyPath: 'id' });
          staffStore.createIndex('run', 'run', { unique: true });
          staffStore.createIndex('role', 'role');
          staffStore.createIndex('active', 'active');
        }

        // v5: Complaints store (Art. 29 b Decreto N°20)
        if (!db.objectStoreNames.contains('complaints')) {
          const complaintsStore = db.createObjectStore('complaints', { keyPath: 'id' });
          complaintsStore.createIndex('status', 'status');
          complaintsStore.createIndex('type', 'type');
          complaintsStore.createIndex('date', 'date');
          complaintsStore.createIndex('folio', 'folio', { unique: true });
        }

        // v5: Contracts store (Art. 28 Decreto N°20)
        if (!db.objectStoreNames.contains('contracts')) {
          const contractsStore = db.createObjectStore('contracts', { keyPath: 'id' });
          contractsStore.createIndex('residentId', 'residentId');
          contractsStore.createIndex('status', 'status');
        }

        // v5: Operating permits store (Art. 5-7 Decreto N°20)
        if (!db.objectStoreNames.contains('permits')) {
          const permitsStore = db.createObjectStore('permits', { keyPath: 'id' });
          permitsStore.createIndex('type', 'type');
          permitsStore.createIndex('status', 'status');
          permitsStore.createIndex('expiresAt', 'expiresAt');
        }

        // v6: Medication schedules (Art. 12 b)
        if (!db.objectStoreNames.contains('medicationSchedules')) {
          const medSched = db.createObjectStore('medicationSchedules', { keyPath: 'id' });
          medSched.createIndex('residentId', 'residentId');
          medSched.createIndex('date', 'date');
          medSched.createIndex('administered', 'administered');
        }

        // v6: Medication stock
        if (!db.objectStoreNames.contains('medicationStock')) {
          const medStock = db.createObjectStore('medicationStock', { keyPath: 'id' });
          medStock.createIndex('residentId', 'residentId');
          medStock.createIndex('medicationName', 'medicationName');
        }

        // v6: Audit log
        if (!db.objectStoreNames.contains('auditLog')) {
          const audit = db.createObjectStore('auditLog', { keyPath: 'id' });
          audit.createIndex('entity', 'entity');
          audit.createIndex('performedAt', 'performedAt');
          audit.createIndex('action', 'action');
        }

        // v7: Institutional profile (single record)
        if (!db.objectStoreNames.contains('institutionalProfile')) {
          db.createObjectStore('institutionalProfile', { keyPath: 'id' });
        }

        // v7: Resources inventory (Art. 9-10)
        if (!db.objectStoreNames.contains('resources')) {
          const resStore = db.createObjectStore('resources', { keyPath: 'id' });
          resStore.createIndex('category', 'category');
          resStore.createIndex('condition', 'condition');
          resStore.createIndex('location', 'location');
        }

        // v7: Visitor log (Art. 23)
        if (!db.objectStoreNames.contains('visitorLog')) {
          const visStore = db.createObjectStore('visitorLog', { keyPath: 'id' });
          visStore.createIndex('residentId', 'residentId');
          visStore.createIndex('date', 'date');
          visStore.createIndex('visitorName', 'visitorName');
        }

        // v7: Incident reports (Art. 12 k)
        if (!db.objectStoreNames.contains('incidentReports')) {
          const incStore = db.createObjectStore('incidentReports', { keyPath: 'id' });
          incStore.createIndex('residentId', 'residentId');
          incStore.createIndex('date', 'date');
          incStore.createIndex('type', 'type');
          incStore.createIndex('severity', 'severity');
          incStore.createIndex('status', 'status');
        }
      };
    });
  }

  // Residents methods
  async createResident(resident: Omit<Resident, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newResident: Resident = {
      ...resident,
      id,
      createdAt: now,
      updatedAt: now,
    };

    const transaction = db.transaction(['residents'], 'readwrite');
    const store = transaction.objectStore('residents');
    await store.add(newResident);
    
    return id;
  }

  async getResidents(includeEgressed: boolean = false): Promise<Resident[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['residents'], 'readonly');
    const store = transaction.objectStore('residents');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        let residents = request.result;
        if (!includeEgressed) {
          residents = residents.filter(r => r.status === 'activo');
        }
        resolve(residents);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getResident(id: string): Promise<Resident | null> {
    const db = await this._getDb();
    const transaction = db.transaction(['residents'], 'readonly');
    const store = transaction.objectStore('residents');
    const request = store.get(id);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async updateResident(id: string, updates: Partial<Resident>): Promise<void> {
    const resident = await this.getResident(id);
    if (!resident) throw new Error('Resident not found');

    const db = await this._getDb();
    const updatedResident = {
      ...resident,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const transaction = db.transaction(['residents'], 'readwrite');
    const store = transaction.objectStore('residents');
    await store.put(updatedResident);
  }

  async searchResidents(query: string): Promise<Resident[]> {
    const residents = await this.getResidents();
    const lowerQuery = query.toLowerCase();
    return residents.filter(resident => 
      resident.name.toLowerCase().includes(lowerQuery) ||
      resident.run.toLowerCase().includes(lowerQuery)
    );
  }

  // Medical records methods
  async createOrUpdateMedicalRecord(medicalRecord: MedicalRecord): Promise<void> {
    const db = await this._getDb();
    const transaction = db.transaction(['medicalRecords', 'residents'], 'readwrite');
    const medicalStore = transaction.objectStore('medicalRecords');
    const residentsStore = transaction.objectStore('residents');
    
    return new Promise(async (resolve, reject) => {
      try {
        // Save medical record
        await medicalStore.put(medicalRecord);
        
        // Update resident to mark medical record as complete
        const resident = await this.getResident(medicalRecord.residentId);
        if (resident) {
          const updatedResident = {
            ...resident,
            medicalRecord: true, // Mark as having a medical record
            updatedAt: new Date().toISOString()
          };
          await residentsStore.put(updatedResident);
        }
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  async getMedicalRecord(residentId: string): Promise<MedicalRecord | null> {
    const db = await this._getDb();
    const transaction = db.transaction(['medicalRecords'], 'readonly');
    const store = transaction.objectStore('medicalRecords');
    const index = store.index('residentId');
    const request = index.get(residentId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAllMedicalRecords(): Promise<MedicalRecord[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['medicalRecords'], 'readonly');
    const store = transaction.objectStore('medicalRecords');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Care plans methods
  async createCarePlan(carePlan: Omit<CarePlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newCarePlan: CarePlan = {
      ...carePlan,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // First, get the resident data in a separate transaction
    const resident = await this.getResident(carePlan.residentId);
    if (!resident) {
      throw new Error('Resident not found');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['carePlans', 'residents'], 'readwrite');
      const carePlansStore = transaction.objectStore('carePlans');
      const residentsStore = transaction.objectStore('residents');
      
      transaction.oncomplete = () => {
        resolve(id);
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
      
      transaction.onabort = () => {
        reject(new Error('Transaction was aborted'));
      };

      try {
        // Save care plan
        carePlansStore.add(newCarePlan);
        
        // Update resident to mark care plan as complete
        const updatedResident = {
          ...resident,
          carePlan: true, // Mark as having a care plan
          updatedAt: new Date().toISOString()
        };
        residentsStore.put(updatedResident);
      } catch (error) {
        reject(error);
      }
    });
  }

  async getCarePlansByResident(residentId: string): Promise<CarePlan[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['carePlans'], 'readonly');
    const store = transaction.objectStore('carePlans');
    const index = store.index('residentId');
    const request = index.getAll(residentId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateCarePlan(id: string, updates: Partial<CarePlan>): Promise<void> {
    const db = await this._getDb();
    
    // First, get the care plan and resident data in separate transactions
    const carePlan = await new Promise<CarePlan | null>((resolve, reject) => {
      const transaction = db.transaction(['carePlans'], 'readonly');
      const store = transaction.objectStore('carePlans');
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });

    if (!carePlan) {
      throw new Error('Care plan not found');
    }

    const resident = await this.getResident(carePlan.residentId);
    if (!resident) {
      throw new Error('Resident not found');
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['carePlans', 'residents'], 'readwrite');
      const carePlansStore = transaction.objectStore('carePlans');
      const residentsStore = transaction.objectStore('residents');
      
      transaction.oncomplete = () => {
        resolve();
      };
      
      transaction.onerror = () => {
        reject(transaction.error);
      };
      
      transaction.onabort = () => {
        reject(new Error('Transaction was aborted'));
      };

      try {
        const updatedCarePlan = {
          ...carePlan,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        
        carePlansStore.put(updatedCarePlan);
        
        // Update resident to mark care plan as complete
        const updatedResident = {
          ...resident,
          carePlan: true, // Mark as having a care plan
          updatedAt: new Date().toISOString()
        };
        residentsStore.put(updatedResident);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Enhanced Daily records methods
  async createDailyRecord(record: Omit<DailyRecord, 'id' | 'recordedAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const newRecord: DailyRecord = {
      ...record,
      id,
      recordedAt: new Date().toISOString(),
    };

    const transaction = db.transaction(['dailyRecords'], 'readwrite');
    const store = transaction.objectStore('dailyRecords');
    
    try {
      await store.add(newRecord);
    } catch (error) {
      // If record already exists for this resident/date/shift, update it
      await store.put(newRecord);
    }
    
    return id;
  }

  async getDailyRecordsByResident(residentId: string, startDate?: string, endDate?: string): Promise<DailyRecord[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['dailyRecords'], 'readonly');
    const store = transaction.objectStore('dailyRecords');
    const index = store.index('residentId');
    const request = index.getAll(residentId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        let results = request.result;
        
        if (startDate || endDate) {
          results = results.filter(record => {
            if (startDate && record.date < startDate) return false;
            if (endDate && record.date > endDate) return false;
            return true;
          });
        }
        
        resolve(results.sort((a, b) => {
          // Sort by date desc, then by shift order
          const dateCompare = b.date.localeCompare(a.date);
          if (dateCompare !== 0) return dateCompare;
          
          const shiftOrder = { 'mañana': 1, 'tarde': 2, 'noche': 3 };
          return shiftOrder[b.shift] - shiftOrder[a.shift];
        }));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getDailyRecordsByDate(date: string): Promise<DailyRecord[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['dailyRecords'], 'readonly');
    const store = transaction.objectStore('dailyRecords');
    const index = store.index('date');
    const request = index.getAll(date);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getDailyRecordsByShift(shift: string): Promise<DailyRecord[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['dailyRecords'], 'readonly');
    const store = transaction.objectStore('dailyRecords');
    const index = store.index('shift');
    const request = index.getAll(shift);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getResidentsWithoutRecentActivity(hours: number = 48): Promise<Resident[]> {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);
    const cutoffDateString = cutoffDate.toISOString().split('T')[0];

    const residents = await this.getResidents();
    const inactiveResidents: Resident[] = [];

    for (const resident of residents) {
      const recentRecords = await this.getDailyRecordsByResident(resident.id, cutoffDateString);
      if (recentRecords.length === 0) {
        inactiveResidents.push(resident);
      }
    }

    return inactiveResidents;
  }

  // Analytics methods for daily records
  async getDailyRecordsAnalytics(startDate: string, endDate: string): Promise<any> {
    const db = await this._getDb();
    const transaction = db.transaction(['dailyRecords'], 'readonly');
    const store = transaction.objectStore('dailyRecords');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const allRecords = request.result.filter(record => 
          record.date >= startDate && record.date <= endDate
        );
        
        const analytics = {
          totalRecords: allRecords.length,
          recordsByShift: {
            mañana: allRecords.filter(r => r.shift === 'mañana').length,
            tarde: allRecords.filter(r => r.shift === 'tarde').length,
            noche: allRecords.filter(r => r.shift === 'noche').length
          },
          incidentsByType: {},
          averageWellbeing: 0,
          riskDistribution: {
            bajo: 0,
            medio: 0,
            alto: 0
          }
        };
        
        // Calculate incident statistics
        allRecords.forEach(record => {
          if (record.incidents) {
            record.incidents.forEach(incident => {
              analytics.incidentsByType[incident.type] = 
                (analytics.incidentsByType[incident.type] || 0) + 1;
            });
          }
          
          // Calculate risk distribution
          if (record.qualityIndicators?.fallRisk) {
            analytics.riskDistribution[record.qualityIndicators.fallRisk]++;
          }
        });
        
        resolve(analytics);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Legacy Protocols methods (kept for compatibility)
  async createProtocol(protocol: Omit<Protocol, 'id' | 'createdAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const newProtocol: Protocol = {
      ...protocol,
      id,
      createdAt: new Date().toISOString(),
    };

    const transaction = db.transaction(['protocols'], 'readwrite');
    const store = transaction.objectStore('protocols');
    await store.add(newProtocol);
    
    return id;
  }

  async getProtocols(): Promise<Protocol[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['protocols'], 'readonly');
    const store = transaction.objectStore('protocols');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async createProtocolExecution(execution: Omit<ProtocolExecution, 'id'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const newExecution: ProtocolExecution = {
      ...execution,
      id,
    };

    const transaction = db.transaction(['protocolExecutions'], 'readwrite');
    const store = transaction.objectStore('protocolExecutions');
    await store.add(newExecution);
    
    return id;
  }

  // New Protocol Documents methods
  async saveProtocolDocument(document: ProtocolDocument): Promise<void> {
    const db = await this._getDb();
    const transaction = db.transaction(['protocolDocuments'], 'readwrite');
    const store = transaction.objectStore('protocolDocuments');
    await store.put(document);
  }

  async getProtocolDocuments(): Promise<ProtocolDocument[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['protocolDocuments'], 'readonly');
    const store = transaction.objectStore('protocolDocuments');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const documents = request.result.sort((a, b) => 
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        );
        resolve(documents);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteProtocolDocument(documentId: string): Promise<void> {
    const db = await this._getDb();
    const transaction = db.transaction(['protocolDocuments'], 'readwrite');
    const store = transaction.objectStore('protocolDocuments');
    await store.delete(documentId);
  }

  // Backup methods
  async createBackup(type: 'manual' | 'automatic' = 'manual'): Promise<string> {
    const db = await this._getDb();
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Get all data
    const [residents, medicalRecords, carePlans, dailyRecords, protocols, protocolExecutions, protocolDocuments] = await Promise.all([
      this.getResidents(true),
      this.getAllMedicalRecords(),
      this.getAllCarePlans(),
      this.getAllDailyRecords(),
      this.getProtocols(),
      this.getAllProtocolExecutions(),
      this.getProtocolDocuments()
    ]);

    const backupData = {
      id: backupId,
      type,
      createdAt: timestamp,
      version: this.version,
      data: {
        residents,
        medicalRecords,
        carePlans,
        dailyRecords,
        protocols,
        protocolExecutions,
        protocolDocuments
      },
      metadata: {
        totalResidents: residents.length,
        totalMedicalRecords: medicalRecords.length,
        totalCarePlans: carePlans.length,
        totalDailyRecords: dailyRecords.length,
        totalProtocols: protocols.length,
        totalProtocolExecutions: protocolExecutions.length,
        totalProtocolDocuments: protocolDocuments.length
      }
    };

    // Store backup in IndexedDB
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    await store.add(backupData);

    return backupId;
  }

  async getBackups(): Promise<any[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['backups'], 'readonly');
    const store = transaction.objectStore('backups');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const backups = request.result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(backups);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteBackup(backupId: string): Promise<void> {
    const db = await this._getDb();
    const transaction = db.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    await store.delete(backupId);
  }

  async restoreFromBackup(backupId: string): Promise<void> {
    const db = await this._getDb();
    const transaction = db.transaction(['backups'], 'readonly');
    const store = transaction.objectStore('backups');
    const request = store.get(backupId);
    
    return new Promise((resolve, reject) => {
      request.onsuccess = async () => {
        const backup = request.result;
        if (!backup) {
          reject(new Error('Backup not found'));
          return;
        }

        try {
          // Clear existing data
          await this.clearAllData();
          
          // Restore data
          const { data } = backup;
          
          // Restore residents
          for (const resident of data.residents) {
            await this.createResident(resident);
          }
          
          // Restore medical records
          for (const record of data.medicalRecords) {
            await this.createOrUpdateMedicalRecord(record);
          }
          
          // Restore care plans
          for (const plan of data.carePlans) {
            await this.createCarePlan(plan);
          }
          
          // Restore daily records
          for (const record of data.dailyRecords) {
            await this.createDailyRecord(record);
          }
          
          // Restore protocols
          for (const protocol of data.protocols) {
            await this.createProtocol(protocol);
          }
          
          // Restore protocol executions
          for (const execution of data.protocolExecutions) {
            await this.createProtocolExecution(execution);
          }

          // Restore protocol documents
          if (data.protocolDocuments) {
            for (const document of data.protocolDocuments) {
              await this.saveProtocolDocument(document);
            }
          }
          
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async clearAllData(): Promise<void> {
    const db = await this._getDb();
    const storeNames = ['residents', 'medicalRecords', 'carePlans', 'dailyRecords', 'protocols', 'protocolExecutions', 'protocolDocuments'];
    
    for (const storeName of storeNames) {
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
    }
  }

  private async getAllCarePlans(): Promise<CarePlan[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['carePlans'], 'readonly');
    const store = transaction.objectStore('carePlans');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllDailyRecords(): Promise<DailyRecord[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['dailyRecords'], 'readonly');
    const store = transaction.objectStore('dailyRecords');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllProtocolExecutions(): Promise<ProtocolExecution[]> {
    const db = await this._getDb();
    const transaction = db.transaction(['protocolExecutions'], 'readonly');
    const store = transaction.objectStore('protocolExecutions');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // ── STAFF methods (Art. 11-21) ──────────────────────────────────────────

  async createStaff(member: Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newMember: StaffMember = { ...member, id, createdAt: now, updatedAt: now };
    const tx = db.transaction(['staff'], 'readwrite');
    tx.objectStore('staff').add(newMember);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getStaff(activeOnly = false): Promise<StaffMember[]> {
    const db = await this._getDb();
    const tx = db.transaction(['staff'], 'readonly');
    const req = tx.objectStore('staff').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        let result = req.result as StaffMember[];
        if (activeOnly) result = result.filter(m => m.active);
        resolve(result.sort((a, b) => a.name.localeCompare(b.name)));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getStaffMember(id: string): Promise<StaffMember | null> {
    const db = await this._getDb();
    const tx = db.transaction(['staff'], 'readonly');
    const req = tx.objectStore('staff').get(id);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async updateStaff(id: string, updates: Partial<StaffMember>): Promise<void> {
    const member = await this.getStaffMember(id);
    if (!member) throw new Error('Staff member not found');
    const db = await this._getDb();
    const updated = { ...member, ...updates, updatedAt: new Date().toISOString() };
    const tx = db.transaction(['staff'], 'readwrite');
    tx.objectStore('staff').put(updated);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteStaff(id: string): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['staff'], 'readwrite');
    tx.objectStore('staff').delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── COMPLAINTS methods (Art. 29 b) ───────────────────────────────────────

  async getNextComplaintFolio(): Promise<number> {
    const complaints = await this.getComplaints();
    if (complaints.length === 0) return 1;
    return Math.max(...complaints.map(c => c.folio)) + 1;
  }

  async createComplaint(complaint: Omit<ComplaintRecord, 'id' | 'folio' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const folio = await this.getNextComplaintFolio();
    const newComplaint: ComplaintRecord = { ...complaint, id, folio, createdAt: now, updatedAt: now };
    const tx = db.transaction(['complaints'], 'readwrite');
    tx.objectStore('complaints').add(newComplaint);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getComplaints(): Promise<ComplaintRecord[]> {
    const db = await this._getDb();
    const tx = db.transaction(['complaints'], 'readonly');
    const req = tx.objectStore('complaints').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const result = (req.result as ComplaintRecord[]).sort(
          (a, b) => b.folio - a.folio
        );
        resolve(result);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async updateComplaint(id: string, updates: Partial<ComplaintRecord>): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['complaints'], 'readwrite');
    const store = tx.objectStore('complaints');
    const req = store.get(id);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const existing = req.result;
        if (!existing) { reject(new Error('Complaint not found')); return; }
        store.put({ ...existing, ...updates, updatedAt: new Date().toISOString() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ── CONTRACTS methods (Art. 28) ──────────────────────────────────────────

  async createContract(contract: Omit<ResidentContract, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newContract: ResidentContract = { ...contract, id, createdAt: now, updatedAt: now };
    const tx = db.transaction(['contracts'], 'readwrite');
    tx.objectStore('contracts').add(newContract);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getContracts(): Promise<ResidentContract[]> {
    const db = await this._getDb();
    const tx = db.transaction(['contracts'], 'readonly');
    const req = tx.objectStore('contracts').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as ResidentContract[]);
      req.onerror = () => reject(req.error);
    });
  }

  async getContractByResident(residentId: string): Promise<ResidentContract | null> {
    const contracts = await this.getContracts();
    return contracts.find(c => c.residentId === residentId && c.status === 'activo') || null;
  }

  async updateContract(id: string, updates: Partial<ResidentContract>): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['contracts'], 'readwrite');
    const store = tx.objectStore('contracts');
    const req = store.get(id);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const existing = req.result;
        if (!existing) { reject(new Error('Contract not found')); return; }
        store.put({ ...existing, ...updates, updatedAt: new Date().toISOString() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ── PERMITS methods (Art. 5-7) ───────────────────────────────────────────

  async createPermit(permit: Omit<OperatingPermit, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const newPermit: OperatingPermit = { ...permit, id, createdAt: now, updatedAt: now };
    const tx = db.transaction(['permits'], 'readwrite');
    tx.objectStore('permits').add(newPermit);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getPermits(): Promise<OperatingPermit[]> {
    const db = await this._getDb();
    const tx = db.transaction(['permits'], 'readonly');
    const req = tx.objectStore('permits').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as OperatingPermit[]);
      req.onerror = () => reject(req.error);
    });
  }

  async updatePermit(id: string, updates: Partial<OperatingPermit>): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['permits'], 'readwrite');
    const store = tx.objectStore('permits');
    const req = store.get(id);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const existing = req.result;
        if (!existing) { reject(new Error('Permit not found')); return; }
        store.put({ ...existing, ...updates, updatedAt: new Date().toISOString() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deletePermit(id: string): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['permits'], 'readwrite');
    tx.objectStore('permits').delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── MEDICATION SCHEDULES (Art. 12 b) ────────────────────────────────────

  async createMedicationSchedule(record: Omit<MedicationScheduleRecord, 'id' | 'createdAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const newRecord: MedicationScheduleRecord = { ...record, id, createdAt: new Date().toISOString() };
    const tx = db.transaction(['medicationSchedules'], 'readwrite');
    tx.objectStore('medicationSchedules').add(newRecord);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMedicationSchedules(date?: string): Promise<MedicationScheduleRecord[]> {
    const db = await this._getDb();
    const tx = db.transaction(['medicationSchedules'], 'readonly');
    const req = date
      ? tx.objectStore('medicationSchedules').index('date').getAll(date)
      : tx.objectStore('medicationSchedules').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as MedicationScheduleRecord[]);
      req.onerror = () => reject(req.error);
    });
  }

  async getMedicationSchedulesByResident(residentId: string): Promise<MedicationScheduleRecord[]> {
    const db = await this._getDb();
    const tx = db.transaction(['medicationSchedules'], 'readonly');
    const req = tx.objectStore('medicationSchedules').index('residentId').getAll(residentId);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as MedicationScheduleRecord[]);
      req.onerror = () => reject(req.error);
    });
  }

  async updateMedicationSchedule(id: string, updates: Partial<MedicationScheduleRecord>): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['medicationSchedules'], 'readwrite');
    const store = tx.objectStore('medicationSchedules');
    const req = store.get(id);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const existing = req.result;
        if (!existing) { reject(new Error('Record not found')); return; }
        store.put({ ...existing, ...updates });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ── MEDICATION STOCK ─────────────────────────────────────────────────────

  async upsertMedicationStock(item: Omit<MedicationStockItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<string> {
    const db = await this._getDb();
    const now = new Date().toISOString();
    const id = item.id || crypto.randomUUID();
    const record: MedicationStockItem = { ...item, id, createdAt: now, updatedAt: now };
    const tx = db.transaction(['medicationStock'], 'readwrite');
    tx.objectStore('medicationStock').put(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMedicationStock(): Promise<MedicationStockItem[]> {
    const db = await this._getDb();
    const tx = db.transaction(['medicationStock'], 'readonly');
    const req = tx.objectStore('medicationStock').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as MedicationStockItem[]);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteMedicationStock(id: string): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['medicationStock'], 'readwrite');
    tx.objectStore('medicationStock').delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── AUDIT LOG ────────────────────────────────────────────────────────────

  async addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'performedAt'>): Promise<void> {
    const db = await this._getDb();
    const record: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      performedAt: new Date().toISOString()
    };
    const tx = db.transaction(['auditLog'], 'readwrite');
    tx.objectStore('auditLog').add(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getAuditLog(limit = 100): Promise<AuditLogEntry[]> {
    const db = await this._getDb();
    const tx = db.transaction(['auditLog'], 'readonly');
    const req = tx.objectStore('auditLog').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const sorted = (req.result as AuditLogEntry[]).sort(
          (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
        );
        resolve(sorted.slice(0, limit));
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ── INSTITUTIONAL PROFILE (Art. 1-4, 8, 30) ────────────────────────────────

  async getInstitutionalProfile(): Promise<InstitutionalProfile | null> {
    const db = await this._getDb();
    const tx = db.transaction(['institutionalProfile'], 'readonly');
    const req = tx.objectStore('institutionalProfile').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result[0] || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveInstitutionalProfile(profile: Omit<InstitutionalProfile, 'updatedAt'>): Promise<void> {
    const db = await this._getDb();
    const record: InstitutionalProfile = { ...profile, id: 'profile', updatedAt: new Date().toISOString() };
    const tx = db.transaction(['institutionalProfile'], 'readwrite');
    tx.objectStore('institutionalProfile').put(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── RESOURCES (Art. 9-10) ────────────────────────────────────────────────

  async createResource(item: Omit<ResourceItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: ResourceItem = { ...item, id, createdAt: now, updatedAt: now };
    const tx = db.transaction(['resources'], 'readwrite');
    tx.objectStore('resources').add(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getResources(category?: string): Promise<ResourceItem[]> {
    const db = await this._getDb();
    const tx = db.transaction(['resources'], 'readonly');
    const req = category
      ? tx.objectStore('resources').index('category').getAll(category)
      : tx.objectStore('resources').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve((req.result as ResourceItem[]).sort((a, b) => a.name.localeCompare(b.name)));
      req.onerror = () => reject(req.error);
    });
  }

  async updateResource(id: string, updates: Partial<ResourceItem>): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['resources'], 'readwrite');
    const store = tx.objectStore('resources');
    const req = store.get(id);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const existing = req.result;
        if (!existing) { reject(new Error('Resource not found')); return; }
        store.put({ ...existing, ...updates, updatedAt: new Date().toISOString() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async deleteResource(id: string): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['resources'], 'readwrite');
    tx.objectStore('resources').delete(id);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // ── VISITOR LOG (Art. 23) ────────────────────────────────────────────────

  async createVisitorEntry(entry: Omit<VisitorEntry, 'id' | 'createdAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const record: VisitorEntry = { ...entry, id, createdAt: new Date().toISOString() };
    const tx = db.transaction(['visitorLog'], 'readwrite');
    tx.objectStore('visitorLog').add(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getVisitorLog(date?: string): Promise<VisitorEntry[]> {
    const db = await this._getDb();
    const tx = db.transaction(['visitorLog'], 'readonly');
    const req = date
      ? tx.objectStore('visitorLog').index('date').getAll(date)
      : tx.objectStore('visitorLog').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const sorted = (req.result as VisitorEntry[]).sort(
          (a, b) => b.entryTime.localeCompare(a.entryTime)
        );
        resolve(sorted);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getVisitorLogByResident(residentId: string): Promise<VisitorEntry[]> {
    const db = await this._getDb();
    const tx = db.transaction(['visitorLog'], 'readonly');
    const req = tx.objectStore('visitorLog').index('residentId').getAll(residentId);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result as VisitorEntry[]);
      req.onerror = () => reject(req.error);
    });
  }

  async updateVisitorEntry(id: string, updates: Partial<VisitorEntry>): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['visitorLog'], 'readwrite');
    const store = tx.objectStore('visitorLog');
    const req = store.get(id);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const existing = req.result;
        if (!existing) { reject(new Error('Entry not found')); return; }
        store.put({ ...existing, ...updates });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // ── INCIDENT REPORTS (Art. 12 k) ─────────────────────────────────────────

  async createIncidentReport(report: Omit<IncidentReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const db = await this._getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const record: IncidentReport = { ...report, id, createdAt: now, updatedAt: now };
    const tx = db.transaction(['incidentReports'], 'readwrite');
    tx.objectStore('incidentReports').add(record);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(id);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getIncidentReports(): Promise<IncidentReport[]> {
    const db = await this._getDb();
    const tx = db.transaction(['incidentReports'], 'readonly');
    const req = tx.objectStore('incidentReports').getAll();
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const sorted = (req.result as IncidentReport[]).sort(
          (a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`)
        );
        resolve(sorted);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async updateIncidentReport(id: string, updates: Partial<IncidentReport>): Promise<void> {
    const db = await this._getDb();
    const tx = db.transaction(['incidentReports'], 'readwrite');
    const store = tx.objectStore('incidentReports');
    const req = store.get(id);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => {
        const existing = req.result;
        if (!existing) { reject(new Error('Incident not found')); return; }
        store.put({ ...existing, ...updates, updatedAt: new Date().toISOString() });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      };
      req.onerror = () => reject(req.error);
    });
  }

  // Export functionality
  async exportAllData(): Promise<Blob> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Create a backup and export it
    const backupId = await this.createBackup('manual');
    const backups = await this.getBackups();
    const backup = backups.find(b => b.id === backupId);

    if (backup) {
      zip.file('backup.json', JSON.stringify(backup, null, 2));
      zip.file('README.txt', `
ELEAM - Salto del Ángel
Respaldo completo del sistema
Fecha de creación: ${new Date().toLocaleString('es-CL')}

Contenido:
- ${backup.metadata.totalResidents} residentes
- ${backup.metadata.totalMedicalRecords} fichas clínicas
- ${backup.metadata.totalCarePlans} planes de atención
- ${backup.metadata.totalDailyRecords} registros diarios
- ${backup.metadata.totalProtocols} protocolos
- ${backup.metadata.totalProtocolExecutions} ejecuciones de protocolos
- ${backup.metadata.totalProtocolDocuments || 0} documentos de protocolos

Para restaurar este respaldo, utilice la función de importación en el sistema ELEAM.
      `);
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  async exportResidentData(residentId: string): Promise<Blob> {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    // Get resident data
    const resident = await this.getResident(residentId);
    if (!resident) throw new Error('Resident not found');

    zip.file('resident.json', JSON.stringify(resident, null, 2));

    // Get medical record
    const medicalRecord = await this.getMedicalRecord(residentId);
    if (medicalRecord) {
      zip.file('medical_record.json', JSON.stringify(medicalRecord, null, 2));
    }

    // Get care plans
    const carePlans = await this.getCarePlansByResident(residentId);
    if (carePlans.length > 0) {
      zip.file('care_plans.json', JSON.stringify(carePlans, null, 2));
    }

    // Get daily records
    const dailyRecords = await this.getDailyRecordsByResident(residentId);
    if (dailyRecords.length > 0) {
      zip.file('daily_records.json', JSON.stringify(dailyRecords, null, 2));
    }

    // Add files
    if (resident.files && resident.files.length > 0) {
      const filesFolder = zip.folder('files');
      resident.files.forEach(file => {
        const binaryData = atob(file.data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        filesFolder?.file(file.name, bytes);
      });
    }

    // Add README
    zip.file('README.txt', `
ELEAM - Datos del Residente
${resident.name} (RUN: ${resident.run})
Fecha de exportación: ${new Date().toLocaleString('es-CL')}

Contenido:
- Información personal del residente
- Ficha clínica completa
- Planes de atención
- Registros diarios (${dailyRecords.length} registros)
- Documentos adjuntos

Este archivo contiene información médica confidencial.
Manténgalo seguro y respete la privacidad del residente.
    `);

    return await zip.generateAsync({ type: 'blob' });
  }
}

export const db = new DatabaseService();