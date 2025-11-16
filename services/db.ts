// services/db.ts
import Dexie, { Table } from 'dexie';
import { OfflineQueueItem } from '../types';

// This is required for Dexie to work with the CDN import.
// In a bundled setup, `import Dexie from 'dexie'` would suffice.
declare const Dexie: any;

// Define a type for our generic key-value store
interface KeyVal {
    key: string;
    value: any;
}

export class AppDatabase extends Dexie {
    // Define tables (object stores)
    keyval!: Table<KeyVal, string>; // Key is a string (e.g., 'data', 'users'), Value is a KeyVal object
    offlineQueue!: Table<OfflineQueueItem, string>; // Key is the item's unique id

    constructor() {
        super('NehemiahDB');
        this.version(1).stores({
            keyval: 'key', // Primary key is the 'key' property of the KeyVal object
            offlineQueue: 'id, payload.churchId', // Primary key is 'id', with an index on payload.churchId for efficient querying
        });
    }
}

// Create and export a singleton instance of the database
export const db = new AppDatabase();