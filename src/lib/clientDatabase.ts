import { getClientInitialSeedData, ClientDatabaseSchema } from './clientSeedData.js';

const CLIENT_DB_KEY = 'skillbridge_client_db_v1';

class ClientDatabaseManager {
  private data: ClientDatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): ClientDatabaseSchema {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(CLIENT_DB_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.users && parsed.courses && parsed.skills) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read client db from localStorage, using fresh seed:', e);
    }

    const fresh = getClientInitialSeedData();
    this.saveDataDirect(fresh);
    return fresh;
  }

  private saveDataDirect(dataToSave: ClientDatabaseSchema) {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(CLIENT_DB_KEY, JSON.stringify(dataToSave));
      }
    } catch (e) {
      console.warn('Failed saving client db to localStorage:', e);
    }
  }

  public get db(): ClientDatabaseSchema {
    return this.data;
  }

  public save(): void {
    this.saveDataDirect(this.data);
  }

  public resetToSeed(): ClientDatabaseSchema {
    this.data = getClientInitialSeedData();
    this.save();
    return this.data;
  }
}

export const clientDatabase = new ClientDatabaseManager();
